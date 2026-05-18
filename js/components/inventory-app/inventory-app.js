import {
  deleteProduct,
  getAllProducts,
  getPredefinedTags,
  replaceAllProducts,
  savePredefinedTags,
  saveProduct,
} from "../../db.js";
import "../inventory-header/inventory-header.js";
import "../predefined-tags-modal/predefined-tags-modal.js";
import "../product-info-modal/product-info-modal.js";
import "../product-modal/product-modal.js";
import "../restore-database-modal/restore-database-modal.js";
import "../product-table/product-table.js";
import "../toast-message/toast-message.js";

const THEME_STORAGE_KEY = "controle-estoque-theme";

const template = document.createElement("template");
template.innerHTML = `
  <inventory-header></inventory-header>
  <main class="app-shell">
    <toast-message></toast-message>
    <section class="content-stack">
      <div class="field-grid">
        <product-table></product-table>
      </div>
    </section>
  </main>
  <predefined-tags-modal></predefined-tags-modal>
  <product-info-modal></product-info-modal>
  <product-modal></product-modal>
  <restore-database-modal></restore-database-modal>
`;

export class InventoryApp extends HTMLElement {
  #products = [];
  #query = "";
  #theme = "light";
  #predefinedTags = [];

  constructor() {
    super();
    this.appendChild(template.content.cloneNode(true));
    this.header = this.querySelector("inventory-header");
    this.predefinedTagsModal = this.querySelector("predefined-tags-modal");
    this.infoModal = this.querySelector("product-info-modal");
    this.productModal = this.querySelector("product-modal");
    this.form = this.productModal.form;
    this.search = this.querySelector("product-search");
    this.table = this.querySelector("product-table");
    this.toast = this.querySelector("toast-message");
    this.restoreModal = this.querySelector("restore-database-modal");
  }

  connectedCallback() {
    this.#initializeTheme();
    this.addEventListener("header-action", this.#onHeaderAction);
    this.addEventListener("predefined-tags-save", this.#onPredefinedTagsSave);
    this.addEventListener("save-product", this.#onSaveProduct);
    this.addEventListener("search-change", this.#onSearchChange);
    this.addEventListener("product-edit", this.#onEditProduct);
    this.addEventListener("product-info", this.#onInfoProduct);
    this.addEventListener("product-delete", this.#onDeleteProduct);
    this.addEventListener("product-increase", this.#onAdjustStock);
    this.addEventListener("product-decrease", this.#onAdjustStock);
    this.addEventListener("product-modal-close", this.#onProductModalClose);
    this.addEventListener("product-info-close", this.#onProductInfoClose);
    this.addEventListener("restore-database-close", this.#onRestoreModalClose);
    this.addEventListener("restore-database-submit", this.#onRestoreSubmit);
    window.addEventListener("keydown", this.#onWindowKeydown);
    this.#initializePredefinedTags()
      .catch((error) => {
        console.error(error);
        this.#predefinedTags = [];
        this.form.availableTags = this.#predefinedTags;
        this.#showStatus("Falha ao carregar as tags predefinidas.", "error");
      })
      .finally(() => {
        this.#loadProducts();
      });
  }

  disconnectedCallback() {
    this.removeEventListener("header-action", this.#onHeaderAction);
    this.removeEventListener("predefined-tags-save", this.#onPredefinedTagsSave);
    this.removeEventListener("save-product", this.#onSaveProduct);
    this.removeEventListener("search-change", this.#onSearchChange);
    this.removeEventListener("product-edit", this.#onEditProduct);
    this.removeEventListener("product-info", this.#onInfoProduct);
    this.removeEventListener("product-delete", this.#onDeleteProduct);
    this.removeEventListener("product-increase", this.#onAdjustStock);
    this.removeEventListener("product-decrease", this.#onAdjustStock);
    this.removeEventListener("product-modal-close", this.#onProductModalClose);
    this.removeEventListener("product-info-close", this.#onProductInfoClose);
    this.removeEventListener("restore-database-close", this.#onRestoreModalClose);
    this.removeEventListener("restore-database-submit", this.#onRestoreSubmit);
    window.removeEventListener("keydown", this.#onWindowKeydown);
  }

  async #loadProducts() {
    try {
      this.#products = await getAllProducts();
      this.form.availableTags = this.#predefinedTags;
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
            ...(Array.isArray(product.tags) ? product.tags : []),
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

  #onInfoProduct = (event) => {
    this.infoModal.open(event.detail.product);
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

  #onHeaderAction = (event) => {
    switch (event.detail.action) {
      case "open-create":
        this.#openFormModal();
        break;
      case "backup-db":
        this.#downloadBackup();
        break;
      case "open-restore":
        this.#openRestoreModal();
        break;
      case "open-predefined-tags":
        this.predefinedTagsModal.open(this.#predefinedTags);
        break;
      case "toggle-theme":
        this.#toggleTheme();
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

    if (this.infoModal.isOpen) {
      this.infoModal.close();
      return;
    }

    if (this.restoreModal.isOpen) {
      this.#closeRestoreModal();
      return;
    }

    if (this.predefinedTagsModal.isOpen) {
      this.predefinedTagsModal.close();
    }
  };

  #showStatus(message, variant = "success") {
    this.toast.show(message, variant);
  }

  #initializeTheme() {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    const preferredTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    this.#applyTheme(savedTheme === "dark" || savedTheme === "light" ? savedTheme : preferredTheme);
  }

  async #initializePredefinedTags() {
    const savedTags = await getPredefinedTags();
    this.#predefinedTags = Array.isArray(savedTags)
      ? savedTags.map((tag) => String(tag ?? "").trim()).filter(Boolean)
      : [];
    this.form.availableTags = this.#predefinedTags;
  }

  #toggleTheme() {
    const nextTheme = this.#theme === "dark" ? "light" : "dark";
    this.#applyTheme(nextTheme);
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  }

  #applyTheme(theme) {
    this.#theme = theme;
    document.documentElement.dataset.theme = theme;
    this.header.theme = theme;
  }

  #openFormModal(product = null) {
    this.form.availableTags = this.#predefinedTags;
    this.productModal.open(product);
  }

  #onPredefinedTagsSave = async (event) => {
    this.#predefinedTags = Array.isArray(event.detail.tags)
      ? event.detail.tags.map((tag) => String(tag ?? "").trim()).filter(Boolean)
      : [];

    try {
      await savePredefinedTags(this.#predefinedTags);
      this.form.availableTags = this.#predefinedTags;
      this.#showStatus("Tags predefinidas salvas com sucesso.", "success");
    } catch (error) {
      console.error(error);
      this.#showStatus("Nao foi possivel salvar as tags predefinidas.", "error");
    }
  };

  #closeFormModal() {
    this.productModal.close();

    if (this.#products.length > 0) {
      this.search.focusSearch();
    }
  }

  #onProductModalClose = () => {
    this.#closeFormModal();
  };

  #onProductInfoClose = () => {
    this.infoModal.close();
  };

  #openRestoreModal() {
    this.restoreModal.open();
  }

  #closeRestoreModal() {
    this.restoreModal.close();

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

  #onRestoreSubmit = async (event) => {
    const { file } = event.detail;

    if (!file) {
      this.restoreModal.setFeedback("Selecione um arquivo de backup.", "error");
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
      this.restoreModal.setFeedback("Nao foi possivel restaurar o arquivo selecionado.", "error");
    }
  };

  #onRestoreModalClose = () => {
    this.#closeRestoreModal();
  };
}

customElements.define("inventory-app", InventoryApp);
