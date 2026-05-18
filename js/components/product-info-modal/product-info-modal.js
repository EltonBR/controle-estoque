const template = document.createElement("template");
template.innerHTML = `
  <div class="modal" hidden>
    <div class="modal__backdrop" data-action="close"></div>
    <div class="modal__dialog product-info-modal__dialog">
      <button class="modal__close" type="button" data-action="close" aria-label="Fechar informacoes do produto">×</button>
      <section class="card product-info-card">
        <div class="product-info-card__header">
          <div>
            <p class="product-info-card__eyebrow">Informacoes do produto</p>
            <h2 data-role="name">Produto</h2>
          </div>
        </div>
        <div class="product-info-card__media">
          <img class="product-info-card__image" data-role="image" alt="" />
        </div>
        <dl class="product-info-card__grid">
          <div class="product-info-card__row">
            <dt>Quantidade</dt>
            <dd data-role="quantity">0 unidades</dd>
          </div>
          <div class="product-info-card__row">
            <dt>Codigo de barras</dt>
            <dd data-role="barcode">Nao informado</dd>
          </div>
          <div class="product-info-card__row">
            <dt>Peso</dt>
            <dd data-role="weight">Nao informado</dd>
          </div>
          <div class="product-info-card__row">
            <dt>Fabricacao item mais antigo</dt>
            <dd data-role="manufactured-at">Nao informado</dd>
          </div>
          <div class="product-info-card__row">
            <dt>Validade</dt>
            <dd data-role="shelf-life-months">Nao informado</dd>
          </div>
          <div class="product-info-card__row product-info-card__row--full">
            <dt>Tags</dt>
            <dd class="product-info-card__tags" data-role="tags">Nenhuma tag.</dd>
          </div>
          <div class="product-info-card__row product-info-card__row--full">
            <dt>Observacoes</dt>
            <dd data-role="notes">Sem observacoes.</dd>
          </div>
          <div class="product-info-card__row">
            <dt>Criado em</dt>
            <dd data-role="created-at">-</dd>
          </div>
          <div class="product-info-card__row">
            <dt>Atualizado em</dt>
            <dd data-role="updated-at">-</dd>
          </div>
        </dl>
        <section class="product-info-card__history">
          <div class="product-info-card__history-header">
            <h3>Historico de preco</h3>
          </div>
          <div class="product-info-card__history-empty" data-role="price-history-empty">Nenhum preco registrado.</div>
          <div class="product-info-card__history-list" data-role="price-history-list" hidden></div>
        </section>
      </section>
    </div>
  </div>
`;

const placeholderImageUrl = new URL("../../../assets/placeholder-product.svg", import.meta.url).href;

function setBodyModalLock(locked) {
  const currentCount = Number(document.body.dataset.modalCount ?? "0");
  const nextCount = locked ? currentCount + 1 : Math.max(0, currentCount - 1);

  document.body.dataset.modalCount = String(nextCount);
  document.body.classList.toggle("modal-open", nextCount > 0);
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatPriceDate(value) {
  if (!value) {
    return "-";
  }

  const [year, month, day] = value.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

function formatCurrency(value) {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
}

function formatWeight(product) {
  if (product.weight === null || product.weight === undefined || product.weight === "") {
    return "Nao informado";
  }

  return `${product.weight} ${product.weightUnit || "g"}`;
}

function formatDateOnly(value) {
  if (!value) {
    return "Nao informado";
  }

  const [year, month, day] = String(value).split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

function formatShelfLifeMonths(value) {
  if (value === null || value === undefined || value === "") {
    return "Nao informado";
  }

  const months = Number(value);

  if (!Number.isFinite(months)) {
    return String(value);
  }

  return `${months} ${months === 1 ? "mes" : "meses"}`;
}

export class ProductInfoModal extends HTMLElement {
  constructor() {
    super();
    this.appendChild(template.content.cloneNode(true));
    this.modal = this.querySelector(".modal");
    this.image = this.querySelector('[data-role="image"]');
    this.name = this.querySelector('[data-role="name"]');
    this.quantity = this.querySelector('[data-role="quantity"]');
    this.barcode = this.querySelector('[data-role="barcode"]');
    this.weight = this.querySelector('[data-role="weight"]');
    this.manufacturedAt = this.querySelector('[data-role="manufactured-at"]');
    this.shelfLifeMonths = this.querySelector('[data-role="shelf-life-months"]');
    this.tags = this.querySelector('[data-role="tags"]');
    this.notes = this.querySelector('[data-role="notes"]');
    this.createdAt = this.querySelector('[data-role="created-at"]');
    this.updatedAt = this.querySelector('[data-role="updated-at"]');
    this.priceHistoryEmpty = this.querySelector('[data-role="price-history-empty"]');
    this.priceHistoryList = this.querySelector('[data-role="price-history-list"]');
  }

  connectedCallback() {
    this.addEventListener("click", this.#onClick);
  }

  disconnectedCallback() {
    this.removeEventListener("click", this.#onClick);
  }

  open(product) {
    this.#render(product);
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

  #render(product) {
    const priceHistory = Array.isArray(product.priceHistory) ? [...product.priceHistory] : [];
    priceHistory.sort((a, b) => String(b.date ?? "").localeCompare(String(a.date ?? "")));

    this.image.src = product.image || placeholderImageUrl;
    this.image.alt = product.name || "Produto";
    this.name.textContent = product.name || "Produto";
    this.quantity.textContent = `${product.quantity ?? 0} unidades`;
    this.barcode.textContent = product.barcode || "Nao informado";
    this.weight.textContent = formatWeight(product);
    this.manufacturedAt.textContent = formatDateOnly(product.manufacturedAt);
    this.shelfLifeMonths.textContent = formatShelfLifeMonths(product.shelfLifeMonths);
    this.tags.textContent = Array.isArray(product.tags) && product.tags.length ? product.tags.join(", ") : "Nenhuma tag.";
    this.notes.textContent = product.notes || "Sem observacoes.";
    this.createdAt.textContent = formatDate(product.createdAt);
    this.updatedAt.textContent = formatDate(product.updatedAt);

    this.priceHistoryList.innerHTML = "";

    if (!priceHistory.length) {
      this.priceHistoryEmpty.hidden = false;
      this.priceHistoryList.hidden = true;
      return;
    }

    this.priceHistoryEmpty.hidden = true;
    this.priceHistoryList.hidden = false;

    for (const entry of priceHistory) {
      const row = document.createElement("div");
      row.className = "product-info-card__history-row";
      row.innerHTML = `
        <span>${formatPriceDate(entry.date)}</span>
        <strong>${formatCurrency(entry.price)}</strong>
      `;
      this.priceHistoryList.appendChild(row);
    }
  }

  #onClick = (event) => {
    const button = event.target.closest("button[data-action='close'], .modal__backdrop");

    if (!button || !this.contains(button)) {
      return;
    }

    this.dispatchEvent(
      new CustomEvent("product-info-close", {
        bubbles: true,
        composed: true,
      }),
    );
  };
}

customElements.define("product-info-modal", ProductInfoModal);
