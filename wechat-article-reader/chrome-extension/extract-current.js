(() => {
  try {
    return { ok: true, article: globalThis.WechatArticleExporter.extract(document, location.href) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
})();
