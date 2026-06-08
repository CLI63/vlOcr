function mapStructuredResult(template, payload) {
  const source = payload && typeof payload === 'object' ? payload : {};
  if (!template?.schemaJson?.length) {
    return source;
  }

  const mapped = {};
  template.schemaJson.forEach((field) => {
    mapped[field.key] = source[field.key] ?? field.defaultValue ?? '';
  });
  return mapped;
}

module.exports = {
  mapStructuredResult,
};
