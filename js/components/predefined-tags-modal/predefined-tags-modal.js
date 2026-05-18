const template = document.createElement("template");
template.innerHTML = `
  <div class="tags-modal" hidden>
    <div class="tags-modal__backdrop" data-action="close-tags"></div>
    <div class="tags-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="predefined-tags-title">
      <div class="tags-modal__header">
        <h3 id="predefined-tags-title">Gerenciar tags predefinidas</h3>
        <button class="tags-modal__close" type="button" data-action="close-tags" aria-label="Fechar tags predefinidas">×</button>
      </div>
      <div class="tags-modal__body">
        <div class="tags-modal__entry">
          <input class="tags-modal__input" data-role="tag-input" type="text" maxlength="40" placeholder="Digite uma tag predefinida" />
          <button class="btn btn-secondary" type="button" data-action="add-tag">Adicionar</button>
        </div>
        <p class="tags-modal__hint">Essas tags ficam disponiveis no cadastro e na edicao de produtos.</p>
        <div class="tags-modal__feedback" data-role="tags-feedback" hidden></div>
        <div class="tags-modal__list" data-role="tags-list"></div>
        <div class="tags-modal__empty" data-role="tags-empty">Nenhuma tag predefinida cadastrada.</div>
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

export class PredefinedTagsModal extends HTMLElement {
  #draftTags = [];

  constructor() {
    super();
    this.appendChild(template.content.cloneNode(true));
    this.modal = this.querySelector(".tags-modal");
    this.input = this.querySelector('[data-role="tag-input"]');
    this.feedback = this.querySelector('[data-role="tags-feedback"]');
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

  open(tags = []) {
    this.#draftTags = Array.isArray(tags)
      ? tags.map((tag) => normalizeTag(tag)).filter(Boolean)
      : [];
    this.#render();
    this.#setFeedback("");
    this.input.value = "";
    this.modal.hidden = false;
    setBodyModalLock(true);
    requestAnimationFrame(() => this.input.focus());
  }

  close() {
    if (this.modal.hidden) {
      return;
    }

    this.modal.hidden = true;
    setBodyModalLock(false);
    this.#setFeedback("");
  }

  get isOpen() {
    return !this.modal.hidden;
  }

  #setFeedback(message) {
    if (!message) {
      this.feedback.hidden = true;
      this.feedback.textContent = "";
      return;
    }

    this.feedback.hidden = false;
    this.feedback.textContent = message;
  }

  #render() {
    this.list.innerHTML = "";

    if (!this.#draftTags.length) {
      this.empty.hidden = false;
      return;
    }

    this.empty.hidden = true;

    this.#draftTags.forEach((tag, index) => {
      const item = document.createElement("div");
      item.className = "tags-modal__chip";
      item.innerHTML = `
        <span>${tag}</span>
        <button class="tags-modal__chip-remove" type="button" data-action="remove-tag" data-index="${index}" aria-label="Remover tag ${tag}">×</button>
      `;
      this.list.appendChild(item);
    });
  }

  #addTag() {
    const tag = normalizeTag(this.input.value);

    if (!tag) {
      this.#setFeedback("Informe uma tag antes de adicionar.");
      return;
    }

    if (this.#draftTags.some((item) => item.toLocaleLowerCase("pt-BR") === tag.toLocaleLowerCase("pt-BR"))) {
      this.#setFeedback("Essa tag ja foi adicionada.");
      return;
    }

    this.#draftTags.push(tag);
    this.#draftTags.sort((a, b) => a.localeCompare(b, "pt-BR"));
    this.input.value = "";
    this.#setFeedback("");
    this.#render();
    this.input.focus();
  }

  #removeTag(index) {
    this.#draftTags.splice(index, 1);
    this.#setFeedback("");
    this.#render();
  }

  #save() {
    this.dispatchEvent(
      new CustomEvent("predefined-tags-save", {
        bubbles: true,
        composed: true,
        detail: { tags: [...this.#draftTags] },
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
      case "add-tag":
        this.#addTag();
        break;
      case "remove-tag":
        this.#removeTag(Number(button.dataset.index));
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

    if (event.key === "Enter" && this.isOpen && document.activeElement === this.input) {
      event.preventDefault();
      this.#addTag();
    }
  };
}

customElements.define("predefined-tags-modal", PredefinedTagsModal);
