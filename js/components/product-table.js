import "./product-card.js";

const template = document.createElement("template");
template.innerHTML = `
  <section class="product-listing">
    <div class="summary">
      <span data-role="count">0 itens</span>
    </div>
    <div class="product-grid" hidden></div>
    <div class="empty-state">Nenhum produto cadastrado.</div>
  </section>
`;

export class ProductTable extends HTMLElement {
  #products = [];

  constructor() {
    super();
    this.appendChild(template.content.cloneNode(true));
    this.count = this.querySelector('[data-role="count"]');
    this.grid = this.querySelector(".product-grid");
    this.emptyState = this.querySelector(".empty-state");
  }

  set products(value) {
    this.#products = Array.isArray(value) ? value : [];
    this.#render();
  }

  #render() {
    const products = this.#products;
    const totalLabel = `${products.length} ${products.length === 1 ? "item" : "itens"}`;
    this.count.textContent = totalLabel;

    if (!products.length) {
      this.grid.hidden = true;
      this.emptyState.hidden = false;
      this.grid.innerHTML = "";
      return;
    }

    this.grid.hidden = false;
    this.emptyState.hidden = true;
    this.grid.innerHTML = "";

    for (const product of products) {
      const card = document.createElement("product-card");
      card.product = product;
      this.grid.appendChild(card);
    }
  }
}

customElements.define("product-table", ProductTable);
