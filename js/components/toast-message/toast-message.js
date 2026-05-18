const template = document.createElement("template");
template.innerHTML = `<div class="app-feedback" hidden></div>`;

export class ToastMessage extends HTMLElement {
  #timer = null;

  constructor() {
    super();
    this.appendChild(template.content.cloneNode(true));
    this.box = this.querySelector(".app-feedback");
  }

  show(message, variant = "success") {
    if (this.#timer) {
      window.clearTimeout(this.#timer);
      this.#timer = null;
    }

    if (!message) {
      this.hide();
      return;
    }

    this.box.hidden = false;
    this.box.textContent = message;
    this.box.dataset.variant = variant;

    if (variant === "success") {
      this.box.classList.remove("app-feedback--timed");
      void this.box.offsetWidth;
      this.box.classList.add("app-feedback--timed");
      this.#timer = window.setTimeout(() => this.hide(), 3000);
    } else {
      this.box.classList.remove("app-feedback--timed");
    }
  }

  hide() {
    if (this.#timer) {
      window.clearTimeout(this.#timer);
      this.#timer = null;
    }

    this.box.hidden = true;
    this.box.textContent = "";
    this.box.dataset.variant = "";
    this.box.classList.remove("app-feedback--timed");
  }
}

customElements.define("toast-message", ToastMessage);
