const template = document.createElement("template");
template.innerHTML = `
  <div class="tags-modal" hidden>
    <div class="tags-modal__backdrop" data-action="close-tags"></div>
    <div class="tags-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="tags-title">
      <div class="tags-modal__header">
        <h3 id="tags-title">Selecionar tags</h3>
        <button class="tags-modal__close" type="button" data-action="close-tags" aria-label="Fechar tags">×</button>
      </div>
      <div class="tags-modal__body">
        <p class="tags-modal__hint">Escolha entre as tags predefinidas disponiveis para este produto.</p>
        <div class="tags-modal__list" data-role="tags-list"></div>
        <div class="tags-modal__empty" data-role="tags-empty">Nenhuma tag predefinida disponivel.</div>
      </div>
      <div class="actions">
        <button class="btn btn-primary" type="button" data-action="save-tags">Salvar tags</button>
        <button class="btn btn-secondary" type="button" data-action="close-tags">Cancelar</button>
      </div>
    </div>
  </div>
`;

function setBodyModalLock(locked) {
  const currentCount = Number(document.body.dataset.modalCount ?? "0");
  const nextCount = locked ? currentCount + 1 : Math.max(0, currentCount - 1);

  document.body.dataset.modalCount = String(nextCount);
  document.body.classList.toggle("modal-open", nextCount > 0);
}

function normalizeTag(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

export class ProductTagsModal extends HTMLElement {
  #availableTags = [];
  #selectedTags = new Set();

  constructor() {
    super();
    this.appendChild(template.content.cloneNode(true));
    this.modal = this.querySelector(".tags-modal");
    this.list = this.querySelector('[data-role="tags-list"]');
    this.empty = this.querySelector('[data-role="tags-empty"]');
  }

  connectedCallback() {
    this.addEventListener("click", this.#handleClick);
    window.addEventListener("keydown", this.#handleWindowKeydown);
  }

  disconnectedCallback() {
    this.removeEventListener("click", this.#handleClick);
    window.removeEventListener("keydown", this.#handleWindowKeydown);
  }

  open({ availableTags = [], selectedTags = [] } = {}) {
    this.#availableTags = Array.isArray(availableTags)
      ? availableTags.map((tag) => normalizeTag(tag)).filter(Boolean)
      : [];
    this.#selectedTags = new Set(
      Array.isArray(selectedTags)
        ? selectedTags.map((tag) => normalizeTag(tag)).filter(Boolean)
        : [],
    );
    this.#render();
    this.modal.hidden = false;
    setBodyModalLock(true);
  }

  close() {
    if (this.modal.hidden) {
      return;
    }

    this.modal.hidden = true;
    setBodyModalLock(false);
  }

  get isOpen() {
    return !this.modal.hidden;
  }

  #render() {
    this.list.innerHTML = "";

    if (!this.#availableTags.length) {
      this.empty.hidden = false;
      return;
    }

    this.empty.hidden = true;

    this.#availableTags.forEach((tag) => {
      const item = document.createElement("button");
      item.className = `tags-modal__chip tags-modal__chip-selectable${this.#selectedTags.has(tag) ? " tags-modal__chip--selected" : ""}`;
      item.type = "button";
      item.dataset.action = "toggle-tag";
      item.dataset.tag = tag;
      item.innerHTML = `<span>${tag}</span>`;
      this.list.appendChild(item);
    });
  }

  #toggleTag(tag) {
    if (this.#selectedTags.has(tag)) {
      this.#selectedTags.delete(tag);
    } else {
      this.#selectedTags.add(tag);
    }

    this.#render();
  }

  #save() {
    this.dispatchEvent(
      new CustomEvent("product-tags-save", {
        bubbles: true,
        composed: true,
        detail: { tags: [...this.#selectedTags] },
      }),
    );
    this.close();
  }

  #handleClick = (event) => {
    const button = event.target.closest("button[data-action], .tags-modal__backdrop");

    if (!button || !this.contains(button)) {
      return;
    }

    const action = button.dataset.action ?? "close-tags";

    switch (action) {
      case "toggle-tag":
        this.#toggleTag(normalizeTag(button.dataset.tag));
        break;
      case "save-tags":
        this.#save();
        break;
      case "close-tags":
        this.close();
        break;
      default:
        break;
    }
  };

  #handleWindowKeydown = (event) => {
    if (event.key === "Escape" && this.isOpen) {
      this.close();
    }
  };
}

customElements.define("product-tags-modal", ProductTagsModal);
