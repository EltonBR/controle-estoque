import "../product-search/product-search.js";

const addIconUrl = new URL("../../../assets/icons/add.svg", import.meta.url).href;
const backupIconUrl = new URL("../../../assets/icons/backup.svg", import.meta.url).href;
const restoreIconUrl = new URL("../../../assets/icons/restore.svg", import.meta.url).href;
const themeIconUrl = new URL("../../../assets/icons/theme.svg", import.meta.url).href;

const template = document.createElement("template");
template.innerHTML = `
  <header class="app-header">
    <div class="app-header__inner">
      <div class="app-header__brand">
        <h2>Controle de estoque</h2>
      </div>
      <div class="app-header__search">
        <product-search></product-search>
      </div>
      <div class="app-header__actions">
        <button class="btn btn-primary btn-icon" type="button" data-action="open-create" aria-label="Cadastrar produto" title="Cadastrar produto">
          <span class="icon-mask" aria-hidden="true" style="--icon-url: url('${addIconUrl}')"></span>
        </button>
        <button class="btn btn-secondary btn-icon" type="button" data-action="backup-db" aria-label="Backup do banco de dados" title="Backup do banco de dados">
          <span class="icon-mask" aria-hidden="true" style="--icon-url: url('${backupIconUrl}')"></span>
        </button>
        <button class="btn btn-secondary btn-icon" type="button" data-action="open-restore" aria-label="Restaurar banco de dados" title="Restaurar banco de dados">
          <span class="icon-mask" aria-hidden="true" style="--icon-url: url('${restoreIconUrl}')"></span>
        </button>
        <button class="btn btn-secondary" type="button" data-action="open-predefined-tags" aria-label="Gerenciar tags predefinidas" title="Gerenciar tags predefinidas">
          Tags
        </button>
        <button class="btn btn-secondary btn-icon" type="button" data-action="toggle-theme" data-role="theme-toggle" aria-label="Ativar tema escuro" title="Ativar tema escuro">
          <span class="icon-mask" aria-hidden="true" style="--icon-url: url('${themeIconUrl}')"></span>
        </button>
      </div>
    </div>
  </header>
`;

export class InventoryHeader extends HTMLElement {
  constructor() {
    super();
    this.appendChild(template.content.cloneNode(true));
    this.themeToggle = this.querySelector('[data-role="theme-toggle"]');
  }

  connectedCallback() {
    this.addEventListener("click", this.#onClick);
  }

  disconnectedCallback() {
    this.removeEventListener("click", this.#onClick);
  }

  set theme(value) {
    const nextThemeLabel = value === "dark" ? "Ativar tema claro" : "Ativar tema escuro";
    this.themeToggle?.setAttribute("aria-label", nextThemeLabel);
    this.themeToggle?.setAttribute("title", nextThemeLabel);
  }

  #onClick = (event) => {
    const button = event.target.closest("button[data-action]");

    if (!button || !this.contains(button)) {
      return;
    }

    this.dispatchEvent(
      new CustomEvent("header-action", {
        bubbles: true,
        composed: true,
        detail: {
          action: button.dataset.action,
        },
      }),
    );
  };
}

customElements.define("inventory-header", InventoryHeader);
