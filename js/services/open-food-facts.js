import { appConfig } from "../config/app-config.js";

function buildProductLookupUrl(barcode) {
  const fields = encodeURIComponent(appConfig.OPEN_FOOD_FACTS_FIELDS.join(","));
  return `${appConfig.OPEN_FOOD_FACTS_API_BASE_URL}/${encodeURIComponent(barcode)}.json?fields=${fields}`;
}

async function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Falha ao converter a imagem do produto."));
    reader.readAsDataURL(blob);
  });
}

async function downloadImageAsDataUrl(imageUrl, options = {}) {
  if (!imageUrl) {
    return "";
  }

  const response = await fetch(imageUrl, {
    signal: options.signal,
  });

  if (!response.ok) {
    throw new Error("Falha ao baixar a imagem do produto.");
  }

  const blob = await response.blob();
  return blobToDataUrl(blob);
}

export function normalizeBarcode(value) {
  return String(value ?? "").replaceAll(/\s+/g, "");
}

export function parseOpenFoodFactsQuantity(value) {
  const match = String(value ?? "")
    .trim()
    .match(/^(\d+(?:[.,]\d+)?)\s*(g|kg)$/i);

  if (!match) {
    return null;
  }

  const amount = Number(match[1].replace(",", "."));
  const unit = match[2].toLowerCase();

  if (!Number.isFinite(amount)) {
    return null;
  }

  return {
    weight: amount,
    weightUnit: unit,
  };
}

export function mapOpenFoodFactsProduct(product) {
  const name =
    String(product?.product_name_pt ?? "").trim() ||
    String(product?.product_name ?? "").trim() ||
    String(product?.generic_name_pt ?? "").trim() ||
    String(product?.generic_name ?? "").trim();
  const image = String(product?.image_front_url ?? "").trim() || String(product?.image_url ?? "").trim();

  return {
    name,
    image,
    quantity: parseOpenFoodFactsQuantity(product?.quantity),
  };
}

export async function fetchProductByBarcode(barcode, options = {}) {
  const normalizedBarcode = normalizeBarcode(barcode);

  if (!appConfig.OPEN_FOOD_FACTS_ENABLED) {
    return {
      found: false,
      disabled: true,
      barcode: normalizedBarcode,
      product: null,
    };
  }

  if (normalizedBarcode.length < Number(appConfig.BARCODE_LOOKUP_MIN_LENGTH ?? 8)) {
    return {
      found: false,
      barcode: normalizedBarcode,
      product: null,
    };
  }

  const response = await fetch(buildProductLookupUrl(normalizedBarcode), {
    signal: options.signal,
  });

  if (!response.ok) {
    throw new Error("Falha ao consultar a Open Food Facts.");
  }

  const data = await response.json();
  const hasProduct = data?.status === 1 && Boolean(data.product);
  const mappedProduct = hasProduct ? mapOpenFoodFactsProduct(data.product) : null;

  if (mappedProduct?.image) {
    try {
      mappedProduct.imageDataUrl = await downloadImageAsDataUrl(mappedProduct.image, options);
    } catch {
      mappedProduct.imageDataUrl = "";
    }
  }

  return {
    found: hasProduct,
    barcode: normalizedBarcode,
    product: data?.product ?? null,
    mappedProduct,
  };
}
