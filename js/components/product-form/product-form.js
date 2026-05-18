import "../product-camera-modal/product-camera-modal.js";

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
      <div class="field">
        <label for="quantity">Quantidade</label>
        <input id="quantity" name="quantity" type="number" min="0" step="1" required />
      </div>
      <div class="field field-inline">
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
      <div class="field">
        <label for="notes">Observacoes</label>
        <textarea id="notes" name="notes" rows="3" maxlength="300"></textarea>
      </div>
      <div class="field">
        <div class="field-history-header">
          <label>Historico de preco</label>
          <button class="btn btn-secondary btn-history-add" type="button" data-action="add-price-history">Adicionar preco</button>
        </div>
        <div class="price-history-list" data-role="price-history-list"></div>
        <div class="field-media-status" data-role="price-history-status">Nenhum preco registrado.</div>
      </div>
      <div class="actions">
        <button class="btn btn-primary" type="submit">Salvar</button>
        <button class="btn btn-secondary" type="button" data-action="reset">Limpar</button>
      </div>
      <div class="feedback" hidden></div>
    </form>
  </section>
  <product-camera-modal></product-camera-modal>
`;

export class ProductForm extends HTMLElement {
  #editingProduct = null;
  #selectedImage = "";
  #priceHistory = [];

  constructor() {
    super();
    this.appendChild(template.content.cloneNode(true));
    this.form = this.querySelector("form");
    this.titleElement = this.querySelector("#title");
    this.feedback = this.querySelector(".feedback");
    this.imageInput = this.querySelector("#image");
    this.imageStatus = this.querySelector('[data-role="image-status"]');
    this.priceHistoryList = this.querySelector('[data-role="price-history-list"]');
    this.priceHistoryStatus = this.querySelector('[data-role="price-history-status"]');
    this.cameraModal = this.querySelector("product-camera-modal");
  }

  connectedCallback() {
    this.form.addEventListener("submit", this.#handleSubmit);
    this.form.addEventListener("input", this.#handleInput);
    this.querySelector('[data-action="reset"]').addEventListener("click", () => this.reset());
    this.imageInput.addEventListener("change", this.#handleImageChange);
    this.addEventListener("camera-photo-captured", this.#handleCameraPhotoCaptured);
    this.addEventListener("click", this.#handleClick);
  }

  disconnectedCallback() {
    this.form.removeEventListener("submit", this.#handleSubmit);
    this.form.removeEventListener("input", this.#handleInput);
    this.imageInput.removeEventListener("change", this.#handleImageChange);
    this.removeEventListener("camera-photo-captured", this.#handleCameraPhotoCaptured);
    this.removeEventListener("click", this.#handleClick);
  }

  set product(value) {
    this.#editingProduct = value;
    this.#syncForm();
  }

  get product() {
    return this.#editingProduct;
  }

  focusBarcode() {
    this.form.elements.namedItem("barcode")?.focus();
  }

  reset() {
    this.#editingProduct = null;
    this.#selectedImage = "";
    this.#priceHistory = [];
    this.form.reset();
    this.titleElement.textContent = "Cadastrar produto";
    this.#setFeedback("", "");
    this.#setImageStatus("");
    this.#renderPriceHistory();
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
    this.form.elements.namedItem("notes").value = product.notes ?? "";
    this.#selectedImage = product.image ?? "";
    this.#priceHistory = Array.isArray(product.priceHistory)
      ? product.priceHistory.map((entry) => ({
          date: entry.date ?? "",
          price: entry.price ?? "",
        }))
      : [];
    this.#setImageStatus(this.#selectedImage ? "Imagem atual carregada." : "");
    this.#renderPriceHistory();
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

  #renderPriceHistory() {
    this.priceHistoryList.innerHTML = "";

    if (!this.#priceHistory.length) {
      this.priceHistoryStatus.textContent = "Nenhum preco registrado.";
      return;
    }

    this.priceHistoryStatus.textContent = `${this.#priceHistory.length} preco(s) registrado(s).`;

    this.#priceHistory.forEach((entry, index) => {
      const row = document.createElement("div");
      row.className = "price-history-row";
      row.innerHTML = `
        <input type="date" value="${entry.date ?? ""}" data-action="change-price-history-date" data-index="${index}" aria-label="Data do preco ${index + 1}" />
        <input type="number" min="0" step="0.01" inputmode="decimal" value="${entry.price ?? ""}" data-action="change-price-history-value" data-index="${index}" aria-label="Valor do preco ${index + 1}" placeholder="Valor em reais" />
        <button class="btn btn-danger btn-history-remove" type="button" data-action="remove-price-history" data-index="${index}" aria-label="Remover preco ${index + 1}">
          Remover
        </button>
      `;
      this.priceHistoryList.appendChild(row);
    });
  }

  #addPriceHistoryEntry() {
    this.#priceHistory.push({
      date: "",
      price: "",
    });
    this.#renderPriceHistory();
  }

  #updatePriceHistoryEntry(index, key, value) {
    const entry = this.#priceHistory[index];

    if (!entry) {
      return;
    }

    entry[key] = value;
  }

  #removePriceHistoryEntry(index) {
    this.#priceHistory.splice(index, 1);
    this.#renderPriceHistory();
  }

  #normalizePriceHistory() {
    const normalized = [];

    for (const entry of this.#priceHistory) {
      const date = String(entry.date ?? "").trim();
      const priceRaw = String(entry.price ?? "").trim();

      if (!date && !priceRaw) {
        continue;
      }

      const price = Number(priceRaw);

      if (!date) {
        throw new Error("Informe a data em todos os itens do historico de preco.");
      }

      if (!priceRaw || !Number.isFinite(price) || price < 0) {
        throw new Error("Informe um valor valido em reais para todos os itens do historico de preco.");
      }

      normalized.push({ date, price });
    }

    normalized.sort((a, b) => String(b.date).localeCompare(String(a.date)));
    return normalized;
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
      case "add-price-history":
        this.#addPriceHistoryEntry();
        break;
      case "remove-price-history":
        this.#removePriceHistoryEntry(Number(button.dataset.index));
        break;
      default:
        break;
    }
  };

  #handleImageChange = () => {
    const file = this.imageInput.files?.[0];
    this.#setImageStatus(file ? `Arquivo selecionado: ${file.name}` : "");
  };

  #handleInput = (event) => {
    const field = event.target;

    if (!(field instanceof HTMLInputElement)) {
      return;
    }

    const index = Number(field.dataset.index);

    if (field.dataset.action === "change-price-history-date") {
      this.#updatePriceHistoryEntry(index, "date", field.value);
    }

    if (field.dataset.action === "change-price-history-value") {
      this.#updatePriceHistoryEntry(index, "price", field.value);
    }
  };

  #handleCameraPhotoCaptured = (event) => {
    this.#selectedImage = event.detail.imageData ?? "";
    this.imageInput.value = "";
    this.#setImageStatus("Foto capturada com a camera.");
    this.#setFeedback("Foto do produto capturada com sucesso.", "success");
  };

  #handleSubmit = async (event) => {
    event.preventDefault();

    const formData = new FormData(this.form);
    const name = String(formData.get("name") ?? "").trim();
    const barcode = String(formData.get("barcode") ?? "").trim();
    const quantity = Number(formData.get("quantity") ?? 0);
    const weightRaw = String(formData.get("weight") ?? "").trim();
    const weight = weightRaw ? Number(weightRaw) : null;

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

    let priceHistory = [];

    let image = this.#selectedImage;

    try {
      image = await this.#readSelectedFile();
      priceHistory = this.#normalizePriceHistory();
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
