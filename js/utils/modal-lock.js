export function setBodyModalLock(locked) {
  const currentCount = Number(document.body.dataset.modalCount ?? "0");
  const nextCount = locked ? currentCount + 1 : Math.max(0, currentCount - 1);

  document.body.dataset.modalCount = String(nextCount);
  document.body.classList.toggle("modal-open", nextCount > 0);
}
