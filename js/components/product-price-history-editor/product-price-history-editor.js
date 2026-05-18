const template = document.createElement("template");
template.innerHTML = `
  <div class="field-history-header">
    <label>Historico de preco</label>
    <button class="btn btn-secondary btn-history-add" type="button" data-action="add-price-history">Adicionar preco</button>
  </div>
  <div class="price-history-list" data-role="price-history-list"></div>
  <div class="field-media-status" data-role="price-history-status">Nenhum preco registrado.</div>
`;

export class ProductPriceHistoryEditor extends HTMLElement {
  #entries = [];

  constructor() {
    super();
    this.appendChild(template.content.cloneNode(true));
    this.list = this.querySelector('[data-role="price-history-list"]');
    this.status = this.querySelector('[data-role="price-history-status"]');
  }

  connectedCallback() {
    this.addEventListener("click", this.#handleClick);
    this.addEventListener("input", this.#handleInput);
    this.#render();
  }

  disconnectedCallback() {
    this.removeEventListener("click", this.#handleClick);
    this.removeEventListener("input", this.#handleInput);
  }

  set entries(value) {
    this.#entries = Array.isArray(value)
      ? value.map((entry) => ({
          date: entry?.date ?? "",
          price: entry?.price ?? "",
        }))
      : [];
    this.#render();
  }

  get entries() {
    return this.#entries.map((entry) => ({ ...entry }));
  }

  reset() {
    this.#entries = [];
    this.#render();
  }

  normalize() {
    const normalized = [];

    for (const entry of this.#entries) {
      const date = String(entry.date ?? "").trim();
      const priceRaw = String(entry.price ?? "").trim();

      if (!date && !priceRaw) {
        continue;
      }

      const price = Number(priceRaw);

      if (!date) {
        throw new Error("Informe a data em todos os itens do historico de preco.");
      }

      if (!priceRaw || !Number.isFinite(price) || price < 0) {
        throw new Error("Informe um valor valido em reais para todos os itens do historico de preco.");
      }

      normalized.push({ date, price });
    }

    normalized.sort((a, b) => String(b.date).localeCompare(String(a.date)));
    return normalized;
  }

  #render() {
    this.list.innerHTML = "";

    if (!this.#entries.length) {
      this.status.textContent = "Nenhum preco registrado.";
      return;
    }

    this.status.textContent = `${this.#entries.length} preco(s) registrado(s).`;

    this.#entries.forEach((entry, index) => {
      const row = document.createElement("div");
      row.className = "price-history-row";
      row.innerHTML = `
        <input type="date" value="${entry.date ?? ""}" data-action="change-price-history-date" data-index="${index}" aria-label="Data do preco ${index + 1}" />
        <input type="number" min="0" step="0.01" inputmode="decimal" value="${entry.price ?? ""}" data-action="change-price-history-value" data-index="${index}" aria-label="Valor do preco ${index + 1}" placeholder="Valor em reais" />
        <button class="btn btn-danger btn-history-remove" type="button" data-action="remove-price-history" data-index="${index}" aria-label="Remover preco ${index + 1}">
          Remover
        </button>
      `;
      this.list.appendChild(row);
    });
  }

  #addEntry() {
    this.#entries.push({
      date: "",
      price: "",
    });
    this.#render();
  }

  #removeEntry(index) {
    this.#entries.splice(index, 1);
    this.#render();
  }

  #updateEntry(index, key, value) {
    const entry = this.#entries[index];

    if (!entry) {
      return;
    }

    entry[key] = value;
  }

  #handleClick = (event) => {
    const button = event.target.closest("button[data-action]");

    if (!button || !this.contains(button)) {
      return;
    }

    switch (button.dataset.action) {
      case "add-price-history":
        this.#addEntry();
        break;
      case "remove-price-history":
        this.#removeEntry(Number(button.dataset.index));
        break;
      default:
        break;
    }
  };

  #handleInput = (event) => {
    const field = event.target;

    if (!(field instanceof HTMLInputElement)) {
      return;
    }

    const index = Number(field.dataset.index);

    if (field.dataset.action === "change-price-history-date") {
      this.#updateEntry(index, "date", field.value);
    }

    if (field.dataset.action === "change-price-history-value") {
      this.#updateEntry(index, "price", field.value);
    }
  };
}

customElements.define("product-price-history-editor", ProductPriceHistoryEditor);
