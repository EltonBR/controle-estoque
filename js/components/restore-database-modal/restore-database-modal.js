const template = document.createElement("template");
template.innerHTML = `
  <div class="modal" hidden>
    <div class="modal__backdrop" data-action="close"></div>
    <div class="modal__dialog">
      <button class="modal__close" type="button" data-action="close" aria-label="Fechar restauracao">×</button>
      <section class="card">
        <h2>Restaurar banco de dados</h2>
        <form class="field-grid" novalidate>
          <div class="field">
            <label for="restore-file">Arquivo de backup</label>
            <input id="restore-file" name="restoreFile" type="file" accept="application/json,.json" required />
          </div>
          <div class="feedback">A restauracao substitui todos os produtos atuais pelos dados do arquivo selecionado.</div>
          <div class="actions">
            <button class="btn btn-primary" type="submit">Restaurar</button>
            <button class="btn btn-secondary" type="button" data-action="close">Cancelar</button>
          </div>
          <div class="feedback" data-role="restore-feedback" hidden></div>
        </form>
      </section>
    </div>
  </div>
`;

function setBodyModalLock(locked) {
  const currentCount = Number(document.body.dataset.modalCount ?? "0");
  const nextCount = locked ? currentCount + 1 : Math.max(0, currentCount - 1);

  document.body.dataset.modalCount = String(nextCount);
  document.body.classList.toggle("modal-open", nextCount > 0);
}

export class RestoreDatabaseModal extends HTMLElement {
  constructor() {
    super();
    this.appendChild(template.content.cloneNode(true));
    this.modal = this.querySelector(".modal");
    this.form = this.querySelector("form");
    this.feedback = this.querySelector('[data-role="restore-feedback"]');
  }

  connectedCallback() {
    this.addEventListener("click", this.#handleClick);
    this.form.addEventListener("submit", this.#handleSubmit);
  }

  disconnectedCallback() {
    this.removeEventListener("click", this.#handleClick);
    this.form.removeEventListener("submit", this.#handleSubmit);
  }

  open() {
    this.modal.hidden = false;
    setBodyModalLock(true);
    this.form.reset();
    this.setFeedback("", "");
    requestAnimationFrame(() => this.form.elements.namedItem("restoreFile")?.focus());
  }

  close() {
    if (this.modal.hidden) {
      return;
    }

    this.modal.hidden = true;
    setBodyModalLock(false);
    this.form.reset();
    this.setFeedback("", "");
  }

  setFeedback(message, variant) {
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

  get isOpen() {
    return !this.modal.hidden;
  }

  #handleClick = (event) => {
    const button = event.target.closest("button[data-action='close'], .modal__backdrop");

    if (!button || !this.contains(button)) {
      return;
    }

    this.dispatchEvent(
      new CustomEvent("restore-database-close", {
        bubbles: true,
        composed: true,
      }),
    );
  };

  #handleSubmit = (event) => {
    event.preventDefault();
    const input = this.form.elements.namedItem("restoreFile");
    const file = input?.files?.[0] ?? null;

    this.dispatchEvent(
      new CustomEvent("restore-database-submit", {
        bubbles: true,
        composed: true,
        detail: { file },
      }),
    );
  };
}

customElements.define("restore-database-modal", RestoreDatabaseModal);
