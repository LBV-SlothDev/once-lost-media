/*
 * Talk to type: speech-to-text with the browser's built-in voice typing (free, nothing to install).
 * Works in Chrome, Edge and Safari (Mac, iPhone, iPad). Firefox doesn't support it yet.
 */
const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
export const DICTATE_OK = !!SR;

const SPOKEN = [
  [/\s*\b(new paragraph)\b\s*/gi, "\n\n"],
  [/\s*\b(new line|next line)\b\s*/gi, "\n"],
  [/\s*\b(period|full stop)\b/gi, "."],
  [/\s*\bcomma\b/gi, ","],
  [/\s*\bquestion mark\b/gi, "?"],
  [/\s*\b(exclamation point|exclamation mark)\b/gi, "!"],
  [/\s*\bcolon\b/gi, ":"],
  [/\s*\bsemicolon\b/gi, ";"],
  [/\s*\b(dash)\b\s*/gi, " - "],
  [/\b(open quote)\s*/gi, "“"],
  [/\s*\b(close quote)\b/gi, "”"],
];

/* turn spoken words into tidy text, given the character right before the cursor */
export function tidy(raw, before, multiline) {
  let t = String(raw || "").trim();
  if (!t) return "";
  SPOKEN.forEach(([re, rep]) => { t = t.replace(re, rep); });
  if (!multiline) t = t.replace(/\n+/g, " ");
  const startSentence = !before || /[.!?\n]\s*$/.test(before) || /^\s*$/.test(before);
  if (startSentence) t = t.charAt(0).toUpperCase() + t.slice(1);
  t = t.replace(/([.!?]\s+|\n)([a-z])/g, (m, a, b) => a + b.toUpperCase());
  const needsSpace = before && !/[\s“(]$/.test(before) && !/^[.,!?:;\n]/.test(t);
  return (needsSpace ? " " : "") + t;
}

const isField = (el) => el && (el.tagName === "TEXTAREA" || (el.tagName === "INPUT" && /^(text|search|)$/i.test(el.type || "")) || el.isContentEditable);

function textBefore(el) {
  if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") return el.value.slice(0, el.selectionStart ?? el.value.length);
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return el.textContent || "";
  const r = sel.getRangeAt(0).cloneRange();
  r.selectNodeContents(el);
  try { r.setEnd(sel.getRangeAt(0).startContainer, sel.getRangeAt(0).startOffset); } catch { return el.textContent || ""; }
  return r.toString();
}

/* put text at the cursor so the page's own save/undo picks it up */
export function insertText(el, raw) {
  if (!isField(el)) return false;
  el.focus();
  const text = tidy(raw, textBefore(el), el.tagName === "TEXTAREA");
  if (!text) return true;
  let ok = false;
  try { ok = document.execCommand("insertText", false, text); } catch { ok = false; }
  if (!ok) {
    if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
      const s = el.selectionStart ?? el.value.length, e = el.selectionEnd ?? s;
      el.setRangeText(text, s, e, "end");
    } else {
      const sel = window.getSelection();
      if (sel && sel.rangeCount) { const r = sel.getRangeAt(0); r.deleteContents(); r.insertNode(document.createTextNode(text)); r.collapse(false); }
      else el.textContent += text;
    }
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }
  return true;
}

/* one listening session; keeps listening through pauses until stopped */
export function createDictation({ onFinal, onInterim, onState, onError, lang } = {}) {
  let rec = null, on = false;
  const make = () => {
    const r = new SR();
    r.lang = lang || navigator.language || "en-US";
    r.continuous = true;
    r.interimResults = true;
    r.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) onFinal && onFinal(res[0].transcript);
        else interim += res[0].transcript;
      }
      onInterim && onInterim(interim);
    };
    r.onerror = (e) => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      on = false;
      onError && onError(e.error === "not-allowed" || e.error === "service-not-allowed"
        ? "Allow microphone access for this site, then try again."
        : e.error === "network" ? "Voice typing needs an internet connection." : "Voice typing stopped (" + e.error + ").");
    };
    r.onend = () => {
      onInterim && onInterim("");
      if (on) { try { r.start(); return; } catch { on = false; } }
      onState && onState(false);
    };
    return r;
  };
  return {
    get active() { return on; },
    start() {
      if (!SR || on) return;
      rec = make(); on = true;
      try { rec.start(); onState && onState(true); } catch (e) { on = false; onError && onError("Voice typing couldn't start."); }
    },
    stop() { on = false; try { rec && rec.stop(); } catch {} },
  };
}

/* Backlot: a floating "Talk to type" button that types into whatever box you last clicked in */
export function attachDictation(root, { toast } = {}) {
  if (!DICTATE_OK || !root) return () => {};
  let last = null, savedRange = null;
  const remember = (e) => { if (isField(e.target) && root.contains(e.target)) last = e.target; };
  const keepRange = () => {
    const sel = window.getSelection();
    if (last && last.isContentEditable && sel && sel.rangeCount && last.contains(sel.anchorNode)) savedRange = sel.getRangeAt(0).cloneRange();
  };
  root.addEventListener("focusin", remember);
  document.addEventListener("selectionchange", keepRange);

  const wrap = document.createElement("div");
  wrap.className = "talk-wrap";
  wrap.innerHTML = '<div class="talk-bubble" hidden></div><button type="button" class="talk-btn" aria-pressed="false" title="Talk to type: click in a box, press this, and speak. Say &quot;period&quot; or &quot;comma&quot; for punctuation."><span class="talk-dot" aria-hidden="true"></span><span class="talk-label">Talk to type</span></button>';
  root.appendChild(wrap);
  const btn = wrap.querySelector(".talk-btn"), bubble = wrap.querySelector(".talk-bubble"), label = wrap.querySelector(".talk-label");

  const target = () => (last && document.contains(last) && isField(last) ? last : null);
  const d = createDictation({
    onFinal: (t) => {
      const el = target();
      if (!el) return;
      if (el.isContentEditable && document.activeElement !== el) {
        el.focus();
        if (savedRange) { const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(savedRange); }
      }
      insertText(el, t);
      keepRange();
    },
    onInterim: (t) => { bubble.hidden = !d.active; bubble.textContent = t ? t : "Listening… speak now"; },
    onState: (on) => {
      btn.classList.toggle("on", on); btn.setAttribute("aria-pressed", String(on));
      label.textContent = on ? "Stop" : "Talk to type";
      bubble.hidden = !on; if (on) bubble.textContent = "Listening… speak now";
    },
    onError: (m) => { toast && toast(m); },
  });
  btn.addEventListener("pointerdown", (e) => e.preventDefault()); // keep the cursor where it is
  btn.addEventListener("click", () => {
    if (d.active) { d.stop(); return; }
    if (!target()) { toast && toast("Click where you want the words to go, then press Talk to type."); return; }
    d.start();
  });
  return () => {
    d.stop();
    root.removeEventListener("focusin", remember);
    document.removeEventListener("selectionchange", keepRange);
    wrap.remove();
  };
}
