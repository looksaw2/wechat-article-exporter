/* Copyright (c) 2026. MIT License; see LICENSE in this directory. */
(() => {
  "use strict";
  const BLOCKS = new Set(["P", "DIV", "SECTION", "ARTICLE", "MAIN", "HEADER", "FOOTER", "H1", "H2", "H3", "H4", "H5", "H6", "UL", "OL", "BLOCKQUOTE", "PRE", "TABLE", "HR", "FIGURE", "FIGCAPTION"]);
  const OMIT = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE", "BUTTON", "FORM", "INPUT", "SELECT", "TEXTAREA"]);
  const ARTICLE_KEYS = new Set(["__biz", "mid", "idx", "sn", "chksm"]);
  const compact = (value) => String(value || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
  const escapeText = (value) => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/[\\`*_[\]#!|~]/g, "\\$&");
  const plainText = (value) => escapeText(String(value).replace(/\u00a0/g, " ").replace(/[\t\r\n\f ]+/g, " "));

  function hidden(node) {
    if (node.nodeType !== 1) return false;
    return node.hidden || node.getAttribute("aria-hidden") === "true" || /(?:^|;)\s*(?:display\s*:\s*none|visibility\s*:\s*hidden)\s*(?:!important\s*)?(?:;|$)/i.test(node.getAttribute("style") || "");
  }

  function allowedURL(raw, base, allowMail = false) {
    if (!raw || !String(raw).trim()) return "";
    try {
      const url = new URL(String(raw), base);
      if (url.username || url.password) return "";
      if (url.protocol === "http:" || url.protocol === "https:" || (allowMail && url.protocol === "mailto:")) {
        return url.href.replace(/</g, "%3C").replace(/>/g, "%3E");
      }
    } catch { /* Treat invalid URLs as plain text. */ }
    return "";
  }

  function sourceURL(raw) {
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.hostname !== "mp.weixin.qq.com" || url.username || url.password || (url.port && url.port !== "443") || !/^\/s(?:\/|$)/.test(url.pathname)) {
      throw new Error("仅支持当前已打开的 https://mp.weixin.qq.com/s… 文章页面。");
    }
    // Export the article identity, without session or tracking query parameters.
    for (const key of [...url.searchParams.keys()]) {
      if (!ARTICLE_KEYS.has(key)) url.searchParams.delete(key);
    }
    url.hash = "";
    return url.href;
  }

  function filename(title) {
    let name = compact(title).replace(/[\x00-\x1f\x7f<>:"/\\|?*]/g, "_").replace(/^[. ]+|[. ]+$/g, "");
    if (/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name)) name = "_" + name;
    name = Array.from(name).slice(0, 100).join("").replace(/[. ]+$/g, "");
    return (name || "微信文章") + ".md";
  }

  function formatted(content, marker) {
    const match = /^(\s*)([\s\S]*?)(\s*)$/.exec(content);
    return match && match[2] ? match[1] + marker + match[2] + marker + match[3] : content;
  }

  function maxTicks(value) {
    return Math.max(0, ...(value.match(/`+/g) || []).map((run) => run.length));
  }

  function renderChildren(node, base) {
    const chunks = [];
    let inline = "";
    function flush() {
      if (inline.trim()) chunks.push(inline.trim());
      inline = "";
    }
    for (const child of node.childNodes) {
      if (child.nodeType === 1 && BLOCKS.has(child.tagName)) {
        flush();
        const rendered = render(child, base).trim();
        if (rendered) chunks.push(rendered);
      } else {
        inline += render(child, base);
      }
    }
    flush();
    return chunks.join("\n\n");
  }

  function renderList(node, base) {
    const ordered = node.tagName === "OL";
    const parsedStart = Number.parseInt(node.getAttribute("start") || "1", 10);
    let index = Number.isFinite(parsedStart) ? parsedStart : 1;
    const items = [];
    for (const item of node.children) {
      if (item.tagName !== "LI" || hidden(item)) continue;
      const explicit = Number.parseInt(item.getAttribute("value") || "", 10);
      if (ordered && Number.isFinite(explicit)) index = explicit;
      const marker = ordered ? `${index++}. ` : "- ";
      const lines = renderChildren(item, base).trim().split("\n");
      if (!lines.some((line) => line.trim())) continue;
      const indent = " ".repeat(marker.length);
      items.push(marker + lines[0] + (lines.length > 1 ? "\n" + lines.slice(1).map((line) => line ? indent + line : "").join("\n") : ""));
    }
    return items.join("\n");
  }

  function renderTable(node, base) {
    const rows = [];
    for (const row of node.querySelectorAll("tr")) {
      if (row.closest("table") !== node || hidden(row)) continue;
      const cells = [];
      for (const cell of row.children) {
        if (!["TD", "TH"].includes(cell.tagName)) continue;
        cells.push(renderChildren(cell, base).trim().replace(/\s*\n\s*/g, "<br>"));
        const colspan = Math.min(30, Math.max(1, Number.parseInt(cell.getAttribute("colspan") || "1", 10) || 1));
        for (let count = 1; count < colspan; count++) cells.push("");
      }
      if (cells.length) rows.push(cells);
    }
    if (!rows.length) return "";
    const width = Math.max(...rows.map((row) => row.length));
    const line = (row) => "| " + [...row, ...Array(width - row.length).fill("")].join(" | ") + " |";
    return [line(rows[0]), line(Array(width).fill("---")), ...rows.slice(1).map(line)].join("\n");
  }

  function render(node, base) {
    if (node.nodeType === 3) return plainText(node.nodeValue || "");
    if (node.nodeType !== 1 || OMIT.has(node.tagName) || hidden(node)) return "";
    const tag = node.tagName;
    if (tag === "BR") return "  \n";
    if (tag === "HR") return "---";
    if (tag === "IMG") {
      const alt = escapeText(compact(node.getAttribute("alt")) || "图片");
      const src = allowedURL(node.getAttribute("data-src") || node.getAttribute("data-original") || node.getAttribute("src"), base);
      return src ? `![${alt}](<${src}>)` : `[${alt}]`;
    }
    if (["VIDEO", "AUDIO", "IFRAME"].includes(tag)) {
      const label = tag === "AUDIO" ? "音频" : "视频";
      const src = allowedURL(node.getAttribute("data-src") || node.getAttribute("src") || node.querySelector("source")?.getAttribute("src"), base);
      return src ? `[${label}](<${src}>)` : `[${label}：原文中查看]`;
    }
    if (tag === "PRE") {
      const codeNode = node.querySelector("code");
      const code = (codeNode || node).textContent.replace(/\r\n?/g, "\n").replace(/^\n|\n$/g, "");
      if (!code.trim()) return "";
      const classes = (codeNode || node).getAttribute("class") || "";
      const language = /(?:^|\s)language-([a-zA-Z0-9_+.-]+)/.exec(classes)?.[1] || "";
      const fence = "`".repeat(Math.max(3, maxTicks(code) + 1));
      return `${fence}${language}\n${code}\n${fence}`;
    }
    if (tag === "CODE") {
      const value = node.textContent.replace(/\r?\n/g, " ");
      if (!value.trim()) return "";
      const fence = "`".repeat(Math.max(1, maxTicks(value) + 1));
      const pad = /^[` ]|[` ]$/.test(value) ? " " : "";
      return fence + pad + value + pad + fence;
    }
    if (tag === "UL" || tag === "OL") return renderList(node, base);
    if (tag === "TABLE") return renderTable(node, base);
    const hasBlocks = BLOCKS.has(tag) || [...node.children].some((child) => BLOCKS.has(child.tagName));
    const content = hasBlocks ? renderChildren(node, base) : [...node.childNodes].map((child) => render(child, base)).join("");
    if (/^H[1-6]$/.test(tag)) return content ? "#".repeat(Number(tag[1])) + " " + content : "";
    if (tag === "BLOCKQUOTE") return content.split("\n").map((line) => line ? "> " + line : ">").join("\n");
    if (tag === "A") {
      const href = allowedURL(node.getAttribute("href"), base, true);
      return href && content.trim() ? `[${content}](<${href}>)` : content;
    }
    if (tag === "STRONG" || tag === "B") return formatted(content, "**");
    if (tag === "EM" || tag === "I") return formatted(content, "*");
    if (tag === "DEL" || tag === "S" || tag === "STRIKE") return formatted(content, "~~");
    if (tag === "SPAN" && /(?:^|;)\s*font-weight\s*:\s*(?:bold|[6-9]00)/i.test(node.getAttribute("style") || "")) return formatted(content, "**");
    return content;
  }

  function firstText(doc, selectors) {
    for (const selector of selectors) {
      const node = doc.querySelector(selector);
      const text = node && compact(node.getAttribute("content") || node.getAttribute("datetime") || node.textContent);
      if (text) return text;
    }
    return "";
  }

  function extract(doc, pageUrl) {
    const url = sourceURL(pageUrl);
    const container = doc.querySelector("#js_content");
    if (!container) throw new Error("当前页面没有文章正文 #js_content。请先在 Chrome 中打开文章并手动完成验证。");
    for (let node = container; node && node.nodeType === 1; node = node.parentElement) {
      if (hidden(node)) throw new Error("文章正文尚未显示。请先在当前页面完成验证，等待正文加载后重试。");
    }
    const computed = doc.defaultView?.getComputedStyle(container);
    if (computed && (computed.display === "none" || computed.visibility === "hidden")) {
      throw new Error("文章正文尚未显示，请等待当前页面加载完成。");
    }
    const body = renderChildren(container, url).trim();
    if (!body) throw new Error("文章正文为空。请确认当前页面已完整加载。");
    const title = firstText(doc, ["#activity-name", 'meta[property="og:title"]']) || compact(doc.title) || "微信文章";
    const account = firstText(doc, ["#js_name", "#profileBt", ".rich_media_meta_nickname"]);
    const author = firstText(doc, ["#js_author_name", "#js_author", ".rich_media_meta_text_with_sep", 'meta[name="author"]']);
    const publishedAt = firstText(doc, ["#publish_time", 'meta[property="article:published_time"]', "time[datetime]"]);
    const parts = ["# " + escapeText(title), ""];
    if (account) parts.push("公众号：" + escapeText(account) + "  ");
    if (author && author !== account) parts.push("作者：" + escapeText(author) + "  ");
    if (publishedAt) parts.push("发布时间：" + escapeText(publishedAt) + "  ");
    parts.push(`原文：[查看文章](<${url}>)`, "", "---", "", body, "");
    return {title, account, author, publishedAt, sourceUrl: url, pageUrl, filename: filename(title), bodyLength: body.length, markdown: parts.join("\n")};
  }

  globalThis.WechatArticleExporter = Object.freeze({ extract, filename, sourceURL });
})();
