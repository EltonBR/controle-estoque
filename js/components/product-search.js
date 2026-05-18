const template = document.createElement("template");
template.innerHTML = `
  <div class="search-box search-box-header">
    <input
      type="search"
      placeholder="Buscar por nome, codigo de barras ou observacoes"
      aria-label="Buscar produtos"
      autofocus
    />
    <div class="search-actions">
      <button class="btn btn-secondary" type="button" data-action="clear">Limpar</button>
    </div>
  </div>
`;

export class ProductSearch extends HTMLElement {
  constructor() {
    super();
    this.appendChild(template.content.cloneNode(true));
    this.input = this.querySelector("input");
  }

  connectedCallback() {
    this.input.addEventListener("input", this.#emitSearch);
    this.querySelector('[data-action="clear"]').addEventListener("click", this.#clear);
  }

  disconnectedCallback() {
    this.input.removeEventListener("input", this.#emitSearch);
  }

  focusSearch() {
    this.input.focus();
  }

  #emitSearch = () => {
    this.dispatchEvent(
      new CustomEvent("search-change", {
        bubbles: true,
        composed: true,
        detail: {
          query: this.input.value.trim(),
        },
      }),
    );
  };

  #clear = () => {
    this.input.value = "";
    this.#emitSearch();
    this.input.focus();
  };
}

customElements.define("product-search", ProductSearch);
