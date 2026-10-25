"use strict";

const previewButton = document.getElementById("preview-button");
const exportButton = document.getElementById("export-button");
const status = document.getElementById("status");
const preview = document.getElementById("preview");
const markdown = document.getElementById("markdown");
let article = null;
let articleTabId = null;

function report(message, kind = "info") {
  status.textContent = message;
  status.dataset.kind = kind;
}

async function readCurrentArticle() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  let url;
  try { url = new URL(tab?.url || ""); } catch { /* Report below. */ }
  if (!tab?.id || !url || url.protocol !== "https:" || url.hostname !== "mp.weixin.qq.com" || !/^\/s(?:\/|$)/.test(url.pathname)) {
    throw new Error("请切换到已打开的微信公众号文章标签页，再点击扩展图标。");
  }
  if (article && articleTabId === tab.id && article.pageUrl === tab.url) {
    return article;
  }
  report("正在读取当前页面…");
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["article.js", "extract-current.js"],
  });
  const result = results.find((entry) => entry.frameId === 0)?.result;
  if (!result?.ok) {
    throw new Error(result?.error || "未能读取文章，请确认页面已加载完成。");
  }
  article = result.article;
  articleTabId = tab.id;
  markdown.value = article.markdown;
  document.getElementById("article-title").textContent = article.title;
  document.getElementById("article-meta").textContent = [article.account, article.author, article.publishedAt].filter(Boolean).join(" · ");
  return article;
}

async function act(exportFile) {
  previewButton.disabled = exportButton.disabled = true;
  try {
    const current = await readCurrentArticle();
    preview.hidden = false;
    if (!exportFile) {
      report(`已读取 ${current.bodyLength} 字符。可在下方修改，随后点击“导出 Markdown”。`);
      return;
    }
    if (!markdown.value.trim()) throw new Error("Markdown 为空，请先读取文章正文。");
    const downloadId = await chrome.downloads.download({
      url: "data:text/markdown;charset=utf-8," + encodeURIComponent(markdown.value),
      filename: current.filename,
      conflictAction: "uniquify",
      saveAs: true,
    });
    if (typeof downloadId !== "number") throw new Error("未创建下载，请重新点击导出。");
    report("已发起保存，请在 Chrome 的保存对话框中选择位置。取消后可再次点击导出。");
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    report(detail.includes("Cannot access") || detail.includes("Missing host permission")
      ? "Chrome 未允许读取当前标签页。请关闭扩展弹窗，刷新文章页面，再点扩展图标重试。"
      : detail, "error");
  } finally {
    previewButton.disabled = exportButton.disabled = false;
  }
}

previewButton.addEventListener("click", () => act(false));
exportButton.addEventListener("click", () => act(true));
