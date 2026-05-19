const DEFAULT_APP_ENV = {
  OPEN_FOOD_FACTS_ENABLED: true,
  OPEN_FOOD_FACTS_API_BASE_URL: "https://world.openfoodfacts.net/api/v2/product",
  OPEN_FOOD_FACTS_FIELDS: [
    "product_name",
    "product_name_pt",
    "generic_name",
    "generic_name_pt",
    "quantity",
    "image_front_url",
    "image_url",
  ],
  BARCODE_LOOKUP_MIN_LENGTH: 8,
  BARCODE_LOOKUP_DEBOUNCE_MS: 550,
};

function readRuntimeEnv() {
  if (typeof window === "undefined" || !window.__APP_ENV__ || typeof window.__APP_ENV__ !== "object") {
    return {};
  }

  return window.__APP_ENV__;
}

const runtimeEnv = readRuntimeEnv();

export const appConfig = {
  ...DEFAULT_APP_ENV,
  ...runtimeEnv,
  OPEN_FOOD_FACTS_FIELDS: Array.isArray(runtimeEnv.OPEN_FOOD_FACTS_FIELDS)
    ? runtimeEnv.OPEN_FOOD_FACTS_FIELDS
    : DEFAULT_APP_ENV.OPEN_FOOD_FACTS_FIELDS,
};
