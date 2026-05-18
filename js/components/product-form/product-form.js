import "../product-camera-modal/product-camera-modal.js";
import "../product-price-history-editor/product-price-history-editor.js";
import "../product-tags-modal/product-tags-modal.js";
import { normalizeTagList } from "../../utils/tag-utils.js";

const template = document.createElement("template");
template.innerHTML = `
  <section class="card">
    <h2 id="title">Cadastrar produto</h2>
    <form class="field-grid" novalidate>
      <div class="field">
        <label for="barcode">Codigo de barras</label>
        <input id="barcode" name="barcode" type="text" inputmode="numeric" maxlength="64" />
      </div>
      <div class="field">
        <label for="name">Produto</label>
        <input id="name" name="name" type="text" maxlength="120" required />
      </div>
      <div class="field">
        <label for="image">Imagem do produto</label>
        <div class="field-media-picker">
          <input id="image" name="image" type="file" accept="image/*" />
          <button class="btn btn-secondary btn-camera" type="button" data-action="open-camera" aria-label="Tirar foto com a camera">
            Camera
          </button>
        </div>
        <div class="field-media-status" data-role="image-status" hidden></div>
      </div>
      <div class="field-row field-row--stock">
        <div class="field">
          <label for="quantity">Quantidade</label>
          <input id="quantity" name="quantity" type="number" min="0" step="1" required />
        </div>
        <div class="field">
          <label for="weight">Peso</label>
          <input id="weight" name="weight" type="number" min="0" step="0.01" />
        </div>
        <div class="field">
          <label for="weightUnit">Unid.</label>
          <select id="weightUnit" name="weightUnit">
            <option value="g">g</option>
            <option value="kg">kg</option>
          </select>
        </div>
      </div>
      <div class="field-row field-row--dates">
        <div class="field">
          <label for="manufacturedAt">Fabricacao item mais antigo</label>
          <input id="manufacturedAt" name="manufacturedAt" type="date" />
        </div>
        <div class="field">
          <label for="shelfLifeMonths">Validade em meses</label>
          <input id="shelfLifeMonths" name="shelfLifeMonths" type="number" min="0" step="1" inputmode="numeric" />
        </div>
      </div>
      <div class="field">
        <label for="notes">Observacoes</label>
        <textarea id="notes" name="notes" rows="3" maxlength="300"></textarea>
      </div>
      <div class="field">
        <product-price-history-editor></product-price-history-editor>
      </div>
      <div class="field">
        <div class="field-history-header">
          <label>Tags</label>
          <button class="btn btn-secondary btn-history-add" type="button" data-action="open-tags-modal">Gerenciar tags</button>
        </div>
        <div class="tags-preview" data-role="tags-preview"></div>
        <div class="field-media-status" data-role="tags-status">Nenhuma tag adicionada.</div>
      </div>
      <div class="actions">
        <button class="btn btn-primary" type="submit">Salvar</button>
        <button class="btn btn-secondary" type="button" data-action="reset">Limpar</button>
      </div>
      <div class="feedback" hidden></div>
    </form>
  </section>
  <product-tags-modal></product-tags-modal>
  <product-camera-modal></product-camera-modal>
`;

export class ProductForm extends HTMLElement {
  #editingProduct = null;
  #selectedImage = "";
  #tags = [];
  #availableTags = [];

  constructor() {
    super();
    this.appendChild(template.content.cloneNode(true));
    this.form = this.querySelector("form");
    this.titleElement = this.querySelector("#title");
    this.feedback = this.querySelector(".feedback");
    this.imageInput = this.querySelector("#image");
    this.imageStatus = this.querySelector('[data-role="image-status"]');
    this.priceHistoryEditor = this.querySelector("product-price-history-editor");
    this.tagsPreview = this.querySelector('[data-role="tags-preview"]');
    this.tagsStatus = this.querySelector('[data-role="tags-status"]');
    this.tagsModal = this.querySelector("product-tags-modal");
    this.cameraModal = this.querySelector("product-camera-modal");
  }

  connectedCallback() {
    this.form.addEventListener("submit", this.#handleSubmit);
    this.querySelector('[data-action="reset"]').addEventListener("click", () => this.reset());
    this.imageInput.addEventListener("change", this.#handleImageChange);
    this.addEventListener("camera-photo-captured", this.#handleCameraPhotoCaptured);
    this.addEventListener("product-tags-save", this.#handleTagsSave);
    this.addEventListener("click", this.#handleClick);
  }

  disconnectedCallback() {
    this.form.removeEventListener("submit", this.#handleSubmit);
    this.imageInput.removeEventListener("change", this.#handleImageChange);
    this.removeEventListener("camera-photo-captured", this.#handleCameraPhotoCaptured);
    this.removeEventListener("product-tags-save", this.#handleTagsSave);
    this.removeEventListener("click", this.#handleClick);
  }

  set product(value) {
    this.#editingProduct = value;
    this.#syncForm();
  }

  get product() {
    return this.#editingProduct;
  }

  set availableTags(value) {
    this.#availableTags = Array.isArray(value)
      ? value.map((tag) => String(tag ?? "").trim()).filter(Boolean)
      : [];
  }

  focusBarcode() {
    this.form.elements.namedItem("barcode")?.focus();
  }

  reset() {
    this.#editingProduct = null;
    this.#selectedImage = "";
    this.#tags = [];
    this.form.reset();
    this.titleElement.textContent = "Cadastrar produto";
    this.#setFeedback("", "");
    this.#setImageStatus("");
    this.priceHistoryEditor.reset();
    this.#renderTags();
    this.tagsModal.close();
    this.cameraModal.close();
  }

  showMessage(message, variant = "success") {
    this.#setFeedback(message, variant);
  }

  #syncForm() {
    const product = this.#editingProduct;

    if (!product) {
      this.reset();
      return;
    }

    this.titleElement.textContent = `Editar produto #${product.id}`;
    this.form.elements.namedItem("name").value = product.name ?? "";
    this.form.elements.namedItem("barcode").value = product.barcode ?? "";
    this.form.elements.namedItem("quantity").value = String(product.quantity ?? 0);
    this.form.elements.namedItem("weight").value = product.weight ?? "";
    this.form.elements.namedItem("weightUnit").value = product.weightUnit ?? "g";
    this.form.elements.namedItem("manufacturedAt").value = product.manufacturedAt ?? "";
    this.form.elements.namedItem("shelfLifeMonths").value =
      product.shelfLifeMonths === null || product.shelfLifeMonths === undefined ? "" : String(product.shelfLifeMonths);
    this.form.elements.namedItem("notes").value = product.notes ?? "";
    this.#selectedImage = product.image ?? "";
    this.priceHistoryEditor.entries = Array.isArray(product.priceHistory) ? product.priceHistory : [];
    this.#tags = Array.isArray(product.tags)
      ? product.tags.map((tag) => String(tag ?? "").trim()).filter(Boolean)
      : [];
    this.#setImageStatus(this.#selectedImage ? "Imagem atual carregada." : "");
    this.#renderTags();
    this.#setFeedback("Modo de edicao ativo.", "success");
  }

  #setFeedback(message, variant) {
    if (!message) {
      this.feedback.hidden = true;
      this.feedback.textContent = "";
      this.feedback.dataset.variant = "";
      return;
    }

    this.feedback.hidden = false;
    this.feedback.textContent = message;
    this.feedback.dataset.variant = variant;
  }

  async #readSelectedFile() {
    const file = this.imageInput?.files?.[0];

    if (!file) {
      return this.#selectedImage;
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("Falha ao ler a imagem selecionada."));
      reader.readAsDataURL(file);
    });
  }

  #setImageStatus(message) {
    if (!message) {
      this.imageStatus.hidden = true;
      this.imageStatus.textContent = "";
      return;
    }

    this.imageStatus.hidden = false;
    this.imageStatus.textContent = message;
  }

  #renderTags() {
    this.tagsPreview.innerHTML = "";

    if (!this.#tags.length) {
      this.tagsStatus.textContent = "Nenhuma tag adicionada.";
      return;
    }

    this.tagsStatus.textContent = `${this.#tags.length} tag(s) adicionada(s).`;

    this.#tags.forEach((tag) => {
      const chip = document.createElement("span");
      chip.className = "tags-preview__chip";
      chip.textContent = tag;
      this.tagsPreview.appendChild(chip);
    });
  }

  async #openCameraModal() {
    try {
      await this.cameraModal.open();
    } catch (error) {
      console.error(error);
      this.#setFeedback(error.message || "Nao foi possivel acessar a camera.", "error");
    }
  }

  #handleClick = (event) => {
    const button = event.target.closest("button[data-action]");

    if (!button || !this.contains(button)) {
      return;
    }

    switch (button.dataset.action) {
      case "open-camera":
        this.#openCameraModal();
        break;
      case "open-tags-modal":
        this.tagsModal.open({
          availableTags: this.#availableTags,
          selectedTags: this.#tags,
        });
        break;
      default:
        break;
    }
  };

  #handleImageChange = () => {
    const file = this.imageInput.files?.[0];
    this.#setImageStatus(file ? `Arquivo selecionado: ${file.name}` : "");
  };

  #handleCameraPhotoCaptured = (event) => {
    this.#selectedImage = event.detail.imageData ?? "";
    this.imageInput.value = "";
    this.#setImageStatus("Foto capturada com a camera.");
    this.#setFeedback("Foto do produto capturada com sucesso.", "success");
  };

  #handleTagsSave = (event) => {
    this.#tags = normalizeTagList(event.detail.tags ?? []);
    this.#renderTags();
    this.#setFeedback("Tags atualizadas com sucesso.", "success");
  };

  #handleSubmit = async (event) => {
    event.preventDefault();

    const formData = new FormData(this.form);
    const name = String(formData.get("name") ?? "").trim();
    const barcode = String(formData.get("barcode") ?? "").trim();
    const quantity = Number(formData.get("quantity") ?? 0);
    const weightRaw = String(formData.get("weight") ?? "").trim();
    const weight = weightRaw ? Number(weightRaw) : null;
    const manufacturedAt = String(formData.get("manufacturedAt") ?? "").trim();
    const shelfLifeMonthsRaw = String(formData.get("shelfLifeMonths") ?? "").trim();
    const shelfLifeMonths = shelfLifeMonthsRaw ? Number(shelfLifeMonthsRaw) : null;

    if (!name) {
      this.#setFeedback("Informe o nome do produto.", "error");
      return;
    }

    if (!Number.isFinite(quantity) || quantity < 0) {
      this.#setFeedback("Quantidade invalida.", "error");
      return;
    }

    if (weightRaw && (!Number.isFinite(weight) || weight < 0)) {
      this.#setFeedback("Peso invalido.", "error");
      return;
    }

    if (manufacturedAt && Number.isNaN(new Date(`${manufacturedAt}T00:00:00`).getTime())) {
      this.#setFeedback("Data de fabricacao invalida.", "error");
      return;
    }

    if (shelfLifeMonthsRaw && (!Number.isInteger(shelfLifeMonths) || shelfLifeMonths < 0)) {
      this.#setFeedback("Validade em meses invalida.", "error");
      return;
    }

    let priceHistory = [];

    let image = this.#selectedImage;

    try {
      image = await this.#readSelectedFile();
      priceHistory = this.priceHistoryEditor.normalize();
    } catch (error) {
      this.#setFeedback(error.message || "Nao foi possivel ler a imagem selecionada.", "error");
      return;
    }

    const now = new Date().toISOString();
    const product = {
      ...(this.#editingProduct ?? {}),
      name,
      barcode,
      image,
      quantity,
      weight,
      weightUnit: String(formData.get("weightUnit") ?? "g"),
      manufacturedAt,
      shelfLifeMonths,
      tags: normalizeTagList(this.#tags),
      priceHistory,
      notes: String(formData.get("notes") ?? "").trim(),
      createdAt: this.#editingProduct?.createdAt ?? now,
      updatedAt: now,
    };

    this.dispatchEvent(
      new CustomEvent("save-product", {
        bubbles: true,
        composed: true,
        detail: product,
      }),
    );
  };
}

customElements.define("product-form", ProductForm);
