/*
 * Listen Along: reads a Bible study aloud.
 * Natural voices use Kokoro (free, open source, runs on this device; the voice downloads once).
 * Device voices use the voices built into the browser. If natural voices fail, it falls back to device voices.
 */
export const NATURAL_OK = typeof Worker !== "undefined" && typeof Blob !== "undefined" && typeof URL !== "undefined" && !!URL.createObjectURL;
export const DEVICE_OK = typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
export const HAS_GPU = typeof navigator !== "undefined" && !!navigator.gpu;

export const VOICES = [
  ["am_michael", "Michael", "Warm, steady man"],
  ["af_heart", "Heart", "Warm woman"],
  ["am_adam", "Adam", "Deep man"],
  ["af_bella", "Bella", "Bright woman"],
  ["am_eric", "Eric", "Clear man"],
  ["af_sarah", "Sarah", "Gentle woman"],
  ["bm_george", "George", "British man"],
  ["bf_emma", "Emma", "British woman"],
];

const WORKER = String.raw`
import { KokoroTTS } from "https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/dist/kokoro.web.js";
const M="onnx-community/Kokoro-82M-v1.0-ONNX";
let tts=null, loading=null, busy=false; const Q=[];
function load(){
  if(tts) return Promise.resolve(tts); if(loading) return loading;
  loading=(async()=>{
    let gpu=false; try{ gpu=!!(self.navigator.gpu && await self.navigator.gpu.requestAdapter()); }catch(_){}
    const prog=p=>{ if(p&&p.status==="progress"&&p.total>1000000) self.postMessage({type:"progress",file:p.file,loaded:p.loaded,total:p.total}); };
    const opts=d=>({dtype:d==="webgpu"?"fp32":"q8",device:d,progress_callback:prog});
    if(gpu){ try{ tts=await KokoroTTS.from_pretrained(M,opts("webgpu")); }catch(_){ tts=null; } }
    if(!tts){ tts=await KokoroTTS.from_pretrained(M,opts("wasm")); }
    self.postMessage({type:"ready"}); return tts;
  })();
  loading.catch(()=>{ loading=null; });
  return loading;
}
function wav(a,sr){
  const n=a.length, buf=new ArrayBuffer(44+n*2), v=new DataView(buf); const w=(o,x)=>{ for(let i=0;i<x.length;i++) v.setUint8(o+i,x.charCodeAt(i)); };
  w(0,"RIFF"); v.setUint32(4,36+n*2,true); w(8,"WAVE"); w(12,"fmt "); v.setUint32(16,16,true); v.setUint16(20,1,true); v.setUint16(22,1,true);
  v.setUint32(24,sr,true); v.setUint32(28,sr*2,true); v.setUint16(32,2,true); v.setUint16(34,16,true); w(36,"data"); v.setUint32(40,n*2,true);
  let o=44; for(let k=0;k<n;k++){ const x=Math.max(-1,Math.min(1,a[k])); v.setInt16(o,x<0?x*0x8000:x*0x7fff,true); o+=2; }
  return buf;
}
async function pump(){
  if(busy) return; busy=true;
  while(Q.length){ const j=Q.shift();
    try{ const m=await load(); const a=await m.generate(j.text,{voice:j.voice}); const b=wav(a.audio,a.sampling_rate||24000); self.postMessage({type:"done",id:j.id,wav:b},[b]); }
    catch(e){ self.postMessage({type:"done",id:j.id,err:String((e&&e.message)||e)}); } }
  busy=false;
}
self.onmessage=e=>{ const d=e.data||{};
  if(d.type==="warm"){ load().catch(err=>self.postMessage({type:"fail",err:String((err&&err.message)||err)})); return; }
  if(d.type==="cancel"){ for(let i=Q.length-1;i>=0;i--){ self.postMessage({type:"done",id:Q[i].id,cancelled:true}); Q.splice(i,1); } return; }
  if(d.type==="say"){ Q.push(d); pump(); }
};`;

/* finished audio is kept on this device so replays start right away */
const CACHE = (() => {
  let dbp = null;
  const open = () => dbp || (dbp = new Promise((res, rej) => {
    try { const r = indexedDB.open("olm-listen", 1); r.onupgradeneeded = () => r.result.createObjectStore("a"); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); } catch (e) { rej(e); }
  }));
  return {
    get: (k) => open().then((db) => new Promise((res) => { try { const q = db.transaction("a").objectStore("a").get(k); q.onsuccess = () => res(q.result || null); q.onerror = () => res(null); } catch { res(null); } })).catch(() => null),
    put: (k, b) => { open().then((db) => { try { db.transaction("a", "readwrite").objectStore("a").put(b, k); } catch {} }).catch(() => {}); },
  };
})();

/* one shared voice engine for the page */
export const natural = (() => {
  let w = null, seq = 0;
  const pend = new Map();
  const st = { ready: false, loaded: 0, total: 0, files: {}, err: null, listeners: new Set() };
  const tick = () => st.listeners.forEach((f) => f());
  function start() {
    if (w) return w;
    w = new Worker(URL.createObjectURL(new Blob([WORKER], { type: "text/javascript" })), { type: "module" });
    w.onmessage = (e) => {
      const d = e.data || {};
      if (d.type === "progress") { st.files[d.file] = [d.loaded, d.total]; let a = 0, b = 0; Object.values(st.files).forEach(([x, y]) => { a += x; b += y; }); st.loaded = a; st.total = b; tick(); return; }
      if (d.type === "ready") { st.ready = true; st.err = null; tick(); return; }
      if (d.type === "fail") { st.err = "The natural voice couldn't load."; tick(); return; }
      if (d.type === "done") {
        const p = pend.get(d.id); if (!p) return; pend.delete(d.id);
        if (d.wav) { const b = new Blob([d.wav], { type: "audio/wav" }); CACHE.put(p.key, b); p.res(b); }
        else { const er = new Error(d.cancelled ? "cancelled" : "The natural voice had a problem."); er.cancelled = !!d.cancelled; p.rej(er); }
      }
    };
    w.onerror = (e) => {
      if (e && e.preventDefault) e.preventDefault();
      st.err = "The natural voice couldn't start in this browser.";
      pend.forEach((p) => p.rej(new Error(st.err))); pend.clear();
      try { w.terminate(); } catch {} w = null; tick();
    };
    return w;
  }
  return {
    st,
    warm() { try { start().postMessage({ type: "warm" }); } catch { st.err = "The natural voice couldn't start in this browser."; tick(); } },
    speak(text, voice) {
      const key = voice + "|" + text;
      return CACHE.get(key).then((hit) => hit || new Promise((res, rej) => { const id = ++seq; pend.set(id, { res, rej, key }); start().postMessage({ type: "say", id, text, voice }); }));
    },
    cancel() { if (w) w.postMessage({ type: "cancel" }); },
  };
})();

/* Make scripture references and ranges sound natural when read aloud. */
export function speakable(t) {
  return String(t || "")
    .replace(/\s+/g, " ")
    .replace(/\((?:[^()]*?),?\s*(NIV|ESV|KJV|NKJV|NLT|NASB|CSB)\)/g, (m) => m.replace(/,?\s*(NIV|ESV|KJV|NKJV|NLT|NASB|CSB)\)/, ")"))
    .replace(/\b(\d+):(\d+)\s*[–—-]\s*(\d+)\b/g, "chapter $1, verses $2 to $3")
    .replace(/\b(\d+):(\d+)\b/g, "chapter $1, verse $2")
    .replace(/\b(\d+)\s*[–—-]\s*(\d+)\b/g, "$1 to $2")
    .replace(/[*_#>]/g, "")
    .replace(/\s*[—–]\s*/g, ", ")
    .trim();
}

/* split into short pieces so the first one starts quickly */
export function chunks(text, max = 220) {
  const parts = text.match(/[^.!?…]+[.!?…]+["'”’)]*\s*|[^.!?…]+$/g) || [text];
  const out = []; let cur = "";
  for (const p of parts) { if ((cur + p).length > max && cur) { out.push(cur.trim()); cur = ""; } cur += p; }
  if (cur.trim()) out.push(cur.trim());
  return out.flatMap((c) => (c.length <= max + 120 ? [c] : c.match(/.{1,200}(\s|$)/g) || [c])).map((x) => x.trim()).filter(Boolean);
}

export function deviceVoice() {
  if (!DEVICE_OK) return null;
  const vs = window.speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang));
  const pref = [/natural/i, /enhanced|premium/i, /samantha|ava|allison|aaron|evan|nathan/i, /google us english/i, /en-us/i];
  for (const r of pref) { const v = vs.find((x) => r.test(x.name) || r.test(x.lang)); if (v) return v; }
  return vs[0] || null;
}

/* ---------- Ready-made audio (Bible studies) ----------
   The owner prepares a study once; listeners then play the saved MP3s right away
   instead of downloading the voice. Each piece is named by a fingerprint of its text,
   so edited paragraphs simply fall back to live reading until prepared again. */
export function textKey(s) {
  let h = 0x811c9dc5;
  const t = String(s || "");
  for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, "0") + t.length.toString(36);
}

let lameP = null;
function loadLame() {
  if (window.lamejs) return Promise.resolve(window.lamejs);
  return lameP || (lameP = new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/lamejs@1.2.1/lame.min.js";
    s.onload = () => (window.lamejs ? res(window.lamejs) : rej(new Error("MP3 encoder didn't load.")));
    s.onerror = () => { lameP = null; rej(new Error("MP3 encoder didn't load.")); };
    document.head.appendChild(s);
  }));
}

/* WAV (16-bit mono, as the voice makes it) -> MP3 at 64 kbps */
export async function wavToMp3(wav) {
  const lame = await loadLame();
  const buf = await wav.arrayBuffer();
  const sr = new DataView(buf).getUint32(24, true) || 24000;
  const pcm = new Int16Array(buf, 44, Math.floor((buf.byteLength - 44) / 2));
  const enc = new lame.Mp3Encoder(1, sr, 64);
  const out = [];
  for (let i = 0; i < pcm.length; i += 1152) {
    const b = enc.encodeBuffer(pcm.subarray(i, i + 1152));
    if (b.length) out.push(new Uint8Array(b));
  }
  const end = enc.flush();
  if (end.length) out.push(new Uint8Array(end));
  return new Blob(out, { type: "audio/mpeg" });
}
