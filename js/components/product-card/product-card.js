const editIconUrl = new URL("../../../assets/icons/edit.svg", import.meta.url).href;
const deleteIconUrl = new URL("../../../assets/icons/delete.svg", import.meta.url).href;
const placeholderImageUrl = new URL("../../../assets/placeholder-product.svg", import.meta.url).href;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function stockButton(action, id, label, text) {
  return `
    <button class="stock-stepper__btn" type="button" data-action="${action}" data-id="${id}" aria-label="${label}">
      ${text}
    </button>
  `;
}

function formatWeight(product) {
  if (product.weight === null || product.weight === undefined || product.weight === "") {
    return "Peso nao informado";
  }

  return `${product.weight} ${product.weightUnit || "g"}`;
}

export class ProductCard extends HTMLElement {
  #product = null;

  connectedCallback() {
    this.addEventListener("click", this.#handleClick);
    this.#render();
  }

  disconnectedCallback() {
    this.removeEventListener("click", this.#handleClick);
  }

  set product(value) {
    this.#product = value;
    this.#render();
  }

  get product() {
    return this.#product;
  }

  #render() {
    const product = this.#product;
    if (!product) {
      this.innerHTML = "";
      return;
    }

    this.innerHTML = `
      <article class="product-item">
        <div class="product-item__media">
          <img class="product-item__image" src="${escapeHtml(product.image || placeholderImageUrl)}" alt="${escapeHtml(product.name)}" />
          <strong class="product-item__quantity">${escapeHtml(product.quantity)} unidades</strong>
        </div>
        <div class="product-item__name-block">
          <h3>${escapeHtml(product.name)}</h3>
          <p class="product-item__weight">${escapeHtml(formatWeight(product))}</p>
          <p class="product-item__barcode">${escapeHtml(product.barcode || "Codigo de barras nao informado")}</p>
        </div>
        <div class="product-item__content">
          <p class="product-item__notes">${escapeHtml(product.notes || "Sem observacoes.")}</p>
        </div>
        <div class="product-item__actions">
          ${stockButton("increase", product.id, `Aumentar estoque de ${escapeHtml(product.name)}`, "+")}
          <button class="icon-btn icon-btn-info" type="button" data-action="info" data-id="${product.id}" aria-label="Informacoes de ${escapeHtml(product.name)}">
            <span class="icon-btn-info__glyph" aria-hidden="true">i</span>
          </button>
          <button class="icon-btn icon-btn-edit" type="button" data-action="edit" data-id="${product.id}" aria-label="Editar ${escapeHtml(product.name)}">
            <span class="icon-mask" aria-hidden="true" style="--icon-url: url('${editIconUrl}')"></span>
          </button>
          <button class="icon-btn icon-btn-delete" type="button" data-action="delete" data-id="${product.id}" aria-label="Excluir ${escapeHtml(product.name)}">
            <span class="icon-mask" aria-hidden="true" style="--icon-url: url('${deleteIconUrl}')"></span>
          </button>
          ${stockButton("decrease", product.id, `Diminuir estoque de ${escapeHtml(product.name)}`, "−")}
        </div>
      </article>
    `;
  }

  #handleClick = (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button || !this.#product) {
      return;
    }

    this.dispatchEvent(
      new CustomEvent(`product-${button.dataset.action}`, {
        bubbles: true,
        composed: true,
        detail: { product: this.#product },
      }),
    );
  };
}

customElements.define("product-card", ProductCard);
