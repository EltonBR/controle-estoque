import { deleteProduct, getAllProducts, replaceAllProducts, saveProduct } from "../db.js";
import "./product-modal.js";
import "./product-search.js";
import "./product-table.js";
import "./toast-message.js";

const addIconUrl = new URL("../../assets/icons/add.svg", import.meta.url).href;
const backupIconUrl = new URL("../../assets/icons/backup.svg", import.meta.url).href;
const restoreIconUrl = new URL("../../assets/icons/restore.svg", import.meta.url).href;

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
      </div>
    </header>
  <main class="app-shell">
    <toast-message></toast-message>
    <section class="content-stack">
      <div class="field-grid">
        <product-table></product-table>
      </div>
    </section>
  </main>
  <product-modal></product-modal>
  <div class="modal" data-modal="restore" hidden>
    <div class="modal__backdrop" data-action="close-restore"></div>
    <div class="modal__dialog">
      <button class="modal__close" type="button" data-action="close-restore" aria-label="Fechar restauracao">×</button>
      <section class="card">
        <h2>Restaurar banco de dados</h2>
        <form class="field-grid" data-role="restore-form">
          <div class="field">
            <label for="restore-file">Arquivo de backup</label>
            <input id="restore-file" name="restoreFile" type="file" accept="application/json,.json" required />
          </div>
          <div class="feedback">A restauracao substitui todos os produtos atuais pelos dados do arquivo selecionado.</div>
          <div class="actions">
            <button class="btn btn-primary" type="submit">Restaurar</button>
            <button class="btn btn-secondary" type="button" data-action="close-restore">Cancelar</button>
          </div>
          <div class="feedback" data-role="restore-feedback" hidden></div>
        </form>
      </section>
    </div>
  </div>
`;

export class InventoryApp extends HTMLElement {
  #products = [];
  #query = "";

  constructor() {
    super();
    this.appendChild(template.content.cloneNode(true));
    this.productModal = this.querySelector("product-modal");
    this.form = this.productModal.form;
    this.search = this.querySelector("product-search");
    this.table = this.querySelector("product-table");
    this.toast = this.querySelector("toast-message");
    this.restoreModal = this.querySelector('[data-modal="restore"]');
    this.restoreForm = this.querySelector('[data-role="restore-form"]');
    this.restoreFeedback = this.querySelector('[data-role="restore-feedback"]');
  }

  connectedCallback() {
    this.addEventListener("save-product", this.#onSaveProduct);
    this.addEventListener("search-change", this.#onSearchChange);
    this.addEventListener("product-edit", this.#onEditProduct);
    this.addEventListener("product-delete", this.#onDeleteProduct);
    this.addEventListener("product-increase", this.#onAdjustStock);
    this.addEventListener("product-decrease", this.#onAdjustStock);
    this.addEventListener("product-modal-close", this.#onProductModalClose);
    this.addEventListener("click", this.#onClick);
    this.restoreForm.addEventListener("submit", this.#onRestoreSubmit);
    window.addEventListener("keydown", this.#onWindowKeydown);
    this.#loadProducts();
  }

  disconnectedCallback() {
    this.removeEventListener("save-product", this.#onSaveProduct);
    this.removeEventListener("search-change", this.#onSearchChange);
    this.removeEventListener("product-edit", this.#onEditProduct);
    this.removeEventListener("product-delete", this.#onDeleteProduct);
    this.removeEventListener("product-increase", this.#onAdjustStock);
    this.removeEventListener("product-decrease", this.#onAdjustStock);
    this.removeEventListener("product-modal-close", this.#onProductModalClose);
    this.removeEventListener("click", this.#onClick);
    this.restoreForm.removeEventListener("submit", this.#onRestoreSubmit);
    window.removeEventListener("keydown", this.#onWindowKeydown);
  }

  async #loadProducts() {
    try {
      this.#products = await getAllProducts();
      this.#render();
      this.#syncPreferredFocus();
    } catch (error) {
      console.error(error);
      this.#showStatus("Falha ao carregar os produtos do IndexedDB.", "error");
    }
  }

  #render() {
    const query = this.#query.trim().toLocaleLowerCase("pt-BR");
    const filteredProducts = !query
      ? this.#products
      : this.#products.filter((product) => {
          const haystack = [
            product.name,
            product.barcode,
            product.notes,
          ]
            .join(" ")
            .toLocaleLowerCase("pt-BR");

          return haystack.includes(query);
        });

    this.table.products = filteredProducts;
  }

  #sortProducts() {
    this.#products.sort((a, b) => {
      const aTime = new Date(a.createdAt ?? 0).getTime();
      const bTime = new Date(b.createdAt ?? 0).getTime();
      return aTime - bTime;
    });
  }

  #syncPreferredFocus() {
    if (this.#products.length > 0) {
      this.search.focusSearch();
      return;
    }

    this.#openFormModal();
  }

  #onSearchChange = (event) => {
    this.#query = event.detail.query ?? "";
    this.#render();
  };

  #onEditProduct = (event) => {
    this.#openFormModal(event.detail.product);
  };

  #onDeleteProduct = async (event) => {
    const { product } = event.detail;
    const confirmed = window.confirm(`Excluir "${product.name}" do estoque?`);

    if (!confirmed) {
      return;
    }

    try {
      await deleteProduct(product.id);
      this.#products = this.#products.filter((item) => item.id !== product.id);
      this.#render();

      if (this.form && product.id === this.form.product?.id) {
        this.form.reset();
      }

      this.#showStatus("Produto excluido com sucesso.", "success");
      this.#syncPreferredFocus();
    } catch (error) {
      console.error(error);
      this.#showStatus("Nao foi possivel excluir o produto.", "error");
    }
  };

  #onAdjustStock = async (event) => {
    const { product } = event.detail;
    const delta = event.type === "product-increase" ? 1 : -1;
    const nextQuantity = Math.max(0, Number(product.quantity ?? 0) + delta);

    if (nextQuantity === product.quantity) {
      return;
    }

    const updatedProduct = {
      ...product,
      quantity: nextQuantity,
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveProduct(updatedProduct);
      const index = this.#products.findIndex((item) => item.id === updatedProduct.id);

      if (index >= 0) {
        this.#products.splice(index, 1, updatedProduct);
      }

      this.#sortProducts();
      this.#render();

      if (this.form.product?.id === updatedProduct.id) {
        this.form.product = updatedProduct;
      }
    } catch (error) {
      console.error(error);
      this.#showStatus("Nao foi possivel atualizar o estoque.", "error");
    }
  };

  #onSaveProduct = async (event) => {
    const product = event.detail;

    try {
      const id = await saveProduct(product);
      const savedProduct = { ...product, id: product.id ?? id };
      const index = this.#products.findIndex((item) => item.id === savedProduct.id);

      if (index >= 0) {
        this.#products.splice(index, 1, savedProduct);
      } else {
        this.#products.push(savedProduct);
      }

      this.#sortProducts();
      this.#render();
      this.form.reset();
      this.#closeFormModal();
      this.#showStatus("Produto salvo com sucesso.", "success");
      this.#syncPreferredFocus();
    } catch (error) {
      console.error(error);
      this.form.showMessage("Nao foi possivel salvar o produto.", "error");
    }
  };

  #onClick = (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }

    switch (button.dataset.action) {
      case "open-create":
        this.#openFormModal();
        break;
      case "backup-db":
        this.#downloadBackup();
        break;
      case "open-restore":
        this.#openRestoreModal();
        break;
      case "close-restore":
        this.#closeRestoreModal();
        break;
      default:
        break;
    }
  };

  #onWindowKeydown = (event) => {
    if (event.key !== "Escape") {
      return;
    }

    if (!this.productModal.modal.hidden) {
      this.#closeFormModal();
      return;
    }

    if (!this.restoreModal.hidden) {
      this.#closeRestoreModal();
    }
  };

  #showStatus(message, variant = "success") {
    this.toast.show(message, variant);
  }

  #openFormModal(product = null) {
    this.productModal.open(product);
  }

  #closeFormModal() {
    this.productModal.close();

    if (this.#products.length > 0) {
      this.search.focusSearch();
    }
  }

  #onProductModalClose = () => {
    this.#closeFormModal();
  };

  #openRestoreModal() {
    this.restoreModal.hidden = false;
    this.restoreForm.reset();
    this.#setRestoreFeedback("", "");
    requestAnimationFrame(() => this.restoreForm.elements.namedItem("restoreFile")?.focus());
  }

  #closeRestoreModal() {
    this.restoreModal.hidden = true;
    this.restoreForm.reset();
    this.#setRestoreFeedback("", "");

    if (this.#products.length > 0) {
      this.search.focusSearch();
    }
  }

  #downloadBackup() {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      products: this.#products,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 19).replaceAll(":", "-");
    anchor.href = url;
    anchor.download = `controle-estoque-backup-${stamp}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    this.#showStatus("Backup do banco de dados gerado com sucesso.", "success");
  }

  #setRestoreFeedback(message, variant) {
    if (!message) {
      this.restoreFeedback.hidden = true;
      this.restoreFeedback.textContent = "";
      this.restoreFeedback.dataset.variant = "";
      return;
    }

    this.restoreFeedback.hidden = false;
    this.restoreFeedback.textContent = message;
    this.restoreFeedback.dataset.variant = variant;
  }

  #onRestoreSubmit = async (event) => {
    event.preventDefault();
    const input = this.restoreForm.elements.namedItem("restoreFile");
    const file = input?.files?.[0];

    if (!file) {
      this.#setRestoreFeedback("Selecione um arquivo de backup.", "error");
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const products = Array.isArray(parsed) ? parsed : parsed.products;

      if (!Array.isArray(products)) {
        throw new Error("Formato de backup invalido.");
      }

      await replaceAllProducts(products);
      this.#products = await getAllProducts();
      this.#render();
      this.#closeRestoreModal();
      this.#showStatus("Banco de dados restaurado com sucesso.", "success");
      this.#syncPreferredFocus();
    } catch (error) {
      console.error(error);
      this.#setRestoreFeedback("Nao foi possivel restaurar o arquivo selecionado.", "error");
    }
  };
}

customElements.define("inventory-app", InventoryApp);
