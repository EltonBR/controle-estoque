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
        <input id="image" name="image" type="file" accept="image/*" />
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
      <div class="actions">
        <button class="btn btn-primary" type="submit">Salvar</button>
        <button class="btn btn-secondary" type="button" data-action="reset">Limpar</button>
      </div>
      <div class="feedback" hidden></div>
    </form>
  </section>
`;

export class ProductForm extends HTMLElement {
  #editingProduct = null;
  #selectedImage = "";

  constructor() {
    super();
    this.appendChild(template.content.cloneNode(true));
    this.form = this.querySelector("form");
    this.titleElement = this.querySelector("#title");
    this.feedback = this.querySelector(".feedback");
  }

  connectedCallback() {
    this.form.addEventListener("submit", this.#handleSubmit);
    this.querySelector('[data-action="reset"]').addEventListener("click", () => this.reset());
  }

  disconnectedCallback() {
    this.form.removeEventListener("submit", this.#handleSubmit);
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
    this.form.reset();
    this.titleElement.textContent = "Cadastrar produto";
    this.#setFeedback("", "");
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
    const input = this.form.elements.namedItem("image");
    const file = input?.files?.[0];

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

    let image = this.#selectedImage;

    try {
      image = await this.#readSelectedFile();
    } catch (error) {
      this.#setFeedback("Nao foi possivel ler a imagem selecionada.", "error");
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
