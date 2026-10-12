/*
 * Talk to type: speech-to-text.
 * Chrome, Edge and Safari use the browser's built-in voice typing (instant).
 * Brave, Firefox, or any browser where that fails use Whisper, a free open-source model that runs
 * on this device (downloads once, about 80 MB). Both are free.
 */
const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
const IS_BRAVE = typeof navigator !== "undefined" && !!navigator.brave;
const WHISPER_OK = typeof navigator !== "undefined" && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) && typeof Worker !== "undefined" && typeof window !== "undefined" && !!(window.AudioContext || window.webkitAudioContext);
export const DICTATE_OK = !!SR || WHISPER_OK;
let useWhisper = !SR || IS_BRAVE;

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

/* ---------- Whisper (runs on this device) ---------- */
const WHISPER_SRC = `
import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.1/dist/transformers.min.js";
env.allowLocalModels = false;
let asr = null, loading = null;
const prog = (p) => { if (p && p.status === "progress" && p.total > 1000000) self.postMessage({ type: "progress", file: p.file, loaded: p.loaded, total: p.total }); };
function load() {
  if (asr) return Promise.resolve(asr);
  if (!loading) loading = pipeline("automatic-speech-recognition", "onnx-community/whisper-base.en", { dtype: "q8", device: "wasm", progress_callback: prog })
    .then((p) => { asr = p; self.postMessage({ type: "ready" }); return p; })
    .catch((e) => { loading = null; throw e; });
  return loading;
}
self.onmessage = async (e) => {
  const d = e.data || {};
  if (d.type === "warm") { load().catch((err) => self.postMessage({ type: "fail", err: String(err && err.message || err) })); return; }
  if (d.type === "audio") {
    try { const p = await load(); const r = await p(d.audio); self.postMessage({ type: "text", id: d.id, text: (r && r.text) || "" }); }
    catch (err) { self.postMessage({ type: "text", id: d.id, text: "", err: String(err && err.message || err) }); }
  }
};`;
let wWorker = null;
const wState = { ready: false, loaded: 0, total: 0, files: {}, subs: new Set() };
function whisperWorker() {
  if (wWorker) return wWorker;
  wWorker = new Worker(URL.createObjectURL(new Blob([WHISPER_SRC], { type: "text/javascript" })), { type: "module" });
  wWorker.addEventListener("message", (e) => {
    const d = e.data || {};
    if (d.type === "progress") { wState.files[d.file] = [d.loaded, d.total]; let a = 0, b = 0; Object.values(wState.files).forEach(([x, y]) => { a += x; b += y; }); wState.loaded = a; wState.total = b; }
    if (d.type === "ready") wState.ready = true;
    wState.subs.forEach((f) => f(d));
  });
  return wWorker;
}
/* Whisper hears clips, so this listens for pauses and sends each spoken phrase */
function whisperDictation({ onFinal, onInterim, onState, onError }) {
  let on = false, stream = null, ctx = null, node = null, src = null, seq = 0;
  let buf = [], speaking = false, quiet = 0, voiced = 0, pending = 0;
  const RATE = 16000;
  const status = () => {
    if (!wState.ready) { const pct = wState.total ? Math.min(99, Math.round((wState.loaded / wState.total) * 100)) : 0; return "Getting voice typing ready (one-time download)" + (pct ? " \u00b7 " + pct + "%" : "\u2026"); }
    return pending ? "Writing what you said\u2026" : speaking ? "Listening\u2026" : "Listening\u2026 speak now";
  };
  const sub = (d) => {
    if (d.type === "text" && d.id && d.id.startsWith("s")) {
      pending = Math.max(0, pending - 1);
      const t = String(d.text || "").replace(/\[(BLANK_AUDIO|MUSIC|NOISE|SILENCE)\]|\((?:music|silence|noise)[^)]*\)/gi, "").trim();
      if (t && on) onFinal && onFinal(t);
      if (d.err && on) onError && onError("Voice typing had a problem. Try again.");
    }
    if (d.type === "fail") { onError && onError("Voice typing couldn't load. Check your connection and try again."); stop(); return; }
    onInterim && onInterim(on ? status() : "");
  };
  const flush = () => {
    if (!buf.length) return;
    let n = 0; buf.forEach((b) => (n += b.length));
    const audio = new Float32Array(n); let o = 0; buf.forEach((b) => { audio.set(b, o); o += b.length; });
    buf = []; voiced = 0;
    if (n < RATE * 0.4) return;
    pending++; onInterim && onInterim(status());
    whisperWorker().postMessage({ type: "audio", id: "s" + ++seq, audio }, [audio.buffer]);
  };
  const stop = () => {
    if (!on) return;
    on = false;
    if (speaking) flush();
    speaking = false;
    try { node && node.disconnect(); src && src.disconnect(); } catch {}
    try { stream && stream.getTracks().forEach((t) => t.stop()); } catch {}
    try { ctx && ctx.close(); } catch {}
    wState.subs.delete(sub);
    onInterim && onInterim("");
    onState && onState(false);
  };
  return {
    get active() { return on; },
    async start() {
      if (on) return;
      on = true; onState && onState(true);
      wState.subs.add(sub);
      whisperWorker().postMessage({ type: "warm" });
      onInterim && onInterim(status());
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 } });
      } catch {
        on = false; wState.subs.delete(sub); onState && onState(false);
        onError && onError("Allow microphone access for this site, then try again.");
        return;
      }
      if (!on) { stream.getTracks().forEach((t) => t.stop()); return; }
      const AC = window.AudioContext || window.webkitAudioContext;
      try { ctx = new AC({ sampleRate: RATE }); } catch { ctx = new AC(); }
      const ratio = ctx.sampleRate / RATE;
      src = ctx.createMediaStreamSource(stream);
      node = ctx.createScriptProcessor(4096, 1, 1);
      node.onaudioprocess = (e) => {
        if (!on) return;
        const input = e.inputBuffer.getChannelData(0);
        let chunk;
        if (ratio === 1) chunk = new Float32Array(input);
        else { const len = Math.floor(input.length / ratio); chunk = new Float32Array(len); for (let i = 0; i < len; i++) chunk[i] = input[Math.floor(i * ratio)]; }
        let sum = 0; for (let i = 0; i < chunk.length; i++) sum += chunk[i] * chunk[i];
        const loud = Math.sqrt(sum / chunk.length) > 0.012;
        const secs = chunk.length / RATE;
        if (loud) { if (!speaking) { speaking = true; onInterim && onInterim(status()); } quiet = 0; voiced += secs; }
        if (speaking) {
          buf.push(chunk);
          if (!loud) quiet += secs;
          if (quiet > 0.8 || voiced > 14) { speaking = false; quiet = 0; flush(); }
        }
      };
      src.connect(node); node.connect(ctx.destination);
    },
    stop,
  };
}

/* one listening session; keeps listening through pauses until stopped */
export function createDictation(opts = {}) {
  if (useWhisper || !SR) return whisperDictation(opts);
  const { onFinal, onInterim, onState, onError, lang } = opts;
  let rec = null, on = false, fallback = null;
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
      if ((e.error === "network" || e.error === "service-not-allowed") && WHISPER_OK && !fallback) {
        // the browser's voice service isn't available (Brave does this): switch to Whisper on this device
        useWhisper = true; on = false;
        fallback = whisperDictation(opts);
        fallback.start();
        return;
      }
      on = false;
      onError && onError(e.error === "not-allowed" || e.error === "service-not-allowed"
        ? "Allow microphone access for this site, then try again."
        : e.error === "network" ? "Voice typing needs an internet connection." : "Voice typing stopped (" + e.error + ").");
    };
    r.onend = () => {
      if (fallback) return;
      onInterim && onInterim("");
      if (on) { try { r.start(); return; } catch { on = false; } }
      onState && onState(false);
    };
    return r;
  };
  return {
    get active() { return fallback ? fallback.active : on; },
    start() {
      if (fallback) { fallback.start(); return; }
      if (!SR || on) return;
      rec = make(); on = true;
      try { rec.start(); onState && onState(true); } catch (e) { on = false; onError && onError("Voice typing couldn't start."); }
    },
    stop() { if (fallback) { fallback.stop(); return; } on = false; try { rec && rec.stop(); } catch {} },
  };
}

/* Backlot: a floating "Talk to type" button that types into whatever box you last clicked in */
export function attachDictation(root, { toast, command, fix } = {}) {
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
  wrap.innerHTML = '<div class="talk-bubble" hidden></div><button type="button" class="talk-btn" aria-pressed="false" title="Talk to type: click in a box, press this, and speak. In the script, say &quot;Interior Velvet Room night&quot; for a scene heading or &quot;Nathan says...&quot; for a line."><span class="talk-dot" aria-hidden="true"></span><span class="talk-label">Talk to type</span></button>';
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
      if (command && command(t, el)) { savedRange = null; return; }
      insertText(el, fix ? fix(t, el) : t);
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
