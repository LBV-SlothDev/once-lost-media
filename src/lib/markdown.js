import { marked } from "marked";

marked.setOptions({ gfm: true, breaks: false });

const EMBED_OK = /^https:\/\/(www\.youtube(-nocookie)?\.com\/embed\/|player\.vimeo\.com\/video\/)/;

/* Render Markdown, then strip anything that could run code. */
export function renderMarkdown(md) {
  const html = marked.parse(md || "");
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  doc.querySelectorAll("script,style,object,embed,form,link,meta,base").forEach((n) => n.remove());
  doc.querySelectorAll("iframe").forEach((f) => {
    if (!EMBED_OK.test(f.getAttribute("src") || "")) f.remove();
    else {
      f.setAttribute("allowfullscreen", "");
      f.setAttribute("loading", "lazy");
      const wrap = doc.createElement("div");
      wrap.className = "embed";
      f.replaceWith(wrap);
      wrap.appendChild(f);
    }
  });
  doc.querySelectorAll("*").forEach((el) => {
    [...el.attributes].forEach((a) => {
      const n = a.name.toLowerCase();
      if (n.startsWith("on")) el.removeAttribute(a.name);
      if ((n === "href" || n === "src") && /^\s*(javascript|vbscript|data:text)/i.test(a.value)) el.removeAttribute(a.name);
    });
    if (el.tagName === "A" && /^https?:/i.test(el.getAttribute("href") || "")) {
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener noreferrer");
    }
    if (el.tagName === "IMG") el.setAttribute("loading", "lazy");
  });
  return doc.body.firstChild.innerHTML;
}

export const readingTime = (md) => Math.max(1, Math.round(((md || "").match(/\S+/g) || []).length / 230));
