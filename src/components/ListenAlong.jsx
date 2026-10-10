import { useEffect, useRef, useState } from "react";
import { natural, NATURAL_OK, DEVICE_OK, HAS_GPU, VOICES, speakable, chunks, deviceVoice, textKey, wavToMp3 } from "../lib/listen.js";
import { api, studyAudioUrl } from "../lib/backend.js";

const SEL = "h1, .study-ref, .prose > p, .prose > h2, .prose > h3, .prose > blockquote, .prose > ul > li, .prose > ol > li, .study-qs h2, .study-qs li";
const load = (k, d) => { try { return localStorage.getItem(k) || d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, v); } catch {} };

/* "Listen Along": reads the study aloud and follows along on the page. */
export function ListenAlong({ rootRef, id, isOwner }) {
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [voice, setVoice] = useState(() => {
    const v = load("olm.listen.voice", "");
    if (v === "device" && DEVICE_OK) return v;
    if (v && NATURAL_OK && VOICES.some((x) => x[0] === v)) return v;
    return NATURAL_OK && (HAS_GPU || !DEVICE_OK) ? "am_michael" : "device";
  });
  const [rate, setRate] = useState(() => Number(load("olm.listen.rate", "1")) || 1);
  const [status, setStatus] = useState("");
  const [, force] = useState(0);
  const [ready, setReady] = useState({}); // voice -> Set of prepared text keys
  const [prep, setPrep] = useState(null); // owner: { done, total, msg }
  const S = useRef({ flat: [], pos: 0, tok: 0, memo: new Map(), audio: null, url: null, cur: null, voice, rate, ready: {}, prepTok: 0 }).current;
  S.voice = voice; S.rate = rate; S.ready = ready;

  const isReady = (i, v = S.voice) => !!(S.ready[v] && S.flat[i] && S.ready[v].has(textKey(S.flat[i].text)));
  const usingNatural = () => S.voice !== "device" && (NATURAL_OK || !!S.ready[S.voice]);

  /* ready-made audio for this study (if the owner prepared it) */
  useEffect(() => {
    let off = false;
    const url = studyAudioUrl(`${id}/index.json`);
    if (!url) return;
    fetch(url + "?t=" + Date.now(), { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then((ix) => {
      if (off || !ix || !ix.voices) return;
      const m = {};
      Object.entries(ix.voices).forEach(([v, keys]) => { if (Array.isArray(keys) && keys.length) m[v] = new Set(keys); });
      setReady(m);
      const saved = load("olm.listen.voice", "");
      const first = Object.keys(m)[0];
      if (first && saved !== "device" && !m[saved]) { setVoice(first); S.voice = first; }
    }).catch(() => {});
    return () => { off = true; };
  }, [id]);

  const build = () => {
    const root = rootRef.current; if (!root) return;
    const flat = [];
    root.querySelectorAll(SEL).forEach((el) => {
      const t = speakable(el.innerText);
      if (!t) return;
      chunks(t).forEach((c, k) => flat.push({ el, text: c, first: k === 0 }));
    });
    S.flat = flat;
  };

  const mark = (el) => {
    if (S.cur === el) return;
    if (S.cur) S.cur.classList.remove("listening");
    S.cur = el;
    if (el) {
      el.classList.add("listening");
      const r = el.getBoundingClientRect();
      if (r.top < 70 || r.bottom > window.innerHeight - 110) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const getAudio = (i) => {
    const key = S.voice + "|" + i;
    if (!S.memo.has(key)) {
      const p = isReady(i)
        ? fetch(studyAudioUrl(`${id}/${S.voice}/${textKey(S.flat[i].text)}.mp3`)).then((r) => { if (!r.ok) throw new Error("missing"); return r.blob(); })
            .catch(() => natural.speak(S.flat[i].text, S.voice))
        : natural.speak(S.flat[i].text, S.voice);
      p.catch(() => S.memo.delete(key));
      S.memo.set(key, p);
    }
    return S.memo.get(key);
  };

  const halt = () => {
    S.tok++;
    if (S.audio) { S.audio.onended = null; S.audio.pause(); }
    if (DEVICE_OK) window.speechSynthesis.cancel();
  };

  const say = (text) => new Promise((res, rej) => {
    const u = new SpeechSynthesisUtterance(text);
    const v = deviceVoice(); if (v) u.voice = v;
    u.rate = S.rate; u.onend = () => res(); u.onerror = (e) => (e.error === "interrupted" || e.error === "canceled" ? res() : rej(e));
    window.speechSynthesis.speak(u);
  });

  const play = (blob, tok) => new Promise((res) => {
    if (S.url) URL.revokeObjectURL(S.url);
    S.url = URL.createObjectURL(blob);
    const a = S.audio || (S.audio = new Audio());
    a.src = S.url; a.playbackRate = S.rate; a.preservesPitch = true;
    a.onended = () => res(); a.onerror = () => res();
    a.play().catch(() => { if (tok === S.tok) { setPlaying(false); setStatus("Tap play to start."); } res(); });
  });

  const run = async () => {
    const tok = ++S.tok;
    setPlaying(true);
    while (tok === S.tok && S.pos < S.flat.length) {
      const it = S.flat[S.pos];
      mark(it.el);
      if (usingNatural()) {
        let blob;
        const ready = natural.st.ready || isReady(S.pos);
        if (!ready) natural.warm();
        setStatus(ready ? "" : "wait");
        try {
          blob = await getAudio(S.pos);
          for (let k = 1; k <= 3 && S.pos + k < S.flat.length; k++) getAudio(S.pos + k);
        } catch (e) {
          if (tok !== S.tok) return;
          if (e.cancelled) continue;
          if (DEVICE_OK) { setVoice("device"); S.voice = "device"; setStatus("The natural voice isn't working here, so I switched to this device's voice."); continue; }
          setStatus("Sorry, this browser can't read aloud."); setPlaying(false); return;
        }
        if (tok !== S.tok) return;
        setStatus("");
        await play(blob, tok);
      } else if (DEVICE_OK) {
        setStatus("");
        try { await say(it.text); } catch { /* skip a line the device couldn't read */ }
      } else { setStatus("Sorry, this browser can't read aloud."); setPlaying(false); return; }
      if (tok !== S.tok) return;
      S.pos++;
    }
    if (tok === S.tok) { setPlaying(false); mark(null); S.pos = 0; setStatus("Finished. Press play to listen again."); }
  };

  const pause = () => { halt(); setPlaying(false); };
  const jump = (to) => {
    halt(); natural.cancel(); S.memo.clear();
    S.pos = Math.max(0, Math.min(S.flat.length - 1, to));
    run();
  };
  const step = (dir) => {
    const f = S.flat; let i = S.pos;
    if (dir > 0) { const el = f[i] && f[i].el; while (i < f.length && f[i].el === el) i++; }
    else { const el = f[i] && f[i].el; while (i > 0 && f[i - 1].el === el) i--; if (i > 0) { i--; const e2 = f[i].el; while (i > 0 && f[i - 1].el === e2) i--; } }
    if (i >= f.length) return;
    jump(i);
  };

  const start = () => { build(); setOpen(true); S.pos = 0; if (usingNatural() && !S.flat.every((_, i) => isReady(i))) natural.warm(); run(); };

  /* Owner: make the audio once and save it, so everyone can listen right away */
  const prepare = async () => {
    if (prep && prep.running) { S.prepTok++; setPrep({ ...prep, running: false, msg: "Stopped. Press Prepare audio again to pick up where it left off." }); return; }
    if (!NATURAL_OK) { setPrep({ msg: "This browser can't run the natural voice. Try Chrome or Safari on a computer." }); return; }
    const v = S.voice !== "device" ? S.voice : "am_michael";
    const name = (VOICES.find((x) => x[0] === v) || [v, v])[1];
    build();
    const keys = [...new Set(S.flat.map((x) => textKey(x.text)))];
    const texts = new Map(S.flat.map((x) => [textKey(x.text), x.text]));
    const have = new Set([...(S.ready[v] || [])].filter((k) => keys.includes(k)));
    const todo = keys.filter((k) => !have.has(k));
    const tok = ++S.prepTok;
    const saveIndex = async () => {
      const voices = {};
      Object.entries(S.ready).forEach(([vv, set]) => { if (vv !== v) voices[vv] = [...set]; });
      voices[v] = [...have];
      await api.uploadStudyAudio(`${id}/index.json`, new Blob([JSON.stringify({ voices, updated_at: new Date().toISOString() })], { type: "application/json" }), "application/json");
      const m = {}; Object.entries(voices).forEach(([vv, ks]) => { if (ks.length) m[vv] = new Set(ks); }); setReady(m); S.ready = m;
    };
    natural.warm();
    setPrep({ running: true, done: have.size, total: keys.length, msg: "" });
    try {
      let since = 0;
      for (const k of todo) {
        if (tok !== S.prepTok) return;
        const wav = await natural.speak(texts.get(k), v);
        const mp3 = await wavToMp3(wav);
        if (tok !== S.prepTok) return;
        await api.uploadStudyAudio(`${id}/${v}/${k}.mp3`, mp3);
        have.add(k); since++;
        setPrep({ running: true, done: have.size, total: keys.length, msg: "" });
        if (since >= 8) { since = 0; await saveIndex(); }
      }
      await saveIndex();
      setPrep({ running: false, done: have.size, total: keys.length, msg: `Audio ready. Everyone now hears ${name} right away.` });
    } catch (e) {
      if (tok === S.prepTok) setPrep({ running: false, done: have.size, total: keys.length, msg: "Stopped: " + (e.message || "something went wrong") + ". Press Prepare audio to continue." });
      try { await saveIndex(); } catch {}
    }
  };
  const close = () => { halt(); natural.cancel(); S.memo.clear(); setPlaying(false); mark(null); setOpen(false); setStatus(""); };

  useEffect(() => { const f = () => force((n) => n + 1); natural.st.listeners.add(f); return () => natural.st.listeners.delete(f); }, []);
  useEffect(() => () => { halt(); natural.cancel(); if (S.cur) S.cur.classList.remove("listening"); }, [id]);
  useEffect(() => { if (S.audio) S.audio.playbackRate = rate; save("olm.listen.rate", String(rate)); }, [rate]);
  useEffect(() => {
    if (!open) return;
    const root = rootRef.current; if (!root) return;
    root.classList.add("listen-on");
    const onClick = (e) => {
      if (e.target.closest("a, button, input, textarea, select, .comments")) return;
      const el = e.target.closest(SEL); if (!el) return;
      const i = S.flat.findIndex((x) => x.el === el); if (i >= 0) jump(i);
    };
    root.addEventListener("click", onClick);
    return () => { root.removeEventListener("click", onClick); root.classList.remove("listen-on"); };
  }, [open]);

  const changeVoice = (v) => {
    setVoice(v); S.voice = v; save("olm.listen.voice", v);
    if (playing) { halt(); natural.cancel(); S.memo.clear(); const f = S.flat; let i = S.pos; while (i > 0 && f[i - 1].el === f[i].el) i--; S.pos = i; run(); }
  };

  if (!NATURAL_OK && !DEVICE_OK) return null;
  const st = natural.st;
  const pct = st.total ? Math.min(99, Math.round((st.loaded / st.total) * 100)) : 0;
  const msg = status === "wait"
    ? (st.ready ? "Getting ready…" : `Getting the voice ready (one-time download)${pct ? ` · ${pct}%` : "…"}`)
    : status || (playing ? "Listening · tap any paragraph to jump there" : "Paused");

  return (
    <>
      {!open && <button className="btn gold sm listen-btn" onClick={start}><span aria-hidden="true">▶</span> Listen Along</button>}
      {isOwner && (
        <span className="listen-prep">
          <button className="btn ghost sm" onClick={prepare} title="Make the audio once so listeners don't wait">{prep && prep.running ? "Stop preparing" : "Prepare audio"}</button>
          {prep && <span className="hint" aria-live="polite">{prep.running ? `Preparing ${prep.done} of ${prep.total} with ${(VOICES.find((x) => x[0] === (S.voice !== "device" ? S.voice : "am_michael")) || ["", "the natural voice"])[1]}… keep this page open` : prep.msg}</span>}
          {!prep && Object.keys(ready).length > 0 && <span className="hint">Audio ready ({Object.keys(ready).map((v) => (VOICES.find((x) => x[0] === v) || [v, v])[1]).join(", ")})</span>}
        </span>
      )}
      {open && (
        <div className="listen-bar" role="region" aria-label="Listen Along">
          <button className="btn gold sm" onClick={playing ? pause : run} aria-label={playing ? "Pause" : "Play"}>{playing ? "❚❚ Pause" : "▶ Play"}</button>
          <button className="btn ghost sm" onClick={() => step(-1)} aria-label="Previous paragraph">⏮</button>
          <button className="btn ghost sm" onClick={() => step(1)} aria-label="Next paragraph">⏭</button>
          <span className="listen-msg" aria-live="polite">{msg}</span>
          <select className="input sm" value={voice} onChange={(e) => changeVoice(e.target.value)} aria-label="Voice">
            {(NATURAL_OK || Object.keys(ready).length > 0) && <optgroup label="Natural voices (free)">{VOICES.filter(([v]) => NATURAL_OK || ready[v]).map(([v, n, d]) => <option key={v} value={v}>{n} · {ready[v] ? "ready instantly" : d}</option>)}</optgroup>}
            {DEVICE_OK && <option value="device">This device's voice (instant)</option>}
          </select>
          <label className="listen-rate">Speed
            <select className="input sm" value={rate} onChange={(e) => setRate(Number(e.target.value))} aria-label="Speed">
              {[0.75, 0.9, 1, 1.15, 1.3, 1.5].map((r) => <option key={r} value={r}>{r}×</option>)}
            </select>
          </label>
          <button className="btn ghost sm" onClick={close} aria-label="Stop listening">✕</button>
        </div>
      )}
    </>
  );
}
