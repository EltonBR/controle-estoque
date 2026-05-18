const template = document.createElement("template");
template.innerHTML = `
  <div class="camera-modal" hidden>
    <div class="camera-modal__backdrop" data-action="close-camera"></div>
    <div class="camera-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="camera-title">
      <div class="camera-modal__header">
        <h3 id="camera-title">Tirar foto do produto</h3>
        <button class="camera-modal__close" type="button" data-action="close-camera" aria-label="Fechar camera">×</button>
      </div>
      <div class="camera-modal__body">
        <video class="camera-modal__video" data-role="camera-video" autoplay playsinline muted></video>
        <canvas class="camera-modal__canvas" data-role="camera-canvas" hidden></canvas>
        <p class="camera-modal__hint" data-role="camera-feedback">Posicione o produto e capture a imagem.</p>
      </div>
      <div class="actions">
        <button class="btn btn-primary" type="button" data-action="capture-photo">Capturar</button>
        <button class="btn btn-secondary" type="button" data-action="close-camera">Cancelar</button>
      </div>
    </div>
  </div>
`;

export class ProductCameraModal extends HTMLElement {
  #cameraStream = null;

  constructor() {
    super();
    this.appendChild(template.content.cloneNode(true));
    this.modal = this.querySelector(".camera-modal");
    this.cameraVideo = this.querySelector('[data-role="camera-video"]');
    this.cameraCanvas = this.querySelector('[data-role="camera-canvas"]');
    this.cameraFeedback = this.querySelector('[data-role="camera-feedback"]');
  }

  connectedCallback() {
    this.addEventListener("click", this.#handleClick);
    window.addEventListener("keydown", this.#handleWindowKeydown);
  }

  disconnectedCallback() {
    this.removeEventListener("click", this.#handleClick);
    window.removeEventListener("keydown", this.#handleWindowKeydown);
    this.#stopCameraStream();
  }

  async open() {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("A camera nao esta disponivel neste navegador.");
    }

    if (!this.modal.hidden) {
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false,
    });

    this.#cameraStream = stream;
    this.cameraVideo.srcObject = stream;
    this.cameraFeedback.textContent = "Posicione o produto e capture a imagem.";
    this.modal.hidden = false;
    requestAnimationFrame(() => this.cameraVideo.focus());
  }

  close() {
    if (this.modal.hidden) {
      return;
    }

    this.modal.hidden = true;
    this.cameraFeedback.textContent = "Posicione o produto e capture a imagem.";
    this.#stopCameraStream();
  }

  #stopCameraStream() {
    if (!this.#cameraStream) {
      return;
    }

    for (const track of this.#cameraStream.getTracks()) {
      track.stop();
    }

    this.#cameraStream = null;
    this.cameraVideo.srcObject = null;
  }

  #capturePhoto() {
    if (!this.#cameraStream) {
      this.cameraFeedback.textContent = "A camera nao esta ativa.";
      return;
    }

    const width = this.cameraVideo.videoWidth;
    const height = this.cameraVideo.videoHeight;

    if (!width || !height) {
      this.cameraFeedback.textContent = "A imagem da camera ainda nao esta pronta.";
      return;
    }

    this.cameraCanvas.width = width;
    this.cameraCanvas.height = height;
    const context = this.cameraCanvas.getContext("2d");

    if (!context) {
      this.cameraFeedback.textContent = "Nao foi possivel processar a imagem capturada.";
      return;
    }

    context.drawImage(this.cameraVideo, 0, 0, width, height);
    const imageData = this.cameraCanvas.toDataURL("image/jpeg", 0.92);

    this.dispatchEvent(
      new CustomEvent("camera-photo-captured", {
        bubbles: true,
        composed: true,
        detail: { imageData },
      }),
    );

    this.close();
  }

  #handleClick = (event) => {
    const button = event.target.closest("button[data-action], .camera-modal__backdrop");

    if (!button || !this.contains(button)) {
      return;
    }

    const action = button.dataset.action ?? "close-camera";

    switch (action) {
      case "close-camera":
        this.close();
        break;
      case "capture-photo":
        this.#capturePhoto();
        break;
      default:
        break;
    }
  };

  #handleWindowKeydown = (event) => {
    if (event.key === "Escape" && !this.modal.hidden) {
      this.close();
    }
  };
}

customElements.define("product-camera-modal", ProductCameraModal);
