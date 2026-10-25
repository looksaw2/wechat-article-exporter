import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const popupSource = readFileSync(new URL("../chrome-extension/popup.js", import.meta.url), "utf8");

function setup({url = "https://mp.weixin.qq.com/s/local-fixture", extractionError, injectionError} = {}) {
  const elements = new Map();
  const downloads = [];
  const injections = [];
  const article = { title: "本地示例", account: "公众号", author: "作者", publishedAt: "2026-10-25", pageUrl: url, bodyLength: 10, markdown: "# 本地示例\n\n你好", filename: "本地示例.md" };
  const document = { getElementById(id) {
    if (!elements.has(id)) elements.set(id, {dataset: {}, hidden: true, value: "", textContent: "", addEventListener(type, callback) { this[type] = callback; }});
    return elements.get(id);
  }};
  const chrome = {
    tabs: { query: async () => [{id: 7, url}] },
    scripting: { executeScript: async (request) => {
      injections.push(request);
      if (injectionError) throw new Error(injectionError);
      return [{frameId: 0, result: extractionError ? {ok: false, error: extractionError} : {ok: true, article}}];
    }},
    downloads: {download: async (request) => { downloads.push(request); return 8; }},
  };
  runInNewContext(popupSource, {document, chrome, URL, Error, String, encodeURIComponent});
  return { elements, downloads, injections };
}

test("exports UTF-8 Markdown as a local data URL with save dialog", async () => {
  const app = setup();
  await app.elements.get("export-button").click();
  assert.equal(app.downloads.length, 1);
  assert.equal(app.downloads[0].saveAs, true);
  assert.equal(app.downloads[0].filename, "本地示例.md");
  assert.match(decodeURIComponent(app.downloads[0].url), /# 本地示例\n\n你好/);
  assert.deepEqual(JSON.parse(JSON.stringify(app.injections[0])), {target: {tabId: 7}, files: ["article.js", "extract-current.js"]});
});

test("preview edits are preserved when exporting", async () => {
  const app = setup();
  await app.elements.get("preview-button").click();
  assert.equal(app.downloads.length, 0);
  app.elements.get("markdown").value = "# 修改后的正文";
  await app.elements.get("export-button").click();
  assert.equal(app.injections.length, 1);
  assert.ok(decodeURIComponent(app.downloads[0].url).endsWith("# 修改后的正文"));
});

test("unsupported tab is rejected before content injection", async () => {
  const app = setup({url: "https://example.com"});
  await app.elements.get("export-button").click();
  assert.equal(app.injections.length, 0);
  assert.equal(app.downloads.length, 0);
  assert.equal(app.elements.get("status").dataset.kind, "error");
});

test("verification page error prevents download and allows retry", async () => {
  const app = setup({extractionError: "请先完成验证"});
  await app.elements.get("export-button").click();
  assert.equal(app.downloads.length, 0);
  assert.equal(app.elements.get("status").textContent, "请先完成验证");
  assert.equal(app.elements.get("export-button").disabled, false);
});

test("Chrome permission error is reported without creating download", async () => {
  const app = setup({injectionError: "Cannot access contents of the page"});
  await app.elements.get("export-button").click();
  assert.equal(app.downloads.length, 0);
  assert.match(app.elements.get("status").textContent, /Chrome 未允许读取/);
});
