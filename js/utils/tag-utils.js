export function normalizeTag(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

export function normalizeTagList(tags) {
  const unique = [];
  const seen = new Set();

  for (const raw of Array.isArray(tags) ? tags : []) {
    const normalized = normalizeTag(raw);

    if (!normalized) {
      continue;
    }

    const key = normalized.toLocaleLowerCase("pt-BR");

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(normalized);
  }

  return unique;
}
