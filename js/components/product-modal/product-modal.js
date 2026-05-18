import "../product-form/product-form.js";

const template = document.createElement("template");
template.innerHTML = `
  <div class="modal" hidden>
    <div class="modal__backdrop" data-action="close"></div>
    <div class="modal__dialog">
      <button class="modal__close" type="button" data-action="close" aria-label="Fechar cadastro">×</button>
      <product-form></product-form>
    </div>
  </div>
`;

export class ProductModal extends HTMLElement {
  constructor() {
    super();
    this.appendChild(template.content.cloneNode(true));
    this.modal = this.querySelector(".modal");
    this.form = this.querySelector("product-form");
  }

  connectedCallback() {
    this.addEventListener("click", this.#onClick);
  }

  disconnectedCallback() {
    this.removeEventListener("click", this.#onClick);
  }

  get product() {
    return this.form.product;
  }

  set product(value) {
    this.form.product = value;
  }

  open(product = null) {
    if (product) {
      this.form.product = product;
    } else {
      this.form.reset();
    }

    this.modal.hidden = false;
    requestAnimationFrame(() => this.form.focusBarcode());
  }

  close() {
    this.modal.hidden = true;
    this.form.reset();
  }

  #onClick = (event) => {
    const button = event.target.closest("button[data-action='close'], .modal__backdrop");
    if (!button) {
      return;
    }

    this.dispatchEvent(
      new CustomEvent("product-modal-close", {
        bubbles: true,
        composed: true,
      }),
    );
  };
}

customElements.define("product-modal", ProductModal);
