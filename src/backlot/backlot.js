import "./backlot.css";

const MARKUP = "<div class=\"bar\">\n  <div class=\"bar-in\">\n    <div class=\"brand\"><i aria-hidden=\"true\"></i>BACKLOT</div>\n    <input id=\"ptitle\" class=\"ptitle\" placeholder=\"Untitled project\" aria-label=\"Project title\">\n    <div class=\"tabs\" role=\"tablist\">\n      <button class=\"tab\" role=\"tab\" data-view=\"script\" aria-selected=\"true\">Script</button>\n      <button class=\"tab\" role=\"tab\" data-view=\"chars\" aria-selected=\"false\">Characters</button>\n      <button class=\"tab\" role=\"tab\" data-view=\"board\" aria-selected=\"false\">Storyboard</button>\n      <button class=\"tab\" role=\"tab\" data-view=\"calls\" aria-selected=\"false\">Call sheets</button>\n    </div>\n    <div class=\"spacer\"></div>\n    <div class=\"people\" id=\"people\" aria-label=\"People here now\"></div>\n    <div class=\"status\" id=\"status\"><span class=\"dot\"></span><span id=\"statusTxt\">Connecting\u2026</span></div>\n  </div>\n</div>\n<div class=\"banner\" id=\"banner\" hidden></div>\n\n<main>\n  <!-- SCRIPT -->\n  <section class=\"view\" id=\"v-script\">\n    <div class=\"script\">\n      <aside class=\"nav\">\n        <div class=\"nav-h\"><span class=\"eyebrow\">Scenes</span><button class=\"btn ghost\" id=\"addScene\" title=\"Add a scene at the end\">+ Scene</button></div>\n        <div class=\"stats\" id=\"stats\"></div>\n        <ol id=\"navList\"></ol>\n      </aside>\n      <div style=\"min-width:0\">\n        <div class=\"tools\">\n          <div class=\"types\" id=\"types\"></div>\n          <select class=\"field\" id=\"rev\" style=\"width:auto\" aria-label=\"Revision color\"></select>\n          <button class=\"btn\" id=\"importBtn\">Import</button>\n          <button class=\"btn primary\" id=\"readBtn\" title=\"Read the script aloud with a voice for each character\">▶ Table read</button>\n          <button class=\"btn\" id=\"pdfBtn\">Print / PDF</button>\n          <button class=\"btn\" id=\"historyBtn\">History</button>\n          <button class=\"btn\" id=\"exportBtn\">Export .fountain</button>\n          <button class=\"btn danger\" id=\"clearScript\">Clear script</button>\n          <input type=\"file\" id=\"importFile\" accept=\".fountain,.txt,.md,text/plain\" hidden>\n        </div>\n        <p class=\"hint\" style=\"margin:-4px 0 12px\">Enter starts the next element \u00b7 Tab changes element type \u00b7 paste or import a Fountain script to bring in existing pages.</p>\n        <div class=\"page-wrap\">\n          <div class=\"page\" id=\"page\">\n            <div class=\"revband\"></div><div class=\"revlabel\" id=\"revlabel\"></div>\n            <div id=\"scenes\"></div>\n            <div class=\"empty\" id=\"scriptEmpty\" hidden>\n              <h2>FADE IN:</h2>\n              <p style=\"margin:0\">The script is empty. Start the first scene, or import a Fountain script you already have.</p>\n              <div class=\"row\"><button class=\"btn primary\" id=\"startScript\">Start writing</button><button class=\"btn\" id=\"emptyImport\">Import a script</button></div>\n            </div>\n          </div>\n        </div>\n      </div>\n    </div>\n  </section>\n\n  <!-- CHARACTERS -->\n  <section class=\"view\" id=\"v-chars\" hidden>\n    <div class=\"cs\">\n      <aside>\n        <input class=\"field\" id=\"chSearch\" placeholder=\"Find a character or actor\" aria-label=\"Find a character\" style=\"margin-bottom:8px\">\n        <div class=\"days\" id=\"chList\"></div>\n        <form id=\"chAdd\" class=\"chadd\"><input class=\"field\" id=\"chNew\" placeholder=\"Add a character\" aria-label=\"New character name\"><button class=\"btn primary\">Add</button></form>\n        <p class=\"hint\" style=\"margin:8px 2px 0\">Characters who speak in the script are added automatically.</p>\n      </aside>\n      <div id=\"chWrap\" style=\"min-width:0\"></div>\n      <input type=\"file\" id=\"chFile\" accept=\"image/*\" hidden>\n    </div>\n  </section>\n\n  <!-- STORYBOARD -->\n  <section class=\"view\" id=\"v-board\" hidden>\n    <div class=\"sb-tools\">\n      <select class=\"field\" id=\"sbFilter\" aria-label=\"Show scene\"></select>\n      <span class=\"hint\" id=\"sbCount\"></span>\n      <div class=\"spacer\"></div>\n    </div>\n    <div id=\"sbBody\"></div>\n  </section>\n\n  <!-- CALL SHEETS -->\n  <section class=\"view\" id=\"v-calls\" hidden>\n    <div class=\"cs\">\n      <aside>\n        <div class=\"days\" id=\"days\"></div>\n        <button class=\"btn primary\" id=\"newSheet\" style=\"width:100%;justify-content:center;margin-top:8px\">+ New shoot day</button>\n      </aside>\n      <div id=\"sheetWrap\" style=\"min-width:0\"></div>\n    </div>\n  </section>\n</main>\n\n<!-- panel editor -->\n<div class=\"ov\" id=\"pov\" hidden>\n  <div class=\"modal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"pTitle\">\n    <div class=\"mhead\"><h2 id=\"pTitle\">Shot</h2><button class=\"x\" id=\"pClose\" aria-label=\"Close\">\u2715</button></div>\n    <div class=\"ed\">\n      <div>\n        <div class=\"canvas-box\"><canvas id=\"cv\" width=\"960\" height=\"540\"></canvas><div class=\"thirds\" id=\"thirds\" hidden></div></div>\n        <div class=\"ctools\">\n          <button class=\"btn on\" data-tool=\"pen\">Pencil</button>\n          <button class=\"btn\" data-tool=\"marker\">Marker</button>\n          <button class=\"btn\" data-tool=\"eraser\">Eraser</button>\n          <select class=\"field\" id=\"pSize\" style=\"width:auto\" aria-label=\"Brush size\"><option value=\"2\">Fine</option><option value=\"4\" selected>Medium</option><option value=\"9\">Bold</option><option value=\"20\">Wide</option></select>\n          <button class=\"btn\" id=\"pUndo\">Undo</button>\n          <button class=\"btn\" id=\"pClear\">Clear</button>\n          <button class=\"btn\" id=\"pThirds\">Thirds</button>\n          <button class=\"btn\" id=\"pUpload\">Upload image</button>\n          <input type=\"file\" id=\"pFile\" accept=\"image/*\" hidden>\n        </div>\n      </div>\n      <div class=\"form\">\n        <label class=\"full\">Scene<select class=\"field\" id=\"pScene\"></select></label>\n        <label>Shot size<select class=\"field\" id=\"pShot\"></select></label>\n        <label>Angle<select class=\"field\" id=\"pAngle\"></select></label>\n        <label>Movement<select class=\"field\" id=\"pMove\"></select></label>\n        <label>Lens (mm)<input class=\"field\" id=\"pLens\" inputmode=\"numeric\" placeholder=\"35\"></label>\n        <label>Duration (sec)<input class=\"field\" id=\"pDur\" inputmode=\"decimal\" placeholder=\"4\"></label>\n        <label>Setup<input class=\"field\" id=\"pSetup\" placeholder=\"A cam\"></label>\n        <label class=\"full\">Action / description<textarea class=\"field\" id=\"pDesc\" rows=\"3\" placeholder=\"What happens in frame\"></textarea></label>\n        <label class=\"full\">Dialogue / sound<textarea class=\"field\" id=\"pAudio\" rows=\"2\" placeholder=\"Lines or SFX over this shot\"></textarea></label>\n      </div>\n    </div>\n    <div class=\"mfoot\">\n      <button class=\"btn danger\" id=\"pDelete\">Delete shot</button>\n      <div style=\"display:flex;gap:8px\"><button class=\"btn\" id=\"pCancel\">Cancel</button><button class=\"btn primary\" id=\"pSave\">Save shot</button></div>\n    </div>\n  </div>\n</div>\n\n<!-- confirm -->\n<div class=\"ov\" id=\"cov\" hidden>\n  <div class=\"modal sm\" role=\"alertdialog\" aria-modal=\"true\">\n    <p id=\"cMsg\" style=\"margin:4px 0 16px;font-size:15px\"></p>\n    <div class=\"mfoot\" style=\"justify-content:flex-end\"><button class=\"btn\" id=\"cNo\">Cancel</button><button class=\"btn primary\" id=\"cYes\">Delete</button></div>\n  </div>\n</div>\n<div class=\"reader\" id=\"reader\" hidden role=\"region\" aria-label=\"Table read\"><button class=\"btn primary\" id=\"rdPlay\">▶ Play</button><button class=\"btn\" id=\"rdPrev\" aria-label=\"Previous line\">⏮</button><button class=\"btn\" id=\"rdNext\" aria-label=\"Next line\">⏭</button><span class=\"rd-now\" id=\"rdNow\" aria-live=\"polite\"></span><select class=\"field\" id=\"rdNarr\" aria-label=\"Narrator voice\"></select><label class=\"rd-opt\">Speed<input type=\"range\" id=\"rdRate\" min=\"0.6\" max=\"1.6\" step=\"0.1\" value=\"1\"></label><label class=\"rd-opt\"><input type=\"checkbox\" id=\"rdHead\" checked> Headings</label><label class=\"rd-opt\"><input type=\"checkbox\" id=\"rdAction\" checked> Action</label><button class=\"x\" id=\"rdClose\" aria-label=\"Stop reading\">✕</button></div>\n<div class=\"toast\" id=\"toast\" hidden></div>";

const downloads = {
  async save({ filename, data }) {
    const blob = data instanceof Blob ? data : new Blob([data], { type: /\.html$/.test(filename) ? "text/html" : "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    return { status: "saved" };
  },
};

/** Mount Backlot into `root`. `adapters` = { db, user, room } from the backend. Returns an unmount function. */
export function mountBacklot(root, adapters) {
root.innerHTML = MARKUP;
let dead = false;
const unsubs = [];
const track = (ref) => ref && ({ ...ref,
  onSnapshot: (n, e) => { const u = ref.onSnapshot(n, e); unsubs.push(u); return u; },
  orderBy: (...a) => track(ref.orderBy(...a)) });
const wrapped = { ...adapters, db: { doc: (p) => track(adapters.db.doc(p)), collection: (p) => track(adapters.db.collection(p)) } };

"use strict";
const $ = s => root.querySelector(s);
const $$ = s => [...root.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const clone = o => JSON.parse(JSON.stringify(o ?? null));

const TYPES = ["scene","action","character","paren","dialogue","transition","shot"];
const LABEL = {scene:"Scene Heading",action:"Action",character:"Character",paren:"Parenthetical",dialogue:"Dialogue",transition:"Transition",shot:"Shot"};
const NEXT = {scene:"action",action:"action",character:"dialogue",paren:"dialogue",dialogue:"action",transition:"scene",shot:"action"};
const CYCLE = ["action","character","dialogue","paren","transition","shot","scene"];
const WIDTH = {scene:60,action:60,character:38,paren:25,dialogue:35,transition:60,shot:60};
const REVS = [["White","#FFFFFF"],["Blue","#A9CBEF"],["Pink","#F4B7CF"],["Yellow","#F3DE70"],["Green","#A8D8A0"],["Goldenrod","#E2B04A"],["Buff","#EAD8B2"],["Salmon","#F2A88E"],["Cherry","#D9536B"]];
const SHOTS = ["EWS","WS","MWS","MS","MCU","CU","ECU","OTS","POV","Two-shot","Insert"];
const ANGLES = ["Eye level","High","Low","Dutch","Overhead","Ground"];
const MOVES = ["Static","Pan","Tilt","Dolly in","Dolly out","Track","Handheld","Crane","Zoom","Steadicam"];
const STATUS = [["W","Work"],["SW","Start work"],["WF","Work finish"],["SWF","Start-work-finish"],["H","Hold"],["T","Travel"]];
const CREW = [["Direction","Director"],["Direction","1st AD"],["Direction","2nd AD"],["Camera","Director of Photography"],["Camera","1st AC"],["Electric","Gaffer"],["Grip","Key Grip"],["Sound","Production Sound Mixer"],["Art","Production Designer"],["Wardrobe","Costume Designer"],["Hair & Makeup","Key HMU"],["Script","Script Supervisor"],["Production","Production Assistant"]];

const S = {
  db:null, user:null, room:null, dl:null, myId:null, canWrite:true,
  scenes:[], map:{}, panels:[], sheets:[], meta:{}, actors:{}, chars:{}, curChar:null, chStale:false, gone:new Set(),
  view:"script", curSheet:null, focus:{scene:null,i:0}, peers:[], profiles:{},
  dirty:new Set(), inflight:{}, timers:{}, pending:0, offline:false, sheetStale:false,
  editingSince:0, lastVersionAt:0, changedSinceVersion:false, migrated:false
};

/* ---------- utilities ---------- */
let toastT;
function toast(msg){ const t=$("#toast"); t.textContent=msg; t.hidden=false; clearTimeout(toastT); toastT=setTimeout(()=>t.hidden=true,3200); }
function fail(e){
  const c=e&&e.code;
  if(c==="invalid_argument"&&!S.canWrite) return;
  if(c==="invalid_argument"&&S.canKnown){ toast("That change is too large to save. Try a simpler drawing or a shorter scene."); return; }
  if(c==="invalid_argument"){ S.canWrite=false; applyReadOnly(); toast("You can view this project but not change it."); return; }
  if(c==="quota_exceeded") toast("The project storage is full. Delete some storyboard images to free space.");
  else toast("A change didn't save. Check your connection and try again.");
  console.warn(e);
}
function setStatus(){
  const st=$("#status"), tx=$("#statusTxt");
  st.className="status"+(S.offline?" off":S.pending?" saving":"");
  tx.textContent=S.offline?"Not saving":S.pending?"Saving…":"All changes saved";
}
const chains={};
function write(path, fn){
  if(!S.db) return Promise.resolve();
  S.pending++; S.inflight[path]=(S.inflight[path]||0)+1; setStatus();
  const p=(chains[path]||Promise.resolve()).then(()=>fn(S.db.doc(path))).catch(fail).finally(()=>{S.pending--; S.inflight[path]--; setStatus();});
  chains[path]=p; return p;
}
function confirmBox(msg, yes="Delete"){
  return new Promise(res=>{
    $("#cMsg").textContent=msg; $("#cYes").textContent=yes; $("#cov").hidden=false; $("#cYes").focus();
    const done=v=>{ $("#cov").hidden=true; $("#cYes").onclick=$("#cNo").onclick=null; res(v); };
    $("#cYes").onclick=()=>done(true); $("#cNo").onclick=()=>done(false);
  });
}
function fmt12(t){ if(!t) return ""; const [h,m]=t.split(":").map(Number); if(isNaN(h)) return t; return ((h%12)||12)+":"+String(m).padStart(2,"0")+(h<12?" AM":" PM"); }
function fmtDate(d){ if(!d) return "No date"; const x=new Date(d+"T12:00:00"); return isNaN(x)?d:x.toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric",year:"numeric"}); }
function eighthsStr(e){ const w=Math.floor(e/8), r=e%8; return w&&r?`${w} ${r}/8`:w?`${w}`:`${r}/8`; }

/* ---------- screenplay math ---------- */
function lineCount(blocks){
  let n=0;
  blocks.forEach((b,k)=>{
    const prev=blocks[k-1]&&blocks[k-1].t;
    const tight=(b.t==="dialogue"||b.t==="paren")&&(prev==="character"||prev==="paren"||prev==="dialogue");
    if(k>0&&!tight) n+=1;
    n+=Math.max(1,Math.ceil((b.x||"").length/WIDTH[b.t]));
  });
  return n+2;
}
const eighths = sc => Math.max(1, Math.round(lineCount(sc.blocks)/55*8));
const heading = sc => (sc.blocks[0]&&sc.blocks[0].t==="scene"?sc.blocks[0].x:"").trim().toUpperCase();
function dayNight(h){ const m=h.match(/[-–—]\s*([A-Z .'/]+)$/); return m?m[1].trim():""; }
function setName(h){ return h.replace(/^(INT\.?\/EXT\.?|EXT\.?\/INT\.?|I\/E\.?|INT\.?|EXT\.?|EST\.?)\s*/,"").replace(/\s*[-–—]\s*[A-Z .'/]+$/,"").trim(); }
const cleanChar = x => x.toUpperCase().replace(/\(.*?\)/g,"").replace(/[\^@]/g,"").trim();
function charsIn(sc){ const s=new Set(); sc.blocks.forEach(b=>{ if(b.t==="character"){ const n=cleanChar(b.x); if(n) s.add(n);} }); return [...s]; }
function castNumbers(){ const m={}; let n=1; S.scenes.forEach(sc=>charsIn(sc).forEach(c=>{ if(!m[c]) m[c]=n++; })); return m; }
const sceneNo = id => S.scenes.findIndex(s=>s.id===id)+1;

/* ---------- Fountain ---------- */
function parseFountain(text){
  let lines=text.replace(/\r/g,"").replace(/\t/g,"    ").split("\n");
  if(/^\s*(title|credit|author|authors|source|draft date|contact)\s*:/i.test(lines[0]||"")){
    const k=lines.findIndex(l=>!l.trim()); lines=k<0?[]:lines.slice(k+1);
  }
  const out=[]; let prevBlank=true, inDia=false;
  for(let i=0;i<lines.length;i++){
    const l=lines[i].trim(); const next=(lines[i+1]||"").trim(); const last=out[out.length-1];
    if(!l){ prevBlank=true; inDia=false; continue; }
    if(/^(={3,}|\[\[.*\]\]|\/\*|\*\/|#|=)/.test(l)) { prevBlank=false; continue; }
    const upper = l===l.toUpperCase() && /[A-Z]/.test(l);
    if(prevBlank && (/^(INT|EXT|EST|INT\.?\/EXT|EXT\.?\/INT|I\/E)[.\s]/i.test(l) || /^\.[A-Za-z0-9]/.test(l))) out.push({t:"scene",x:l.replace(/^\./,"")});
    else if(prevBlank && ((upper && /TO:$/.test(l)) || (/^>/.test(l) && !/<$/.test(l)) || /^(FADE OUT\.?|FADE IN:|CUT TO BLACK\.?)$/.test(l))) out.push({t:"transition",x:l.replace(/^>\s*/,"")});
    else if(prevBlank && next && ((upper && l.length<=40 && !/[.!?]$/.test(l.replace(/\(.*\)$/,"").trim())) || /^@/.test(l))) { out.push({t:"character",x:l.replace(/^@/,"")}); inDia=true; prevBlank=false; continue; }
    else if(inDia && /^\(.*\)$/.test(l)) out.push({t:"paren",x:l});
    else if(inDia){ if(last&&last.t==="dialogue") last.x+=" "+l; else out.push({t:"dialogue",x:l}); }
    else if(!prevBlank && last && last.t==="action") last.x+="\n"+l;
    else out.push({t:"action",x:l.replace(/^!/,"")});
    prevBlank=false;
  }
  return out;
}
function toFountain(){
  const o=[];
  o.push("Title: "+(S.meta.title||"Untitled"));
  if(S.meta.writer) o.push("Credit: Written by","Author: "+S.meta.writer);
  o.push("Draft date: "+new Date().toLocaleDateString(),"");
  S.scenes.forEach(sc=>sc.blocks.forEach((b,k)=>{
    const prev=sc.blocks[k-1]&&sc.blocks[k-1].t; const x=b.x||"";
    const tight=(b.t==="dialogue"||b.t==="paren")&&(prev==="character"||prev==="paren"||prev==="dialogue");
    if(!tight) o.push("");
    if(b.t==="scene"){ const h=x.toUpperCase()||"INT. UNTITLED"; o.push(/^(INT|EXT|EST|I\/E)/.test(h)?h:"."+h); }
    else if(b.t==="character") o.push(x.toUpperCase());
    else if(b.t==="paren") o.push(/^\(/.test(x)?x:"("+x+")");
    else if(b.t==="transition"){ const t=x.toUpperCase(); o.push(/TO:$/.test(t)?t:"> "+t); }
    else if(b.t==="shot") o.push(x.toUpperCase());
    else o.push(x);
  }));
  return o.join("\n").replace(/\n{3,}/g,"\n\n").trim()+"\n";
}

/* ---------- scene persistence ---------- */
function saveScene(id, now){
  S.gone.delete(id);
  S.dirty.add(id); setStatusDirty();
  clearTimeout(S.timers[id]);
  S.timers[id]=setTimeout(()=>flushScene(id), now?0:650);
}
function setStatusDirty(){ if(S.db){ $("#status").className="status saving"; $("#statusTxt").textContent="Saving…"; } }
function flushScene(id){
  const sc=S.map[id]; S.dirty.delete(id);
  if(!sc){ setStatus(); return; }
  const body={order:sc.order, blocks:sc.blocks.map(b=>({t:b.t,x:b.x})), by:S.myId||null, at:Date.now()};
  write("scenes/"+id, r=>r.set(body));
  if(!S.db) setStatus();
  S.changedSinceVersion=true; maybeAutoVersion();
}
function busy(id){ return S.dirty.has(id) || (S.inflight["scenes/"+id]||0)>0; }

function onScenes(snap){
  const next=[];
  snap.docs.forEach(d=>{
    if(S.gone.has(d.id)) return;
    const local=S.map[d.id];
    if(local && busy(d.id)) { next.push(local); return; }
    const data=d.data()||{};
    let blocks=Array.isArray(data.blocks)?data.blocks.map(b=>({t:TYPES.includes(b&&b.t)?b.t:"action",x:String((b&&b.x)??"")})):[];
    if(!blocks.length||blocks[0].t!=="scene") blocks.unshift({t:"scene",x:""});
    next.push({id:d.id, order:typeof data.order==="number"?data.order:0, blocks});
  });
  S.scenes.forEach(s=>{ if(!S.gone.has(s.id) && !next.some(n=>n.id===s.id) && busy(s.id)) next.push(s); });
  next.sort((a,b)=>a.order-b.order);
  S.loaded=true; S.scenes=next; S.map=Object.fromEntries(next.map(s=>[s.id,s]));
  renderScript(); if(S.view==="board") renderBoard(); if(S.view==="calls"&&!sheetFocused()) renderSheet(); if(S.view==="chars"){ if(chFocused()) S.chStale=true; else renderChars(); }
}

/* ---------- script rendering ---------- */
const PO = (()=>{ const t=document.createElement("div"); try{ t.contentEditable="plaintext-only"; }catch(e){} return t.contentEditable==="plaintext-only"; })();
let lockSceneId=null;
function blockEl(b,i){
  const d=document.createElement("div");
  d.className="blk t-"+b.t; d.dataset.i=i; d.dataset.ph=LABEL[b.t];
  d.textContent=b.x; d.contentEditable=editableFor(lockSceneId)?(PO?"plaintext-only":"true"):"false"; d.spellcheck=true;
  return d;
}
function fillSection(sec, sc){
  sec.innerHTML='<span class="snum l"></span><span class="snum r"></span><span class="here"></span>';
  lockSceneId=sc.id; sc.blocks.forEach((b,i)=>sec.appendChild(blockEl(b,i))); lockSceneId=null;
  sec._sig=JSON.stringify(sc.blocks); sec._stale=false; sec.classList.toggle("locked",!!lockOwner(sc.id));
}
function renderScript(){
  const box=$("#scenes");
  [...box.children].forEach(sec=>{ if(!S.map[sec.dataset.id]) sec.remove(); });
  let prev=null;
  S.scenes.forEach((sc,k)=>{
    let sec=box.querySelector(`section.scene[data-id="${sc.id}"]`);
    if(!sec){ sec=document.createElement("section"); sec.className="scene"; sec.dataset.id=sc.id; fillSection(sec,sc); }
    else if(sec._sig!==JSON.stringify(sc.blocks)){ if(sec.contains(document.activeElement)) sec._stale=true; else fillSection(sec,sc); }
    const ref=prev?prev.nextSibling:box.firstChild;
    if(sec!==ref) box.insertBefore(sec,ref);
    sec.querySelectorAll(".snum").forEach(n=>n.textContent=k+1);
    prev=sec;
  });
  $("#scriptEmpty").hidden=S.scenes.length>0||!S.loaded;
  renderNav(); renderHere();
}
function renderNav(){
  const ol=$("#navList"); let tot=0, words=0;
  S.scenes.forEach(sc=>{ tot+=eighths(sc); sc.blocks.forEach(b=>words+=(b.x.match(/\S+/g)||[]).length); });
  $("#stats").innerHTML=`<span><b>${S.scenes.length}</b> scenes</span><span><b>${eighthsStr(tot)}</b> pages</span><span><b>${words.toLocaleString()}</b> words</span>`;
  ol.innerHTML=S.scenes.map((sc,k)=>{
    const dots=S.peers.filter(p=>!p.isMe&&p.presence&&p.presence.scene===sc.id).map(p=>`<span style="background:${esc(prof(p.by).color)}" title="${esc(prof(p.by).name||"Someone")}"></span>`).join("");
    return `<li data-id="${sc.id}" class="${S.focus.scene===sc.id?"cur":""}"><span class="n">${k+1}</span><button class="h" data-go="${sc.id}" title="${esc(heading(sc))}">${esc(heading(sc)||"Untitled scene")}<span class="pdots">${dots}</span>${lockOwner(sc.id)?' <span class="lockico" title="Being edited">🔒</span>':''}</button><span class="e">${eighthsStr(eighths(sc))}</span>${S.canWrite?`<span class="acts"><button data-up="${sc.id}" aria-label="Move scene up">↑</button><button data-down="${sc.id}" aria-label="Move scene down">↓</button><button data-del="${sc.id}">Delete</button></span>`:""}</li>`;
  }).join("");
}
/* One writer per scene: whoever started editing a scene first holds it; everyone else sees it read-only. */
function editorsOf(id){ return S.peers.filter(p=>!p.isMe&&p.presence&&p.presence.view==="script"&&p.presence.scene===id&&p.presence.editing); }
function lockOwner(id){
  const others=editorsOf(id); if(!others.length) return null;
  const first=others.slice().sort((a,b)=>(a.presence.since||0)-(b.presence.since||0)||String(a.peer).localeCompare(String(b.peer)))[0];
  const mine=S.focus.scene===id&&S.editingSince;
  if(mine&&(S.editingSince<(first.presence.since||0)||(S.editingSince===(first.presence.since||0)&&String(S.myId)<String(first.peer)))) return null;
  return first;
}
function editableFor(id){ return S.canWrite&&!(id&&lockOwner(id)); }
function renderHere(){
  $$("#scenes section.scene").forEach(sec=>{
    const id=sec.dataset.id, h=sec.querySelector(".here"); if(!h) return;
    const owner=lockOwner(id);
    const ps=S.peers.filter(p=>!p.isMe&&p.presence&&p.presence.scene===id&&p.presence.view==="script");
    h.innerHTML=""; ps.forEach(p=>{ const s=document.createElement("span"); const pr=prof(p.by); s.style.background=pr.color; s.textContent=(pr.name||"Someone")+(owner&&owner.peer===p.peer?" is editing · view only":" is here"); h.appendChild(s); });
    const locked=!!owner; sec.classList.toggle("locked",locked);
    const ce=(!locked&&S.canWrite)?(PO?"plaintext-only":"true"):"false";
    sec.querySelectorAll(".blk").forEach(b=>{ if(b.contentEditable!==ce) b.contentEditable=ce; });
    if(locked&&sec.contains(document.activeElement)){
      document.activeElement.blur(); S.editingSince=0; announce();
      toast(`${prof(owner.by).name||"A teammate"} is already editing this scene. It unlocks when they move on.`);
    }
  });
}
function renderTypes(){
  const cur=S.focus.scene&&S.map[S.focus.scene]&&S.map[S.focus.scene].blocks[S.focus.i];
  $("#types").innerHTML=CYCLE.slice(0,6).concat(["scene"]).filter((v,i,a)=>a.indexOf(v)===i).map((t)=>`<button data-type="${t}" class="${cur&&cur.t===t?"on":""}" ${S.canWrite?"":"disabled"}>${LABEL[t]}<kbd>⌘${TYPES.indexOf(t)+1}</kbd></button>`).join("");
}
function renderRev(){
  const r=REVS.find(x=>x[0]===S.meta.rev)||REVS[0];
  $("#rev").innerHTML=REVS.map(([n])=>`<option ${n===r[0]?"selected":""}>${n}</option>`).join("").replace(/<option/g,"<option").replace(/>(\w+)</g,(m,n)=>`>${n} pages<`);
  $("#page").style.setProperty("--rev", r[0]==="White"?"transparent":r[1]);
  $("#revlabel").textContent=r[0]==="White"?"":`${r[0]} rev. ${S.meta.revDate||""}`;
  $("#rev").disabled=!S.canWrite;
}

/* caret helpers */
function getCaret(el){ const s=getSelection(); if(!s.rangeCount) return 0; const r=s.getRangeAt(0); if(!el.contains(r.startContainer)) return 0; const pre=document.createRange(); pre.selectNodeContents(el); pre.setEnd(r.startContainer,r.startOffset); return pre.toString().length; }
function setCaret(el, off){
  el.focus(); const s=getSelection(); const r=document.createRange();
  let n=el.firstChild; off=Math.max(0,Math.min(off,el.textContent.length));
  const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT); let left=off, node;
  while((node=walker.nextNode())){ if(left<=node.length){ r.setStart(node,left); r.collapse(true); s.removeAllRanges(); s.addRange(r); return; } left-=node.length; }
  r.selectNodeContents(el); r.collapse(false); s.removeAllRanges(); s.addRange(r);
}
function caretLine(el){ // -1 first line, 1 last line, 0 middle, 2 single line
  const s=getSelection(); if(!s.rangeCount) return 2; const r=s.getRangeAt(0).cloneRange(); r.collapse(true);
  let rect=r.getClientRects()[0]; const box=el.getBoundingClientRect(); const lh=parseFloat(getComputedStyle(el).lineHeight)||20;
  if(!rect) return 2;
  const first=rect.top-box.top<lh*0.8, last=box.bottom-rect.bottom<lh*0.8;
  return first&&last?2:first?-1:last?1:0;
}
function focusBlock(id,i,off){
  const sec=$(`#scenes section.scene[data-id="${id}"]`); if(!sec) return;
  const el=sec.querySelector(`.blk[data-i="${i}"]`); if(!el) return;
  setCaret(el, off==null?el.textContent.length:off);
  el.scrollIntoView({block:"nearest"});
}
function rebuild(id){ const sec=$(`#scenes section.scene[data-id="${id}"]`); if(sec) fillSection(sec,S.map[id]); renderNav(); }

/* split a scene wherever a scene heading appears after its first block */
function regroup(id, fi, foff){
  const sc=S.map[id]; const groups=[[]]; let target={id, i:fi};
  sc.blocks.forEach((b,k)=>{ if(b.t==="scene"&&k>0) groups.push([]); const g=groups[groups.length-1]; if(k===fi) target={g:groups.length-1,i:g.length}; g.push(b); });
  if(groups.length===1){ rebuild(id); saveScene(id); focusBlock(id,fi,foff); renderTypes(); return; }
  sc.blocks=groups[0];
  const idx=S.scenes.indexOf(sc), nxt=S.scenes[idx+1];
  const top=nxt?nxt.order:sc.order+groups.length, step=(top-sc.order)/groups.length;
  const made=groups.slice(1).map((g,j)=>({id:uid(),order:sc.order+step*(j+1),blocks:g}));
  S.scenes.splice(idx+1,0,...made); made.forEach(m=>S.map[m.id]=m);
  rebuild(id); saveScene(id,true); made.forEach(m=>saveScene(m.id,true));
  renderScript();
  const tid=target.g? made[target.g-1].id : id;
  focusBlock(tid,target.i,foff); renderTypes();
}
function setType(t){
  const {scene:id,i}=S.focus; const sc=S.map[id]; if(!sc||!S.canWrite) return;
  if(i===0) { if(t!=="scene") toast("The first line of a scene is always its heading."); return; }
  const el=$(`#scenes section.scene[data-id="${id}"] .blk[data-i="${i}"]`); const off=el?getCaret(el):0;
  sc.blocks[i].t=t;
  if(t==="scene") return regroup(id,i,off);
  if(el){ el.className="blk t-"+t; el.dataset.ph=LABEL[t]; el.closest("section")._sig=JSON.stringify(sc.blocks); setCaret(el,off); }
  saveScene(id); renderTypes();
}
function insertParsed(id, i, parsed){
  const sc=S.map[id]; const cur=sc.blocks[i];
  if(cur && !cur.x.trim() && !(i===0 && parsed[0].t!=="scene")) sc.blocks.splice(i,1,...parsed);
  else sc.blocks.splice(i+1,0,...parsed);
  if(sc.blocks[0].t!=="scene") sc.blocks.unshift({t:"scene",x:""});
  const at=Math.min(sc.blocks.length-1, sc.blocks.indexOf(parsed[parsed.length-1]));
  regroup(id, at, null);
}

function onKey(e){
  const el=e.target.closest&&e.target.closest(".blk"); if(!el||!S.canWrite) return;
  const sec=el.closest("section.scene"), id=sec.dataset.id, sc=S.map[id], i=+el.dataset.i, b=sc.blocks[i];
  const mod=e.metaKey||e.ctrlKey;
  if(mod && /^[1-7]$/.test(e.key)){ e.preventDefault(); setType(TYPES[+e.key-1]); return; }
  if(e.key==="Enter"){
    e.preventDefault(); b.x=el.textContent; const off=getCaret(el);
    if(i===0&&off===0&&b.x.length){ sceneBefore(id); return; }
    if(!b.x.length && i>0 && b.t!=="action" && b.t!=="scene"){ b.t="action"; rebuild(id); saveScene(id); focusBlock(id,i,0); renderTypes(); return; }
    const before=b.x.slice(0,off), after=b.x.slice(off);
    b.x=before;
    if(b.t==="character"&&before) b.x=before.toUpperCase();
    const nt = after.length? (b.t==="scene"?"action":b.t) : NEXT[b.t];
    sc.blocks.splice(i+1,0,{t:nt,x:after});
    if(nt==="scene") return regroup(id,i+1,0);
    rebuild(id); saveScene(id); focusBlock(id,i+1,0); renderTypes(); return;
  }
  if(e.key==="Tab"){
    e.preventDefault(); if(i===0) return;
    let t;
    if(!el.textContent && b.t==="dialogue") t="paren";
    else { const k=CYCLE.indexOf(b.t); t=CYCLE[(k+(e.shiftKey?CYCLE.length-1:1))%CYCLE.length]; }
    setType(t); return;
  }
  if(e.key==="Backspace"){
    const s=getSelection(); if(!s.isCollapsed||getCaret(el)!==0) return;
    if(i>0){ e.preventDefault(); const p=sc.blocks[i-1]; const pl=p.x.length; p.x+=el.textContent; sc.blocks.splice(i,1); rebuild(id); saveScene(id); focusBlock(id,i-1,pl); return; }
    if(i===0 && !el.textContent && sc.blocks.length===1 && S.scenes.length>1){ e.preventDefault(); const k=S.scenes.indexOf(sc); const prev=S.scenes[k-1]||S.scenes[k+1]; deleteScene(id,true); if(prev) focusBlock(prev.id,prev.blocks.length-1); }
    return;
  }
  if(e.key==="ArrowUp"||e.key==="ArrowDown"){
    const pos=caretLine(el); const up=e.key==="ArrowUp";
    if(!(pos===2||(up&&pos===-1)||(!up&&pos===1))) return;
    const all=$$("#scenes .blk"); const k=all.indexOf(el); const t=all[k+(up?-1:1)]; if(!t) return;
    e.preventDefault(); setCaret(t, up?t.textContent.length:0); t.scrollIntoView({block:"nearest"});
  }
}
function onInput(e){
  const el=e.target.closest&&e.target.closest(".blk"); if(!el) return;
  const sec=el.closest("section.scene"), id=sec.dataset.id, sc=S.map[id]; if(!sc) return;
  sc.blocks[+el.dataset.i].x=el.textContent.replace(/\n/g," ");
  sec._sig=JSON.stringify(sc.blocks);
  saveScene(id);
  if(+el.dataset.i===0) renderNavSoon();
}
let navT; function renderNavSoon(){ clearTimeout(navT); navT=setTimeout(renderNav,300); }
function onPaste(e){
  const el=e.target.closest&&e.target.closest(".blk"); if(!el||!S.canWrite) return;
  e.preventDefault();
  const text=(e.clipboardData||window.clipboardData).getData("text/plain")||"";
  if(!/\n/.test(text.trim())){ document.execCommand("insertText",false,text.replace(/\s*\n\s*/g," ")); return; }
  const parsed=parseFountain(text); if(!parsed.length) return;
  const sec=el.closest("section.scene"); const id=sec.dataset.id; const sc=S.map[id];
  sc.blocks[+el.dataset.i].x=el.textContent;
  insertParsed(id,+el.dataset.i,parsed);
  toast(`Pasted ${parsed.length} script elements.`);
}

/* scene ops */
function lastOrder(){ return S.scenes.length?S.scenes[S.scenes.length-1].order:0; }
function addScene(blocks, focus=true){
  const sc={id:uid(),order:lastOrder()+1,blocks:blocks||[{t:"scene",x:""},{t:"action",x:""}]};
  S.scenes.push(sc); S.map[sc.id]=sc; saveScene(sc.id,true); renderScript();
  if(focus) focusBlock(sc.id,0,0);
  return sc;
}
function sceneBefore(id){
  const k=S.scenes.findIndex(s=>s.id===id), cur=S.scenes[k], prev=S.scenes[k-1];
  const sc={id:uid(),order:prev?(prev.order+cur.order)/2:cur.order-1,blocks:[{t:"scene",x:""},{t:"action",x:""}]};
  S.scenes.splice(k,0,sc); S.map[sc.id]=sc; saveScene(sc.id,true); renderScript(); focusBlock(sc.id,0,0);
}
function deleteScene(id, quiet){
  const run=()=>{ S.gone.add(id); clearTimeout(S.timers[id]); S.dirty.delete(id); S.scenes=S.scenes.filter(s=>s.id!==id); delete S.map[id]; renderScript(); write("scenes/"+id, r=>r.delete()); };
  if(quiet) return run();
  const sc=S.map[id];
  confirmBox(`Delete scene ${sceneNo(id)}${heading(sc)?` (${heading(sc)})`:""}? Its storyboard shots stay under "Unassigned".`).then(ok=>ok&&run());
}
function moveScene(id, dir){
  const k=S.scenes.findIndex(s=>s.id===id), j=k+dir; if(j<0||j>=S.scenes.length) return;
  const a=S.scenes[k], b=S.scenes[j]; [a.order,b.order]=[b.order,a.order];
  if(a.order===b.order) a.order+=dir*0.001;
  S.scenes.sort((x,y)=>x.order-y.order); saveScene(a.id,true); saveScene(b.id,true); renderScript();
}
function importText(text){
  const parsed=parseFountain(text); if(!parsed.length){ toast("No script elements found in that file."); return; }
  const groups=[]; parsed.forEach(b=>{ if(b.t==="scene"||!groups.length) groups.push(b.t==="scene"?[b]:[{t:"scene",x:""},b]); else groups[groups.length-1].push(b); });
  if(S.scenes.length===1 && S.scenes[0].blocks.every(b=>!b.x.trim())) deleteScene(S.scenes[0].id,true);
  groups.forEach(g=>addScene(g,false));
  toast(`Imported ${groups.length} scenes.`);
}

/* ---------- storyboard ---------- */
function onPanels(snap){
  S.panels=snap.docs.map(d=>({id:d.id,...clone(d.data())}));
  migrateFrames();
  if(S.view==="board") renderBoard();
}
function panelsBy(){
  const by={}; S.panels.forEach(p=>{ const k=S.map[p.sceneId]?p.sceneId:"_none"; (by[k]=by[k]||[]).push(p); });
  Object.values(by).forEach(a=>a.sort((x,y)=>(x.order||0)-(y.order||0)));
  return by;
}
function renderBoard(){
  const f=$("#sbFilter"); const cur=f.value||"all";
  f.innerHTML=`<option value="all">All scenes</option>`+S.scenes.map((sc,k)=>`<option value="${sc.id}">${k+1}. ${esc(heading(sc)||"Untitled scene")}</option>`).join("")+`<option value="_none">Unassigned</option>`;
  f.value=[...f.options].some(o=>o.value===cur)?cur:"all";
  const by=panelsBy(); const show=f.value;
  $("#sbCount").textContent=`${S.panels.length} shot${S.panels.length===1?"":"s"} · ${S.panels.reduce((a,p)=>a+(parseFloat(p.dur)||0),0)} sec planned`;
  const list=(show==="all"?S.scenes.map(s=>s.id).concat(by._none?["_none"]:[]):[show]);
  if(!S.scenes.length && !S.panels.length){
    $("#sbBody").innerHTML=`<div class="empty"><h2>No scenes yet</h2><p style="margin:0">Storyboards are organized by scene. Write or import a scene in the Script tab, then come back to draw its shots.</p><button class="btn primary" data-goview="script">Go to Script</button></div>`; return;
  }
  $("#sbBody").innerHTML=list.map(sid=>{
    const sc=S.map[sid]; const n=sc?sceneNo(sid):""; const ps=by[sid]||[];
    return `<div class="sb-scene"><h3><span class="n">${n||"—"}</span>${esc(sc?heading(sc)||"Untitled scene":"Unassigned shots")}<span class="hint" style="text-transform:none;font-family:var(--f-ui)">${ps.length} shot${ps.length===1?"":"s"}</span></h3><div class="grid">`+
      ps.map((p,k)=>{
        const tag=(n||"X")+String.fromCharCode(65+(k%26))+(k>=26?Math.floor(k/26):"");
        return `<article class="panel"><button class="frame" data-edit="${p.id}" aria-label="Edit shot ${tag}">${p.img?`<img src="${esc(p.img)}" alt="Storyboard frame ${tag}">`:`<span class="blank">No frame drawn</span>`}<span class="tag">${tag}</span></button>
        <div class="pmeta"><div class="chips">${p.shot?`<span class="chip">${esc(p.shot)}</span>`:""}${p.angle?`<span class="chip dim">${esc(p.angle)}</span>`:""}${p.move?`<span class="chip dim">${esc(p.move)}</span>`:""}${p.lens?`<span class="chip dim">${esc(p.lens)}mm</span>`:""}${p.dur?`<span class="chip dim">${esc(p.dur)}s</span>`:""}${p.setup?`<span class="chip dim">${esc(p.setup)}</span>`:""}</div>
        ${p.desc?`<div class="pdesc">${esc(p.desc)}</div>`:""}${p.audio?`<div class="paudio">${esc(p.audio)}</div>`:""}</div>
        ${S.canWrite?`<div class="pfoot"><button class="btn ghost" data-pmove="${p.id}" data-dir="-1" aria-label="Move earlier">←</button><button class="btn ghost" data-pmove="${p.id}" data-dir="1" aria-label="Move later">→</button><button class="btn ghost" data-edit="${p.id}">Edit</button></div>`:""}</article>`;
      }).join("")+(S.canWrite&&sc?`<button class="addp" data-addp="${sid}">+ Add shot</button>`:"")+`</div></div>`;
  }).join("");
}
function movePanel(id,dir){
  const p=S.panels.find(x=>x.id===id); const by=panelsBy(); const arr=by[S.map[p.sceneId]?p.sceneId:"_none"];
  const k=arr.indexOf(p), j=k+dir; if(j<0||j>=arr.length) return;
  arr.forEach((x,n)=>x.order=n); const q=arr[j]; [p.order,q.order]=[q.order,p.order];
  arr.forEach(x=>write("panels/"+x.id, r=>r.update({order:x.order})));
  renderBoard();
}

/* panel editor */
const cv=$("#cv"), cx=cv.getContext("2d");
const ED={id:null, tool:"pen", undo:[], drawing:false, last:null, touched:false};
function fillOpts(sel, arr, v){ sel.innerHTML=`<option value="">—</option>`+arr.map(a=>`<option ${a===v?"selected":""}>${esc(a)}</option>`).join(""); }
function openPanel(id, sceneId){
  const p=id?S.panels.find(x=>x.id===id):null; ED.id=id; ED.undo=[]; ED.touched=false;
  const sid=p?p.sceneId:sceneId;
  $("#pScene").innerHTML=S.scenes.map((sc,k)=>`<option value="${sc.id}" ${sc.id===sid?"selected":""}>${k+1}. ${esc(heading(sc)||"Untitled scene")}</option>`).join("");
  fillOpts($("#pShot"),SHOTS,p&&p.shot); fillOpts($("#pAngle"),ANGLES,p&&p.angle); fillOpts($("#pMove"),MOVES,p&&p.move);
  $("#pLens").value=p&&p.lens||""; $("#pDur").value=p&&p.dur||""; $("#pSetup").value=p&&p.setup||""; $("#pDesc").value=p&&p.desc||""; $("#pAudio").value=p&&p.audio||"";
  $("#pTitle").textContent=p?"Edit shot":"New shot"; $("#pDelete").hidden=!p;
  cx.fillStyle="#fff"; cx.fillRect(0,0,cv.width,cv.height);
  if(p&&p.img){ const im=new Image(); im.onload=()=>cx.drawImage(im,0,0,cv.width,cv.height); im.src=p.img; }
  const ro=!S.canWrite; $$("#pov .form .field").forEach(f=>f.disabled=ro); $("#pSave").hidden=ro; $("#pDelete").hidden=ro||!p;
  $("#pov").hidden=false;
}
function closePanel(){ $("#pov").hidden=true; }
function pos(e){ const r=cv.getBoundingClientRect(); return {x:(e.clientX-r.left)*cv.width/r.width, y:(e.clientY-r.top)*cv.height/r.height}; }
cv.addEventListener("pointerdown",e=>{
  if(!S.canWrite) return; cv.setPointerCapture(e.pointerId); ED.drawing=true; ED.last=pos(e); ED.touched=true;
  ED.undo.push(cx.getImageData(0,0,cv.width,cv.height)); if(ED.undo.length>25) ED.undo.shift();
  stroke(ED.last,ED.last,e);
});
cv.addEventListener("pointermove",e=>{ if(!ED.drawing) return; const p=pos(e); stroke(ED.last,p,e); ED.last=p; });
["pointerup","pointercancel","pointerleave"].forEach(t=>cv.addEventListener(t,()=>ED.drawing=false));
function stroke(a,b,e){
  const size=+$("#pSize").value; const pr=e.pressure&&e.pointerType==="pen"?(0.4+e.pressure):1;
  cx.save(); cx.lineCap="round"; cx.lineJoin="round";
  if(ED.tool==="eraser"){ cx.strokeStyle="#fff"; cx.lineWidth=size*4; }
  else if(ED.tool==="marker"){ cx.strokeStyle="rgba(90,96,92,.28)"; cx.lineWidth=size*3.5; }
  else { cx.strokeStyle="#1b1d1c"; cx.lineWidth=size*pr; }
  cx.beginPath(); cx.moveTo(a.x,a.y); cx.lineTo(b.x+0.01,b.y); cx.stroke(); cx.restore();
}
$$("[data-tool]").forEach(b=>b.onclick=()=>{ ED.tool=b.dataset.tool; $$("[data-tool]").forEach(x=>x.classList.toggle("on",x===b)); });
$("#pUndo").onclick=()=>{ const d=ED.undo.pop(); if(d) cx.putImageData(d,0,0); };
$("#pClear").onclick=()=>{ ED.undo.push(cx.getImageData(0,0,cv.width,cv.height)); cx.fillStyle="#fff"; cx.fillRect(0,0,cv.width,cv.height); ED.touched=true; };
$("#pThirds").onclick=()=>{ $("#thirds").hidden=!$("#thirds").hidden; $("#pThirds").classList.toggle("on",!$("#thirds").hidden); };
$("#pUpload").onclick=()=>$("#pFile").click();
$("#pFile").onchange=e=>{
  const f=e.target.files[0]; e.target.value=""; if(!f) return;
  const rd=new FileReader(); rd.onload=()=>{ const im=new Image(); im.onload=()=>{
    ED.undo.push(cx.getImageData(0,0,cv.width,cv.height));
    const s=Math.max(cv.width/im.width,cv.height/im.height), w=im.width*s, h=im.height*s;
    cx.fillStyle="#fff"; cx.fillRect(0,0,cv.width,cv.height); cx.drawImage(im,(cv.width-w)/2,(cv.height-h)/2,w,h); ED.touched=true;
  }; im.onerror=()=>toast("That file couldn't be read as an image."); im.src=rd.result; }; rd.readAsDataURL(f);
};
$("#pClose").onclick=$("#pCancel").onclick=closePanel;
$("#pov").addEventListener("click",e=>{ if(e.target.id==="pov") closePanel(); });
$("#pSave").onclick=async()=>{
  const p=ED.id?S.panels.find(x=>x.id===ED.id):null;
  const btn=$("#pSave"); if(btn.disabled) return;
  const sceneId=$("#pScene").value;
  const data={sceneId, shot:$("#pShot").value, angle:$("#pAngle").value, move:$("#pMove").value, lens:$("#pLens").value.trim(), dur:$("#pDur").value.trim(), setup:$("#pSetup").value.trim(), desc:$("#pDesc").value.trim(), audio:$("#pAudio").value.trim(), by:S.myId||null, at:Date.now()};
  if(ED.touched||!p){
    btn.disabled=true; btn.textContent="Saving frame…";
    try{
      const blob=await new Promise(r=>cv.toBlob(r,"image/jpeg",0.82));
      data.img=await uploadFrame(blob);
    }catch(e){ btn.disabled=false; btn.textContent="Save shot"; toast("The frame couldn't be uploaded. Check your connection and try again."); return; }
    btn.disabled=false; btn.textContent="Save shot";
  } else data.img=p.img||"";
  if(p&&p.sceneId===sceneId) data.order=p.order||0;
  else data.order=Math.max(-1,...S.panels.filter(x=>x.sceneId===sceneId).map(x=>x.order||0))+1;
  const id=ED.id||uid();
  const local=S.panels.find(x=>x.id===id); if(local) Object.assign(local,data); else S.panels.push({id,...data});
  write("panels/"+id, r=>r.set(data)); closePanel(); renderBoard(); toast("Shot saved.");
};
$("#pDelete").onclick=async()=>{
  if(!ED.id) return; const id=ED.id;
  if(!await confirmBox("Delete this shot and its drawing?")) return;
  S.panels=S.panels.filter(x=>x.id!==id); write("panels/"+id, r=>r.delete()); closePanel(); renderBoard();
};

/* ---------- call sheets ---------- */
function onSheets(snap){
  const sorted=snap.docs.map(d=>({id:d.id,...clone(d.data())}));
  S.sheets=sorted.sort((a,b)=>(a.date||"9999").localeCompare(b.date||"9999")||(a.day||0)-(b.day||0));
  if(!S.curSheet||!S.sheets.some(s=>s.id===S.curSheet)) S.curSheet=S.sheets[0]&&S.sheets[0].id;
  if(S.view==="calls"){ renderDays(); if(sheetFocused()) S.sheetStale=true; else renderSheet(); }
}
const sheetFocused=()=>$("#sheetWrap").contains(document.activeElement)&&document.activeElement!==document.body;
function renderDays(){
  $("#days").innerHTML=S.sheets.length?S.sheets.map(s=>`<button class="d ${s.id===S.curSheet?"cur":""}" data-sheet="${s.id}"><span>Day ${esc(s.day||"?")}${s.ofDays?` of ${esc(s.ofDays)}`:""}</span><small>${esc(fmtDate(s.date))} · ${s.crewCall?esc(fmt12(s.crewCall)):"no call set"}</small></button>`).join(""):`<p class="hint" style="margin:6px">No shoot days yet.</p>`;
  $("#newSheet").disabled=!S.canWrite;
}
function curSheet(){ return S.sheets.find(s=>s.id===S.curSheet); }
function renderSheet(){
  S.sheetStale=false; renderDays();
  const sh=curSheet(); const w=$("#sheetWrap");
  if(!sh){ w.innerHTML=`<div class="sheet"><div class="empty"><h2>Plan the first shoot day</h2><p style="margin:0">A call sheet tells cast and crew when and where to show up. Pick scenes from the script and Backlot fills in the cast and page counts.</p>${S.canWrite?`<button class="btn primary" data-newsheet>+ New shoot day</button>`:""}</div></div>`; return; }
  const scenes=(sh.scenes||[]).map(id=>S.map[id]).filter(Boolean);
  const nums=castNumbers(); const chars=[...new Set(scenes.flatMap(charsIn))].sort((a,b)=>(nums[a]||99)-(nums[b]||99));
  const pages=scenes.reduce((a,s)=>a+eighths(s),0);
  const cast=sh.cast||{}; const crew=Array.isArray(sh.crew)?sh.crew:[];
  const dis=S.canWrite?"":"disabled";
  w.innerHTML=`<div class="sheet-tools"><button class="btn" id="csCopy">Copy text for group chat</button><button class="btn" id="csExport">Download call sheet</button><button class="btn" id="csDup" ${dis}>Duplicate day</button><button class="btn danger" id="csDel" ${dis}>Delete day</button></div>
  <div class="sheet">
   <div class="cs-head">
    <div class="col"><div class="cs-title">${esc(S.meta.title||"Untitled project")}</div>
      <label>Director<input class="field" data-f="director" ${dis}></label>
      <div class="row2"><label>Producer<input class="field" data-f="producer" ${dis}></label><label>1st AD<input class="field" data-f="ad" ${dis}></label></div></div>
    <div class="cs-call"><span class="eyebrow">General crew call</span><input type="time" class="big" data-f="crewCall" aria-label="General crew call" ${dis}>
      <div class="row3"><label>Shooting<input type="time" class="field" data-f="shootCall" ${dis}></label><label>Lunch<input type="time" class="field" data-f="lunch" ${dis}></label><label>Est. wrap<input type="time" class="field" data-f="wrap" ${dis}></label></div></div>
    <div class="col"><label>Date<input type="date" class="field" data-f="date" ${dis}></label>
      <div class="row2"><label>Day<input type="number" min="1" class="field" data-f="day" ${dis}></label><label>Of<input type="number" min="1" class="field" data-f="ofDays" ${dis}></label></div>
      <label>Weather<input class="field" data-f="weather" placeholder="68°F, clear, 10% rain" ${dis}></label>
      <div class="row2"><label>Sunrise<input type="time" class="field" data-f="sunrise" ${dis}></label><label>Sunset<input type="time" class="field" data-f="sunset" ${dis}></label></div></div>
   </div>
   <div class="cs-loc">
    <label>Location<input class="field" data-f="location" placeholder="Location name" ${dis}></label>
    <label>Address<input class="field" data-f="address" ${dis}></label>
    <label>Parking / basecamp<input class="field" data-f="parking" ${dis}></label>
    <label>Nearest hospital<input class="field" data-f="hospital" ${dis}></label>
   </div>
   <h3>Scenes <span class="hint" style="font-family:var(--f-ui);letter-spacing:0">${scenes.length} scenes · ${pages?eighthsStr(pages):"0"} pages</span></h3>
   <div class="tw"><table class="t"><thead><tr><th>Sc.</th><th>Set / heading</th><th>D/N</th><th>Pages</th><th>Cast</th><th></th></tr></thead><tbody>
    ${scenes.map(sc=>`<tr><td><b>${sceneNo(sc.id)}</b></td><td class="mono">${esc(setName(heading(sc))||heading(sc)||"Untitled")}<div class="muted" style="font-size:11px;text-transform:none;font-family:var(--f-ui)">${esc(/^EXT/.test(heading(sc))?"Exterior":/^INT/.test(heading(sc))?"Interior":"")}</div></td><td>${esc(dayNight(heading(sc)))}</td><td>${eighthsStr(eighths(sc))}</td><td>${charsIn(sc).map(c=>nums[c]).sort((a,b)=>a-b).join(", ")}</td><td>${S.canWrite?`<button class="x" data-rmscene="${sc.id}" aria-label="Remove scene from day">✕</button>`:""}</td></tr>`).join("")||`<tr><td colspan="6" class="muted">No scenes scheduled. Add scenes from the script below.</td></tr>`}
   </tbody></table></div>
   ${S.canWrite?`<div style="margin-top:8px;max-width:420px"><select class="field" id="addSc"><option value="">+ Add a scene from the script…</option>${S.scenes.filter(s=>!(sh.scenes||[]).includes(s.id)).map(s=>`<option value="${s.id}">${sceneNo(s.id)}. ${esc(heading(s)||"Untitled scene")}</option>`).join("")}</select></div>`:""}
   <h3>Cast</h3>
   <div class="tw"><table class="t"><thead><tr><th>#</th><th>Character</th><th>Cast member</th><th>Status</th><th>Pickup</th><th>Hair/MU</th><th>On set</th></tr></thead><tbody>
    ${chars.map(c=>{ const r=cast[c]||{}; return `<tr><td><b>${nums[c]||""}</b></td><td class="mono"><button class="linkbtn" data-goch="${esc(c)}" title="Open character sheet">${esc(c)}</button></td><td><input data-actor="${esc(c)}" value="${esc(S.actors[c]||"")}" placeholder="Name" ${dis}></td>
      <td><select data-cast="${esc(c)}" data-k="status" ${dis}><option value="">—</option>${STATUS.map(([k,l])=>`<option value="${k}" ${r.status===k?"selected":""} title="${l}">${k}</option>`).join("")}</select></td>
      <td><input type="time" data-cast="${esc(c)}" data-k="pickup" value="${esc(r.pickup||"")}" ${dis}></td><td><input type="time" data-cast="${esc(c)}" data-k="hmu" value="${esc(r.hmu||"")}" ${dis}></td><td><input type="time" data-cast="${esc(c)}" data-k="set" value="${esc(r.set||"")}" ${dis}></td></tr>`; }).join("")||`<tr><td colspan="7" class="muted">Cast appears here from the characters who speak in the scheduled scenes.</td></tr>`}
   </tbody></table></div>
   <p class="hint" style="margin:6px 0 0">Status: W work · SW start work · WF work finish · SWF start-work-finish · H hold · T travel</p>
   <h3>Crew calls ${S.canWrite?`<span style="display:flex;gap:6px">${crew.length?"":`<button class="btn" id="crewStd">Add standard crew list</button>`}<button class="btn" id="crewAdd">+ Add crew</button></span>`:""}</h3>
   <div class="tw"><table class="t"><thead><tr><th>Department</th><th>Position</th><th>Name</th><th>Call</th><th></th></tr></thead><tbody>
    ${crew.map((r,k)=>`<tr><td><input data-crew="${k}" data-k="dept" value="${esc(r.dept||"")}" ${dis}></td><td><input data-crew="${k}" data-k="role" value="${esc(r.role||"")}" ${dis}></td><td><input data-crew="${k}" data-k="name" value="${esc(r.name||"")}" placeholder="Name" ${dis}></td><td><input type="time" data-crew="${k}" data-k="call" value="${esc(r.call||"")}" title="Blank means general crew call" ${dis}></td><td>${S.canWrite?`<button class="x" data-rmcrew="${k}" aria-label="Remove crew row">✕</button>`:""}</td></tr>`).join("")||`<tr><td colspan="5" class="muted">No crew listed. Blank call times default to the general crew call.</td></tr>`}
   </tbody></table></div>
   <h3>Notes</h3>
   <textarea class="field" data-f="notes" rows="4" placeholder="Safety notes, special equipment, advance schedule…" ${dis}></textarea>
  </div>`;
  w.querySelectorAll("[data-f]").forEach(el=>el.value=sh[el.dataset.f]??"");
}
function patchSheet(fields){
  const sh=curSheet(); if(!sh||!S.canWrite) return;
  Object.assign(sh,clone(fields));
  write("callsheets/"+sh.id, r=>r.update(fields));
}
function newSheet(copyFrom){
  if(!S.canWrite) return;
  const last=S.sheets[S.sheets.length-1];
  let date=""; if(last&&last.date){ const d=new Date(last.date+"T12:00:00"); d.setDate(d.getDate()+1); date=d.toISOString().slice(0,10); }
  const base=copyFrom?clone(copyFrom):{crewCall:"07:00",shootCall:"08:00",lunch:"13:00",crew:[],cast:{},scenes:[]};
  delete base.id;
  const sh={...base, date: copyFrom?date||base.date||"":date, day:(Math.max(0,...S.sheets.map(s=>+s.day||0))+1), ofDays:(last&&last.ofDays)||"", scenes: copyFrom?[]:[], cast: copyFrom?{}:{}};
  const id=uid(); S.sheets.push({id,...sh}); S.curSheet=id; write("callsheets/"+id, r=>r.set(sh)); renderSheet();
  toast(copyFrom?"Day duplicated with the same crew and times. Add its scenes.":"New shoot day added.");
}
function sheetText(sh){
  const scenes=(sh.scenes||[]).map(id=>S.map[id]).filter(Boolean); const nums=castNumbers();
  const L=[`${S.meta.title||"Untitled project"} — CALL SHEET`, `Day ${sh.day||"?"}${sh.ofDays?" of "+sh.ofDays:""} · ${fmtDate(sh.date)}`, `General crew call: ${fmt12(sh.crewCall)||"TBD"}${sh.shootCall?" · Shooting call: "+fmt12(sh.shootCall):""}`];
  if(sh.location) L.push(`Location: ${sh.location}${sh.address?" — "+sh.address:""}`);
  if(sh.parking) L.push(`Parking: ${sh.parking}`);
  if(sh.hospital) L.push(`Nearest hospital: ${sh.hospital}`);
  if(sh.weather) L.push(`Weather: ${sh.weather}${sh.sunrise?" · Sunrise "+fmt12(sh.sunrise):""}${sh.sunset?" · Sunset "+fmt12(sh.sunset):""}`);
  if(scenes.length){ L.push("","SCENES"); scenes.forEach(s=>L.push(`  ${sceneNo(s.id)}. ${heading(s)} (${eighthsStr(eighths(s))} pg)`)); }
  const chars=[...new Set(scenes.flatMap(charsIn))].sort((a,b)=>nums[a]-nums[b]);
  if(chars.length){ L.push("","CAST"); chars.forEach(c=>{ const r=(sh.cast||{})[c]||{}; L.push(`  ${nums[c]}. ${c}${S.actors[c]?" ("+S.actors[c]+")":""}${r.status?" ["+r.status+"]":""} — ${[r.pickup&&"pickup "+fmt12(r.pickup),r.hmu&&"H/MU "+fmt12(r.hmu),r.set&&"on set "+fmt12(r.set)].filter(Boolean).join(", ")||"time TBD"}`); }); }
  const crew=(sh.crew||[]).filter(r=>r.role||r.name);
  if(crew.length){ L.push("","CREW"); crew.forEach(r=>L.push(`  ${r.role||r.dept}${r.name?": "+r.name:""} — ${fmt12(r.call||sh.crewCall)||"TBD"}`)); }
  if(sh.notes) L.push("","NOTES",sh.notes);
  return L.join("\n");
}
function sheetHTML(sh){
  const t=esc(sheetText(sh));
  return `<!doctype html><html><head><meta charset="utf-8"><title>Call sheet — Day ${esc(sh.day||"")}</title><style>body{font:14px/1.5 "Courier Prime","Courier New",monospace;max-width:760px;margin:40px auto;padding:0 20px;color:#111}pre{white-space:pre-wrap;font:inherit}</style></head><body><pre>${t}</pre></body></html>`;
}

/* ---------- presence ---------- */
function prof(id){ return S.profiles[id]||{name:"",color:"#7a8580",avatarUrl:""}; }
let presT;
function announce(){ clearTimeout(presT); presT=setTimeout(()=>{ if(S.room) S.room.presence({view:S.view, scene:S.view==="script"?S.focus.scene:null, editing:S.view==="script"&&!!S.editingSince, since:S.editingSince||0}).catch(()=>{}); },150); }
async function renderPeople(){
  const ids=[...new Set(S.peers.map(p=>p.by).filter(Boolean))];
  if(S.user&&ids.length){ try{ S.profiles=await S.user.profiles(ids); }catch(e){} }
  const box=$("#people"); box.innerHTML="";
  const uniq=[]; const seen=new Set(); S.peers.forEach(p=>{ const k=p.by||p.peer; if(!seen.has(k)){ seen.add(k); uniq.push(p);} });
  const where={script:"Script",chars:"Characters",board:"Storyboard",calls:"Call sheets"};
  uniq.slice(0,6).forEach(p=>{ const pr=prof(p.by); const im=document.createElement("img"); im.className="av"; im.src=pr.avatarUrl||""; im.alt=""; im.style.borderColor=pr.color; im.title=`${p.isMe?"You":(pr.name||"Someone")} · ${where[p.presence&&p.presence.view]||"Here"}`; box.appendChild(im); });
  if(uniq.length>6){ const s=document.createElement("span"); s.className="hint"; s.style.marginLeft="6px"; s.textContent="+"+(uniq.length-6); box.appendChild(s); }
  renderNav(); renderHere();
}

/* ---------- views & events ---------- */
function setView(v){
  S.view=v; $$(".tab").forEach(t=>t.setAttribute("aria-selected",t.dataset.view===v?"true":"false"));
  ["script","chars","board","calls"].forEach(n=>$("#v-"+n).hidden=n!==v);
  if(v==="board") renderBoard(); if(v==="calls") renderSheet(); if(v==="chars") renderChars();
  try{ localStorage.setItem("backlot.view",v); }catch(e){}
  announce();
}
function applyReadOnly(){
  $$("#scenes .blk").forEach(b=>b.contentEditable=S.canWrite?(PO?"plaintext-only":"true"):"false");
  $("#ptitle").disabled=!S.canWrite; ["#addScene","#importBtn","#startScript","#emptyImport","#clearScript"].forEach(s=>$(s).disabled=!S.canWrite);
  renderTypes(); renderRev(); renderNav();
  if(!S.canWrite){ const b=$("#banner"); b.hidden=false; b.textContent="You have view access. Ask the project owner for edit access to write, draw shots or change call times."; }
  if(S.view==="board") renderBoard(); if(S.view==="calls") renderSheet(); if(S.view==="chars") renderChars();
}

root.addEventListener("click",e=>{
  const t=e.target.closest("button,[data-go]"); if(!t) return;
  const d=t.dataset;
  if(d.view) setView(d.view);
  else if(d.goview) setView(d.goview);
  else if(d.goch){ S.curChar=ckey(d.goch); setView("chars"); }
  else if(d.go){ const sc=S.map[d.go]; if(sc){ setView("script"); focusBlock(d.go,0); $(`#scenes section.scene[data-id="${d.go}"]`).scrollIntoView({block:"start",behavior:"smooth"}); } }
  else if(d.up) moveScene(d.up,-1);
  else if(d.down) moveScene(d.down,1);
  else if(d.del) deleteScene(d.del);
  else if(d.type){ setType(d.type); }
  else if(d.edit) openPanel(d.edit);
  else if(d.addp){ if(!S.scenes.length) return; openPanel(null,d.addp); }
  else if(d.pmove) movePanel(d.pmove,+d.dir);
  else if(d.sheet){ S.curSheet=d.sheet; renderSheet(); }
  else if("newsheet" in d) newSheet();
  else if(d.rmscene){ const sh=curSheet(); patchSheet({scenes:(sh.scenes||[]).filter(x=>x!==d.rmscene)}); renderSheet(); }
  else if(d.rmcrew!=null){ const sh=curSheet(); const c=(sh.crew||[]).slice(); c.splice(+d.rmcrew,1); patchSheet({crew:c}); renderSheet(); }
  else if(t.id==="crewAdd"){ const sh=curSheet(); patchSheet({crew:(sh.crew||[]).concat([{dept:"",role:"",name:"",call:""}])}); renderSheet(); }
  else if(t.id==="crewStd"){ const sh=curSheet(); patchSheet({crew:(sh.crew||[]).concat(CREW.map(([dept,role])=>({dept,role,name:"",call:""})))}); renderSheet(); }
  else if(t.id==="csDup") newSheet(curSheet());
  else if(t.id==="csDel"){ const sh=curSheet(); confirmBox(`Delete the call sheet for Day ${sh.day||"?"} (${fmtDate(sh.date)})?`).then(ok=>{ if(!ok) return; S.sheets=S.sheets.filter(s=>s.id!==sh.id); S.curSheet=S.sheets[0]&&S.sheets[0].id; write("callsheets/"+sh.id,r=>r.delete()); renderSheet(); }); }
  else if(t.id==="csCopy"){ const txt=sheetText(curSheet()); navigator.clipboard.writeText(txt).then(()=>toast("Call sheet copied. Paste it into your group chat."),()=>toast("Copy isn't available here. Use Download instead.")); }
  else if(t.id==="csExport"){ const sh=curSheet(); saveFile(`call-sheet-day-${sh.day||"x"}.html`, sheetHTML(sh)); }
});
async function saveFile(name, data){
  if(!S.dl){ toast("Downloads aren't available in this view."); return; }
  try{ await S.dl.save({filename:name, data}); }
  catch(e){ if(e&&e.code==="declined") return; toast(e&&e.code==="rejected_extension"?"This file type can't be downloaded here.":"The download didn't start. Try again."); }
}
$("#sheetWrap").addEventListener("change",e=>{
  const el=e.target; const d=el.dataset; const sh=curSheet(); if(!sh) return;
  if(el.id==="addSc"&&el.value){ patchSheet({scenes:(sh.scenes||[]).concat([el.value])}); renderSheet(); return; }
  if(d.f){ let v=el.value; if(el.type==="number") v=v===""?"":Number(v); patchSheet({[d.f]:v}); if(d.f==="date"||d.f==="day"||d.f==="ofDays"||d.f==="crewCall") renderDays(); return; }
  if(d.cast){ const c=sh.cast||{}; c[d.cast]={...(c[d.cast]||{}),[d.k]:el.value}; sh.cast=c; write("callsheets/"+sh.id,r=>r.update({cast:{[d.cast]:{[d.k]:el.value}}})); return; }
  if(d.actor!=null&&d.actor!==undefined&&el.hasAttribute("data-actor")){ S.actors[d.actor]=el.value.trim(); const a={...S.actors}; write("project/cast",r=>r.set({actors:a})); return; }
  if(d.crew!=null){ const c=(sh.crew||[]).map(x=>({...x})); c[+d.crew][d.k]=el.value; patchSheet({crew:c}); }
});
$("#sheetWrap").addEventListener("focusout",()=>setTimeout(()=>{ if(S.sheetStale&&!sheetFocused()) renderSheet(); },0));
$("#newSheet").onclick=()=>newSheet();
$("#sbFilter").onchange=renderBoard;

const scenesBox=$("#scenes");
scenesBox.addEventListener("keydown",onKey);
scenesBox.addEventListener("input",onInput);
scenesBox.addEventListener("paste",onPaste);
scenesBox.addEventListener("focusin",e=>{
  const el=e.target.closest(".blk"); if(!el) return;
  const id=el.closest("section.scene").dataset.id; const changed=S.focus.scene!==id||!S.editingSince;
  clearTimeout(S.idleT);
  if(lockOwner(id)){ el.blur(); toast(`${prof(lockOwner(id).by).name||"A teammate"} is editing this scene right now.`); return; }
  if(changed) S.editingSince=Date.now();
  S.focus={scene:id,i:+el.dataset.i}; renderTypes(); if(changed){ renderNav(); announce(); }
});
scenesBox.addEventListener("focusout",e=>{
  const sec=e.target.closest("section.scene");
  clearTimeout(S.idleT);
  S.idleT=setTimeout(()=>{ if(!scenesBox.contains(document.activeElement)&&S.editingSince){ S.editingSince=0; announce(); } },1200);
  setTimeout(()=>{ if(sec&&sec._stale&&!sec.contains(document.activeElement)&&S.map[sec.dataset.id]) { fillSection(sec,S.map[sec.dataset.id]); renderScript(); } },0);
});
$("#types").addEventListener("mousedown",e=>{ if(e.target.closest("button")) e.preventDefault(); });
$("#addScene").onclick=()=>addScene();
$("#startScript").onclick=()=>addScene();
$("#emptyImport").onclick=()=>$("#importFile").click();
$("#importBtn").onclick=()=>$("#importFile").click();
$("#importFile").onchange=e=>{ const f=e.target.files[0]; e.target.value=""; if(!f) return; const r=new FileReader(); r.onload=()=>importText(String(r.result)); r.readAsText(f); };
$("#exportBtn").onclick=()=>saveFile(((S.meta.title||"screenplay").replace(/[^\w\- ]+/g,"").trim().replace(/\s+/g,"-")||"screenplay")+".fountain", toFountain());
$("#ptitle").addEventListener("change",e=>{ S.meta.title=e.target.value.trim(); write("project/meta",r=>r.set({...S.meta})); if(S.view==="calls") renderSheet(); });
$("#rev").addEventListener("change",e=>{ S.meta.rev=e.target.value.replace(/ pages$/,""); S.meta.revDate=new Date().toLocaleDateString(undefined,{month:"2-digit",day:"2-digit",year:"2-digit"}); renderRev(); write("project/meta",r=>r.set({...S.meta})); });
root.addEventListener("keydown",e=>{ if(e.key==="Escape"){ if(!$("#cov").hidden) $("#cNo").click(); else if(!$("#pov").hidden) closePanel(); } });

/* ---------- storyboard frames in file storage ---------- */
async function uploadFrame(blob){
  if(adapters.uploadImage) return await adapters.uploadImage(new File([blob],"frame.jpg",{type:"image/jpeg"}));
  return await new Promise(r=>{ const fr=new FileReader(); fr.onload=()=>r(fr.result); fr.readAsDataURL(blob); });
}
/* Older shots kept their drawing inside the database. Move each one to file storage once. */
async function migrateFrames(){
  if(S.migrated||!S.canWrite||!adapters.uploadImage) return;
  const old=S.panels.filter(p=>typeof p.img==="string"&&p.img.startsWith("data:image"));
  if(!old.length) return;
  S.migrated=true;
  for(const p of old){
    if(dead) return;
    try{
      const blob=await (await fetch(p.img)).blob();
      const url=await adapters.uploadImage(new File([blob],"frame.jpg",{type:blob.type||"image/jpeg"}));
      await write("panels/"+p.id, r=>r.update({img:url}));
    }catch(e){ console.warn("frame move failed",e); }
  }
}

/* ---------- version history ---------- */
const AUTO_EVERY=10*60*1000;
function scriptSnapshot(){
  return { scenes:S.scenes.map(s=>({id:s.id,order:s.order,blocks:s.blocks.map(b=>({t:b.t,x:b.x}))})), meta:{title:S.meta.title||""} };
}
function totalPages(scenes){ const e=scenes.reduce((a,s)=>a+eighths(s),0); return e?eighthsStr(e):"0"; }
async function saveVersion(label, auto){
  if(!adapters.versions||!S.scenes.length) return null;
  const data=scriptSnapshot();
  const row=await adapters.versions.save({label:label||"", auto:!!auto, data, scene_count:data.scenes.length, pages:totalPages(S.scenes)});
  S.lastVersionAt=Date.now(); S.changedSinceVersion=false;
  return row;
}
let autoT;
function maybeAutoVersion(){
  if(!adapters.versions||!S.canWrite) return;
  clearTimeout(autoT);
  autoT=setTimeout(()=>{
    if(S.changedSinceVersion&&Date.now()-S.lastVersionAt>AUTO_EVERY) saveVersion("",true).catch(e=>console.warn(e));
  },4000);
}
function fmtWhen(iso){ const d=new Date(iso); return d.toLocaleDateString(undefined,{month:"short",day:"numeric"})+" · "+d.toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"}); }
async function openHistory(){
  const ov=$("#hov"); ov.hidden=false;
  $("#hPreview").hidden=true; $("#hList").hidden=false;
  $("#hList").innerHTML='<p class="hint">Loading versions…</p>';
  $("#hSaveRow").hidden=!S.canWrite||!adapters.versions;
  if(!adapters.versions){ $("#hList").innerHTML='<p class="hint">Version history needs the shared project connection.</p>'; return; }
  try{
    const list=await adapters.versions.list(150);
    const ids=[...new Set(list.map(v=>v.created_by).filter(Boolean))];
    let names={}; if(S.user&&ids.length){ try{ names=await S.user.profiles(ids); }catch(e){} }
    $("#hList").innerHTML=list.length?list.map(v=>`<div class="hrow">
      <div class="hmain"><b>${esc(v.label||(v.auto?"Autosave":"Saved version"))}</b><span>${esc(fmtWhen(v.created_at))} · ${esc((names[v.created_by]&&names[v.created_by].name)||"Someone")} · ${v.scene_count} scenes · ${esc(v.pages||"")} pages</span></div>
      <div class="hacts"><button class="btn" data-hprev="${v.id}">Preview</button>${S.canWrite?`<button class="btn" data-hrestore="${v.id}">Restore</button>`:""}</div></div>`).join("")
      :'<p class="hint">No versions yet. Backlot saves one automatically every 10 minutes while people are writing, and you can save one yourself any time above.</p>';
  }catch(e){ $("#hList").innerHTML='<p class="hint">Versions couldn\'t be loaded. Check your connection and try again.</p>'; }
}
async function previewVersion(id){
  const v=await adapters.versions.get(id); if(!v) return;
  const scenes=(v.data&&v.data.scenes)||[];
  $("#hList").hidden=true; $("#hPreview").hidden=false;
  $("#hPrevTitle").textContent=(v.label||(v.auto?"Autosave":"Saved version"))+" · "+fmtWhen(v.created_at);
  $("#hPrevBody").innerHTML=scenes.slice().sort((a,b)=>a.order-b.order).map((sc,k)=>`<section class="scene"><span class="snum l">${k+1}</span>${sc.blocks.map(b=>`<div class="blk t-${esc(b.t)}">${esc(b.x)}</div>`).join("")}</section>`).join("")||'<p class="hint">This version is empty.</p>';
  $("#hPrevRestore").dataset.hrestore=id; $("#hPrevRestore").hidden=!S.canWrite;
}
async function restoreVersion(id){
  const v=await adapters.versions.get(id); if(!v) return;
  if(!await confirmBox(`Restore the script to "${v.label||(v.auto?"Autosave":"Saved version")}" from ${fmtWhen(v.created_at)}? The current script is saved as a version first, so you can undo this.`, "Restore")) return;
  try{ await saveVersion("Before restore",false); }catch(e){ toast("Couldn't save the current script first, so nothing was changed."); return; }
  const target=(v.data&&v.data.scenes)||[];
  const keep=new Set(target.map(s=>s.id));
  S.scenes.filter(s=>!keep.has(s.id)).forEach(s=>deleteScene(s.id,true));
  target.forEach(t=>{
    const sc={id:t.id,order:t.order,blocks:t.blocks.map(b=>({t:b.t,x:b.x}))};
    if(S.map[t.id]){ Object.assign(S.map[t.id],sc); } else { S.scenes.push(sc); S.map[sc.id]=sc; }
    saveScene(t.id,true);
  });
  S.scenes.sort((a,b)=>a.order-b.order);
  $$("#scenes section.scene").forEach(sec=>{ if(S.map[sec.dataset.id]) fillSection(sec,S.map[sec.dataset.id]); });
  renderScript(); $("#hov").hidden=true; toast("Script restored.");
}

/* ---------- print-ready screenplay (PDF) ---------- */
const LINES_PER_PAGE=54;
const COL={scene:{ind:0,w:60},action:{ind:0,w:60},shot:{ind:0,w:60},character:{ind:22,w:38},paren:{ind:16,w:25},dialogue:{ind:10,w:35},transition:{ind:0,w:60,right:true},more:{ind:22,w:38}};
function wrap(text,w){
  const out=[]; String(text||"").split(/\n/).forEach(par=>{
    let line=""; par.split(/\s+/).filter(Boolean).forEach(word=>{
      while(word.length>w){ if(line){ out.push(line); line=""; } out.push(word.slice(0,w)); word=word.slice(w); }
      if(!line) line=word; else if((line+" "+word).length<=w) line+=" "+word; else { out.push(line); line=word; }
    });
    out.push(line);
  });
  return out.length?out:[""];
}
const UPPER=new Set(["scene","character","transition","shot"]);
function elementLines(b){ const x=UPPER.has(b.t)?String(b.x||"").toUpperCase():String(b.x||""); return wrap(x,COL[b.t].w).map(t=>({t:b.t,x:t})); }
function paginate(opts){
  const pages=[]; let cur=[]; let first=true;
  const room=()=>LINES_PER_PAGE-cur.length;
  const newPage=()=>{ pages.push(cur); cur=[]; };
  const blank=()=>{ if(cur.length) cur.push({t:"blank",x:""}); };
  S.scenes.forEach((sc,si)=>{
    const els=sc.blocks; let i=0;
    while(i<els.length){
      const b=els[i];
      if(b.t==="character"){
        // dialogue group: character + following parens/dialogue
        const grp=[b]; let j=i+1; while(j<els.length&&(els[j].t==="dialogue"||els[j].t==="paren")) grp.push(els[j++]);
        const charName=String(b.x||"").toUpperCase();
        let lines=[]; grp.forEach(g=>lines.push(...elementLines(g)));
        const need=(cur.length?1:0)+lines.length;
        if(need<=room()){ blank(); cur.push(...lines); }
        else if(room()-(cur.length?1:0)>=4&&lines.length>=4){
          blank(); const fit=room()-1; let k=fit;
          while(k>2&&lines[k-1].t!=="dialogue") k--;
          cur.push(...lines.slice(0,k)); cur.push({t:"more",x:"(MORE)"}); newPage();
          const cont=charName.replace(/\s*\(CONT'D\)\s*$/,"")+" (CONT'D)";
          cur.push({t:"character",x:cont},...lines.slice(k));
        } else { newPage(); cur.push(...lines); }
        i=j; continue;
      }
      let lines=elementLines(b);
      if(b.t==="scene"){
        lines=lines.map((l,n)=>n===0?{...l,num:si+1}:l);
        const next=els[i+1]?Math.min(2,elementLines(els[i+1]).length):0;
        if((cur.length?2:0)+lines.length+next>room()) newPage();
        if(cur.length){ cur.push({t:"blank",x:""}); cur.push({t:"blank",x:""}); }
        cur.push(...lines);
      } else if(b.t==="action"&&lines.length>=4&&(cur.length?1:0)+lines.length>room()&&room()-(cur.length?1:0)>=2){
        blank(); const fit=room(); cur.push(...lines.slice(0,fit)); newPage(); cur.push(...lines.slice(fit));
      } else {
        if((cur.length?1:0)+lines.length>room()) newPage();
        blank(); cur.push(...lines);
      }
      i++;
    }
  });
  if(cur.length) newPage();
  // never start a page with blank lines
  return pages.map(p=>{ while(p.length&&p[0].t==="blank") p.shift(); return p; });
}
function printHTML(opts){
  const pages=paginate(opts);
  const m=S.meta;
  const line=l=>{
    if(l.t==="blank") return '<div class="pl">&nbsp;</div>';
    const c=COL[l.t]||COL.action;
    const num=l.num&&opts.numbers?`<span class="pn l">${l.num}</span><span class="pn r">${l.num}</span>`:"";
    return `<div class="pl t-${l.t}" style="padding-left:${c.ind}ch;${c.right?"text-align:right;":""}">${num}${esc(l.x)||"&nbsp;"}</div>`;
  };
  let html="";
  if(opts.title){
    html+=`<div class="pp tp"><div class="tp-title">${esc((m.title||"Untitled").toUpperCase())}</div>
      <div class="tp-by">Written by</div><div class="tp-name">${esc(m.writer||"")}</div>
      <div class="tp-contact">${esc(m.contact||"").replace(/\n/g,"<br>")}</div>
      <div class="tp-draft">${esc(m.draft||"")}</div></div>`;
  }
  pages.forEach((p,n)=>{
    html+=`<div class="pp">${n>0?`<div class="pnum">${n+1}.</div>`:""}${opts.revision&&m.rev&&m.rev!=="White"?`<div class="prev">${esc(m.rev)} Rev. ${esc(m.revDate||"")}</div>`:""}<div class="pbody">${p.map(line).join("")}</div></div>`;
  });
  return {html, count:pages.length};
}
const PRINT_CSS=`
#olm-print{display:none}
@media print{
  @page{size:8.5in 11in;margin:0}
  html,body{background:#fff!important}
  body>*:not(#olm-print){display:none!important}
  #olm-print{display:block!important}
}
#olm-print .pp{position:relative;width:8.5in;height:11in;page-break-after:always;break-after:page;overflow:hidden;background:#fff;color:#000;font:12pt/1 "Courier Prime","Courier New",Courier,monospace}
#olm-print .pp:last-child{page-break-after:auto;break-after:auto}
#olm-print .pbody{position:absolute;top:1in;left:1.5in;width:6in}
#olm-print .pl{height:12pt;line-height:12pt;white-space:pre;position:relative}
#olm-print .t-scene{font-weight:700}
#olm-print .pn{position:absolute;top:0}
#olm-print .pn.l{left:-0.75in}
#olm-print .pn.r{right:-0.75in}
#olm-print .pnum{position:absolute;top:.5in;right:1in}
#olm-print .prev{position:absolute;top:.5in;left:1.5in;font-size:10pt}
#olm-print .tp-title{position:absolute;top:3.5in;left:0;right:0;text-align:center;text-decoration:underline}
#olm-print .tp-by{position:absolute;top:4.2in;left:0;right:0;text-align:center}
#olm-print .tp-name{position:absolute;top:4.6in;left:0;right:0;text-align:center}
#olm-print .tp-contact{position:absolute;bottom:1in;left:1.5in;line-height:12pt}
#olm-print .tp-draft{position:absolute;bottom:1in;right:1in}
`;
function openPrint(){
  $("#prTitle").value=S.meta.title||""; $("#prWriter").value=S.meta.writer||""; $("#prContact").value=S.meta.contact||""; $("#prDraft").value=S.meta.draft||"";
  const est=paginate({}).length; $("#prCount").textContent=S.scenes.length?`About ${est} page${est===1?"":"s"}.`:"The script is empty.";
  $("#pdfov").hidden=false;
}
function doPrint(){
  const m={title:$("#prTitle").value.trim(),writer:$("#prWriter").value.trim(),contact:$("#prContact").value.trim(),draft:$("#prDraft").value.trim()};
  const changed=Object.keys(m).some(k=>(S.meta[k]||"")!==m[k]);
  Object.assign(S.meta,m); if(changed&&S.canWrite) write("project/meta",r=>r.set({...S.meta}));
  const opts={title:$("#prTitlePage").checked,numbers:$("#prNumbers").checked,revision:$("#prRev").checked};
  let host=document.getElementById("olm-print");
  if(!host){ host=document.createElement("div"); host.id="olm-print"; document.body.appendChild(host); const st=document.createElement("style"); st.id="olm-print-css"; st.textContent=PRINT_CSS; document.head.appendChild(st); }
  const {html}=printHTML(opts); host.innerHTML=html;
  $("#pdfov").hidden=true;
  const oldTitle=document.title; document.title=(m.title||"Screenplay");
  setTimeout(()=>{ window.print(); document.title=oldTitle; },60);
}

/* extra dialogs */
root.insertAdjacentHTML("beforeend",`
<div class="ov" id="hov" hidden><div class="modal" role="dialog" aria-modal="true" aria-labelledby="hHead">
  <div class="mhead"><h2 id="hHead">Version history</h2><button class="x" data-close="hov" aria-label="Close">✕</button></div>
  <div class="hsave" id="hSaveRow"><input class="field" id="hLabel" placeholder="Name this version, e.g. Table read draft"><button class="btn primary" id="hSave">Save version</button></div>
  <div id="hList" class="hlist"></div>
  <div id="hPreview" hidden>
    <div class="hprevbar"><button class="btn" id="hBack">← All versions</button><b id="hPrevTitle"></b><button class="btn primary" id="hPrevRestore">Restore this version</button></div>
    <div class="page-wrap"><div class="page hpage" id="hPrevBody"></div></div>
  </div>
</div></div>
<div class="ov" id="pdfov" hidden><div class="modal sm" role="dialog" aria-modal="true" aria-labelledby="prHead">
  <div class="mhead"><h2 id="prHead">Print / Save as PDF</h2><button class="x" data-close="pdfov" aria-label="Close">✕</button></div>
  <div class="form one">
    <label>Title<input class="field" id="prTitle"></label>
    <label>Written by<input class="field" id="prWriter" placeholder="Your name"></label>
    <label>Contact (title page, bottom left)<textarea class="field" id="prContact" rows="2" placeholder="Email, phone, agent"></textarea></label>
    <label>Draft<input class="field" id="prDraft" placeholder="First draft, October 2026"></label>
    <label class="chk"><input type="checkbox" id="prTitlePage" checked> Include title page</label>
    <label class="chk"><input type="checkbox" id="prNumbers" checked> Scene numbers in both margins</label>
    <label class="chk"><input type="checkbox" id="prRev" checked> Revision color label in page header</label>
    <p class="hint" id="prCount"></p>
    <p class="hint">Your browser's print window opens. Choose <b>Save as PDF</b> as the destination, and set margins to <b>None</b> if it asks.</p>
  </div>
  <div class="mfoot" style="justify-content:flex-end"><button class="btn" data-close="pdfov">Cancel</button><button class="btn primary" id="prGo">Print / Save PDF</button></div>
</div></div>`);
$("#historyBtn").onclick=openHistory;
$("#pdfBtn").onclick=openPrint;
$("#prGo").onclick=doPrint;
$("#hBack").onclick=()=>{ $("#hPreview").hidden=true; $("#hList").hidden=false; };
$("#hSave").onclick=async()=>{
  const b=$("#hSave"); b.disabled=true;
  try{ await saveVersion($("#hLabel").value.trim(),false); $("#hLabel").value=""; toast("Version saved."); openHistory(); }
  catch(e){ toast("The version couldn't be saved. Try again."); }
  b.disabled=false;
};
root.addEventListener("click",e=>{
  const t=e.target.closest("[data-close],[data-hprev],[data-hrestore]"); if(!t) return;
  if(t.dataset.close) $("#"+t.dataset.close).hidden=true;
  else if(t.dataset.hprev) previewVersion(t.dataset.hprev);
  else if(t.dataset.hrestore) restoreVersion(t.dataset.hrestore);
});
root.addEventListener("keydown",e=>{ if(e.key==="Escape"){ ["hov","pdfov"].forEach(id=>{ const o=$("#"+id); if(o&&!o.hidden) o.hidden=true; }); } });

/* ---------- characters ---------- */
const ROLES=["Lead","Supporting","Featured","Day player","Background"];
const CASTING=["Not cast","Auditioning","Offered","Confirmed"];
const ckey = n => String(n||"").toUpperCase().replace(/[^\p{L}\p{N}]+/gu,"_").replace(/^_+|_+$/g,"")||"X";
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
function charStats(names){
  const st={}; const get=n=>st[n]||(st[n]={scenes:[],speaks:{},lines:0,words:0});
  const res=names.map(n=>[n,new RegExp("(^|[^\\p{L}\\p{N}])"+reEsc(n)+"(?=$|[^\\p{L}\\p{N}])","iu")]);
  S.scenes.forEach(sc=>{
    let cur=null;
    sc.blocks.forEach(b=>{
      if(b.t==="character"){ cur=cleanChar(b.x)||null; if(!cur) return; const s=get(cur); if(!s.scenes.includes(sc.id)) s.scenes.push(sc.id); s.speaks[sc.id]=(s.speaks[sc.id]||0)+1; s.lines++; }
      else if(b.t==="dialogue"&&cur){ get(cur).words+=(b.x.match(/\S+/g)||[]).length; }
      else if(b.t!=="paren") cur=null;
      if(b.t==="action"&&b.x) res.forEach(([n,re])=>{ if(re.test(b.x)){ const s=get(n); if(!s.scenes.includes(sc.id)) s.scenes.push(sc.id); } });
    });
  });
  Object.values(st).forEach(s=>s.scenes.sort((a,b)=>sceneNo(a)-sceneNo(b)));
  return st;
}
function allChars(){
  const nums=castNumbers();
  const names=[...new Set([...Object.keys(nums),...Object.values(S.chars).map(c=>c&&c.name).filter(Boolean)])];
  const st=charStats(names);
  return names.map(n=>({name:n,key:ckey(n),num:nums[n]||null,st:st[n]||{scenes:[],speaks:{},lines:0,words:0},p:S.chars[ckey(n)]||null}))
    .sort((a,b)=>(a.num||9999)-(b.num||9999)||a.name.localeCompare(b.name));
}
const chFocused=()=>{ const w=$("#chWrap"); return w.contains(document.activeElement)&&document.activeElement!==document.body; };
function onChars(snap){
  const m={}; snap.docs.forEach(d=>{ m[d.id]=clone(d.data()); }); S.chars=m;
  if(S.view==="chars"){ if(chFocused()) S.chStale=true; else renderChars(); }
}
function patchChar(c, fields){
  if(!S.canWrite) return;
  const stamp={by:S.myId||null,at:Date.now()};
  const ex=S.chars[c.key];
  if(ex){ Object.assign(ex,clone(fields),stamp); write("characters/"+c.key, r=>r.update({...fields,...stamp})); }
  else { const d={name:c.name,...fields,...stamp}; S.chars[c.key]=d; write("characters/"+c.key, r=>r.set(d)); }
}
function curChar(list){ list=list||allChars(); return list.find(c=>c.key===S.curChar)||list[0]||null; }
function renderCharList(list){
  const q=($("#chSearch").value||"").trim().toUpperCase();
  const shown=list.filter(c=>!q||c.name.includes(q)||((S.actors[c.name]||"").toUpperCase().includes(q)));
  $("#chList").innerHTML=shown.length?shown.map(c=>{
    const p=c.p||{}; const sub=[p.role, c.st.scenes.length?`${c.st.scenes.length} sc`:"", c.st.lines?`${c.st.lines} line${c.st.lines===1?"":"s"}`:""].filter(Boolean).join(" · ")||"No lines yet";
    return `<button class="d chd ${c.key===S.curChar?"cur":""}" data-ch="${esc(c.key)}">${p.photo?`<img src="${esc(p.photo)}" alt="">`:`<span class="chav">${esc(c.name.slice(0,1))}</span>`}<span><span class="chn">${c.num?c.num+". ":""}${esc(c.name)}</span><small>${esc(sub)}${S.actors[c.name]?" · "+esc(S.actors[c.name]):""}</small></span></button>`;
  }).join(""):`<p class="hint" style="margin:6px">${list.length?"No match.":"No characters yet. Anyone who speaks in the script shows up here."}</p>`;
}
function renderChars(){
  S.chStale=false;
  const list=allChars(); const c=curChar(list); S.curChar=c&&c.key;
  renderCharList(list);
  $("#chAdd").hidden=!S.canWrite;
  const w=$("#chWrap");
  if(!c){ w.innerHTML=`<div class="sheet"><div class="empty"><h2>Meet your characters</h2><p style="margin:0">Every character who speaks in the script gets a sheet here automatically. You can also add characters who don't speak.</p><button class="btn primary" data-goview="script">Go to Script</button></div></div>`; return; }
  const p=c.p||{}; const dis=S.canWrite?"":"disabled";
  const rels=Array.isArray(p.rels)?p.rels:[];
  const v=k=>esc(p[k]||"");
  const ta=(k,label,ph,rows=3)=>`<label class="${rows>2?"full":""}">${label}<textarea class="field" data-cf="${k}" rows="${rows}" placeholder="${esc(ph)}" ${dis}>${v(k)}</textarea></label>`;
  const inp=(k,label,ph,type="text")=>`<label>${label}<input class="field" type="${type}" data-cf="${k}" value="${v(k)}" placeholder="${esc(ph)}" ${dis}></label>`;
  const sel=(k,label,opts)=>`<label>${label}<select class="field" data-cf="${k}" ${dis}><option value="">—</option>${opts.map(o=>`<option ${p[k]===o?"selected":""}>${esc(o)}</option>`).join("")}</select></label>`;
  const others=list.filter(x=>x.key!==c.key).map(x=>x.name);
  w.innerHTML=`<div class="sheet-tools"><button class="btn" id="chPrint">Print / PDF</button><button class="btn" id="chPrintAll">Print cast list</button>${S.canWrite&&c.p?`<button class="btn danger" id="chDel">Clear sheet</button>`:""}</div>
  <div class="sheet ch">
    <div class="ch-head">
      <button class="ch-photo" id="chPhoto" ${dis} aria-label="${p.photo?"Change photo":"Add photo"}">${p.photo?`<img src="${esc(p.photo)}" alt="${esc(c.name)}">`:`<span>+ Photo or<br>reference image</span>`}</button>
      <div class="ch-id">
        <span class="eyebrow">${c.num?`Cast #${c.num}`:"Not speaking in the script yet"}</span>
        <div class="cs-title">${esc(c.name)}</div>
        <div class="chips">${c.st.scenes.length?`<span class="chip">${c.st.scenes.length} scene${c.st.scenes.length===1?"":"s"}</span>`:""}${c.st.lines?`<span class="chip dim">${c.st.lines} speech${c.st.lines===1?"":"es"}</span><span class="chip dim">${c.st.words.toLocaleString()} words</span>`:""}${c.st.scenes[0]?`<span class="chip dim">First seen: sc. ${sceneNo(c.st.scenes[0])}</span>`:""}${S.actors[c.name]?`<span class="chip">Played by ${esc(S.actors[c.name])}</span>`:""}</div>
        <div class="chf row3">${sel("role","Role",ROLES)}${inp("age","Age","30s")}${inp("pronouns","Pronouns","she/her")}</div>
      </div>
    </div>
    <div class="chf one"><label>One-line description<input class="field" data-cf="logline" value="${v("logline")}" placeholder="A waitress who has seen everything twice" ${dis}></label></div>
    <h3>Story</h3>
    <div class="chf">${ta("backstory","Backstory","Where they come from and what shaped them",4)}${ta("want","Wants","What they're chasing",2)}${ta("need","Needs","What they actually need",2)}${ta("arc","Arc","How they change from start to end",2)}${ta("voice","Voice","How they talk: rhythm, slang, catchphrases",2)}</div>
    <h3>Relationships ${S.canWrite?`<button class="btn" id="relAdd">+ Add relationship</button>`:""}</h3>
    <datalist id="chNames">${others.map(n=>`<option value="${esc(n)}">`).join("")}</datalist>
    <div class="tw"><table class="t"><thead><tr><th>Character</th><th>Relationship</th><th></th></tr></thead><tbody>
      ${rels.map((r,k)=>`<tr><td><input list="chNames" data-rel="${k}" data-k="who" value="${esc(r.who||"")}" placeholder="Name" ${dis}></td><td><input data-rel="${k}" data-k="what" value="${esc(r.what||"")}" placeholder="Older sister, rival, ex…" ${dis}></td><td>${S.canWrite?`<button class="x" data-rmrel="${k}" aria-label="Remove relationship">✕</button>`:""}</td></tr>`).join("")||`<tr><td colspan="3" class="muted">No relationships yet.</td></tr>`}
    </tbody></table></div>
    <h3>Look</h3>
    <div class="chf">${ta("wardrobe","Wardrobe","Costume pieces, changes by scene",2)}${ta("hmu","Hair & makeup","Hair, makeup, special FX, continuity",2)}${ta("props","Props","What they carry",2)}${ta("look","Physical notes","Height, build, scars, tattoos",2)}</div>
    ${voiceFields(c,dis)}
    <h3>Casting</h3>
    <div class="chf">
      <label>Played by<input class="field" data-cactor value="${esc(S.actors[c.name]||"")}" placeholder="Actor's name" ${dis}></label>
      ${sel("casting","Status",CASTING)}
      ${inp("phone","Phone","(555) 555-0100","tel")}${inp("email","Email","actor@email.com","email")}
      ${inp("agent","Agent / manager","Name and contact")}${inp("sizes","Sizes","Shirt, pants, shoes")}
    </div>
    <p class="hint" style="margin:6px 0 0">The actor's name also fills in on every call sheet that has this character.</p>
    <h3>Scenes</h3>
    <div class="tw"><table class="t"><thead><tr><th>Sc.</th><th>Heading</th><th>D/N</th><th>Speeches</th><th>Pages</th></tr></thead><tbody>
      ${c.st.scenes.map(id=>{ const sc=S.map[id]; if(!sc) return ""; return `<tr><td><b>${sceneNo(id)}</b></td><td class="mono"><button class="linkbtn" data-go="${id}">${esc(heading(sc)||"Untitled scene")}</button></td><td>${esc(dayNight(heading(sc)))}</td><td>${c.st.speaks[id]||"—"}</td><td>${eighthsStr(eighths(sc))}</td></tr>`; }).join("")||`<tr><td colspan="5" class="muted">Not in any scene yet. Scenes appear here when the character speaks or is named in the action.</td></tr>`}
    </tbody></table></div>
    <h3>Notes</h3>
    <div class="chf one">${ta("notes","Notes","Anything else the team should know",3)}</div>
  </div>`;
}
async function shrinkImage(file, max=900){
  const url=await new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file); });
  const im=await new Promise((res,rej)=>{ const i=new Image(); i.onload=()=>res(i); i.onerror=rej; i.src=url; });
  const s=Math.min(1,max/Math.max(im.width,im.height)); const c=document.createElement("canvas");
  c.width=Math.round(im.width*s); c.height=Math.round(im.height*s); c.getContext("2d").drawImage(im,0,0,c.width,c.height);
  return await new Promise(r=>c.toBlob(r,"image/jpeg",0.85));
}
$("#chList").addEventListener("click",e=>{ const b=e.target.closest("[data-ch]"); if(!b) return; S.curChar=b.dataset.ch; renderChars(); $("#chWrap").scrollIntoView({block:"nearest"}); });
$("#chSearch").addEventListener("input",()=>renderCharList(allChars()));
$("#chAdd").addEventListener("submit",e=>{
  e.preventDefault(); const name=cleanChar($("#chNew").value); if(!name) return;
  const c={name,key:ckey(name)}; if(!S.chars[c.key]&&!castNumbers()[name]) patchChar(c,{});
  S.curChar=c.key; $("#chNew").value=""; renderChars();
});
$("#chWrap").addEventListener("change",e=>{
  const el=e.target, d=el.dataset; const c=curChar(); if(!c||!S.canWrite) return;
  if(d.cf){ patchChar(c,{[d.cf]:el.value.trim()}); if(d.cf==="role") renderCharList(allChars()); return; }
  if(el.hasAttribute("data-cactor")){ S.actors[c.name]=el.value.trim(); write("project/cast",r=>r.set({actors:{...S.actors}})); renderCharList(allChars()); return; }
  if(d.rel!=null){ const rels=((c.p&&c.p.rels)||[]).map(r=>({...r})); if(!rels[+d.rel]) return; rels[+d.rel][d.k]=d.k==="who"?cleanChar(el.value):el.value.trim(); patchChar(c,{rels}); }
});
$("#chWrap").addEventListener("focusout",()=>setTimeout(()=>{ if(S.chStale&&!chFocused()) renderChars(); },0));
$("#chWrap").addEventListener("click",e=>{
  const t=e.target.closest("button"); if(!t) return; const c=curChar(); if(!c) return;
  if(t.id==="chPhoto"){ if(S.canWrite) $("#chFile").click(); }
  else if(t.id==="relAdd"){ patchChar(c,{rels:((c.p&&c.p.rels)||[]).concat([{who:"",what:""}])}); renderChars(); }
  else if(t.dataset.rmrel!=null){ const rels=((c.p&&c.p.rels)||[]).slice(); rels.splice(+t.dataset.rmrel,1); patchChar(c,{rels}); renderChars(); }
  else if(t.id==="chDel"){ confirmBox(`Clear ${c.name}'s character sheet? ${c.num?"They stay in the list while they have lines in the script.":"They'll be removed from the list."}`,"Clear").then(ok=>{ if(!ok) return; delete S.chars[c.key]; write("characters/"+c.key,r=>r.delete()); renderChars(); }); }
  else if(t.id==="chHear") hearChar(c.name);
  else if(t.id==="chPrint") printChars([c]);
  else if(t.id==="chPrintAll") printCastList();
});
$("#chFile").onchange=async e=>{
  const f=e.target.files[0]; e.target.value=""; const c=curChar(); if(!f||!c) return;
  const b=$("#chPhoto"); if(b){ b.disabled=true; b.classList.add("busy"); }
  try{ const blob=await shrinkImage(f); const url=await uploadFrame(blob); patchChar(c,{photo:url}); toast("Photo saved."); }
  catch(err){ console.warn(err); toast("That photo couldn't be uploaded. Try a JPG or PNG."); }
  renderChars();
};

/* character print */
const CHAR_PRINT_CSS=`
#olm-print .cp{color:#000;background:#fff;font:11pt/1.45 "IBM Plex Sans",Arial,sans-serif;page-break-after:always;break-after:page}
#olm-print .cp:last-child{page-break-after:auto;break-after:auto}
#olm-print .cp-head{display:flex;gap:18px;align-items:flex-start;border-bottom:2px solid #000;padding-bottom:12px;margin-bottom:12px}
#olm-print .cp-head img{width:1.6in;height:2in;object-fit:cover;border:1px solid #999}
#olm-print .cp-proj{font-size:9pt;letter-spacing:.08em;text-transform:uppercase;color:#555}
#olm-print .cp h1{font:700 26pt/1.1 "Courier Prime","Courier New",monospace;margin:4px 0 6px}
#olm-print .cp h2{font-size:10pt;letter-spacing:.08em;text-transform:uppercase;margin:14px 0 4px;border-bottom:1px solid #999;padding-bottom:2px;break-after:avoid}
#olm-print .cp dl{display:grid;grid-template-columns:1.4in 1fr;gap:3px 12px;margin:0}
#olm-print .cp dt{font-weight:600;color:#333}
#olm-print .cp dd{margin:0;white-space:pre-wrap}
#olm-print .cp table{width:100%;border-collapse:collapse;font-size:10pt}
#olm-print .cp th,#olm-print .cp td{text-align:left;border-bottom:1px solid #ccc;padding:3px 6px;vertical-align:top}
#olm-print .cp th{font-size:8.5pt;text-transform:uppercase;letter-spacing:.06em}
`;
function ensurePrintHost(){
  let host=document.getElementById("olm-print");
  if(!host){ host=document.createElement("div"); host.id="olm-print"; document.body.appendChild(host); const st=document.createElement("style"); st.id="olm-print-css"; st.textContent=PRINT_CSS; document.head.appendChild(st); }
  if(!document.getElementById("olm-print-chars")){ const st=document.createElement("style"); st.id="olm-print-chars"; st.textContent=CHAR_PRINT_CSS; document.head.appendChild(st); }
  return host;
}
async function printPages(html, title){
  const host=ensurePrintHost(); host.innerHTML=html;
  const pg=document.createElement("style"); pg.textContent="@media print{@page{margin:.6in}}"; document.head.appendChild(pg);
  await Promise.all([...host.querySelectorAll("img")].map(im=>im.complete?null:new Promise(r=>{ im.onload=im.onerror=r; setTimeout(r,4000); })));
  const old=document.title; document.title=title;
  setTimeout(()=>{ window.print(); document.title=old; pg.remove(); },60);
}
function charPrintHTML(c){
  const p=c.p||{}; const dl=rows=>{ const r=rows.filter(([,x])=>x&&String(x).trim()); return r.length?`<dl>${r.map(([k,x])=>`<dt>${esc(k)}</dt><dd>${esc(x)}</dd>`).join("")}</dl>`:""; };
  const sec=(t,body)=>body?`<h2>${esc(t)}</h2>${body}`:"";
  const rels=(p.rels||[]).filter(r=>r.who||r.what);
  const scenes=c.st.scenes.map(id=>S.map[id]).filter(Boolean);
  return `<div class="cp"><div class="cp-head">${p.photo?`<img src="${esc(p.photo)}" alt="">`:""}<div><div class="cp-proj">${esc(S.meta.title||"Untitled project")} · Character sheet</div><h1>${esc(c.name)}</h1>
    <div>${esc([p.role,p.age,p.pronouns,c.num?"Cast #"+c.num:""].filter(Boolean).join(" · "))}</div>${p.logline?`<div style="margin-top:6px"><i>${esc(p.logline)}</i></div>`:""}</div></div>
    ${sec("Story",dl([["Backstory",p.backstory],["Wants",p.want],["Needs",p.need],["Arc",p.arc],["Voice",p.voice]]))}
    ${sec("Relationships",rels.length?dl(rels.map(r=>[r.who||"—",r.what||""])):"")}
    ${sec("Look",dl([["Wardrobe",p.wardrobe],["Hair & makeup",p.hmu],["Props",p.props],["Physical notes",p.look]]))}
    ${sec("Casting",dl([["Played by",S.actors[c.name]],["Status",p.casting],["Phone",p.phone],["Email",p.email],["Agent / manager",p.agent],["Sizes",p.sizes]]))}
    ${sec("Scenes",scenes.length?`<table><thead><tr><th>Sc.</th><th>Heading</th><th>Speeches</th><th>Pages</th></tr></thead><tbody>${scenes.map(sc=>`<tr><td>${sceneNo(sc.id)}</td><td>${esc(heading(sc)||"Untitled scene")}</td><td>${c.st.speaks[sc.id]||"—"}</td><td>${eighthsStr(eighths(sc))}</td></tr>`).join("")}</tbody></table>`:"")}
    ${sec("Notes",p.notes?`<div style="white-space:pre-wrap">${esc(p.notes)}</div>`:"")}
  </div>`;
}
function printChars(list){ printPages(list.map(charPrintHTML).join(""), (list.length===1?list[0].name:"Characters")+" - "+(S.meta.title||"Backlot")); }
function printCastList(){
  const list=allChars();
  const html=`<div class="cp"><div class="cp-head"><div><div class="cp-proj">${esc(S.meta.title||"Untitled project")}</div><h1>Cast list</h1><div>${list.length} characters</div></div></div>
   <table><thead><tr><th>#</th><th>Character</th><th>Role</th><th>Played by</th><th>Status</th><th>Phone</th><th>Email</th><th>Scenes</th></tr></thead><tbody>
   ${list.map(c=>{ const p=c.p||{}; return `<tr><td>${c.num||""}</td><td><b>${esc(c.name)}</b></td><td>${esc(p.role||"")}</td><td>${esc(S.actors[c.name]||"")}</td><td>${esc(p.casting||"")}</td><td>${esc(p.phone||"")}</td><td>${esc(p.email||"")}</td><td>${c.st.scenes.length||""}</td></tr>`; }).join("")}
   </tbody></table></div>`;
  printPages(html, "Cast list - "+(S.meta.title||"Backlot"));
}

/* clear the whole script (saved to History first) */
$("#clearScript").onclick=async()=>{
  if(!S.canWrite||!S.scenes.length) { toast("The script is already empty."); return; }
  if(!await confirmBox(`Delete all ${S.scenes.length} scenes? A copy is saved in History first, so you can restore it. Storyboard shots stay under "Unassigned".`,"Clear script")) return;
  if(adapters.versions){ try{ await saveVersion("Before clearing the script",false); }catch(e){ toast("Couldn't save a copy to History first, so nothing was deleted."); return; } }
  S.scenes.slice().forEach(s=>deleteScene(s.id,true));
  toast("Script cleared. Use History to bring it back.");
};

/* ---------- table read (uses the free voices built into the device) ---------- */
const TTS = (typeof window!=="undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance!=="undefined") ? window.speechSynthesis : null;
const R = { on:false, playing:false, queue:[], i:0, voices:[], tok:0, utt:null };
function loadVoices(){
  if(!TTS||dead) return;
  const all=TTS.getVoices(); const en=all.filter(v=>/^en/i.test(v.lang));
  R.voices=(en.length?en:all).slice().sort((a,b)=>a.name.localeCompare(b.name));
  if(R.on) fillNarr();
  if(S.view==="chars"&&!chFocused()) renderChars();
}
if(TTS){ loadVoices(); if(TTS.addEventListener) TTS.addEventListener("voiceschanged",loadVoices); else TTS.onvoiceschanged=loadVoices; }
const hashStr = s => { let h=2166136261; for(const ch of String(s)){ h^=ch.charCodeAt(0); h=Math.imul(h,16777619); } return h>>>0; };
const rdPref = (k,d) => { try{ const v=localStorage.getItem("backlot.read."+k); return v==null?d:v; }catch(e){ return d; } };
const rdSet = (k,v) => { try{ localStorage.setItem("backlot.read."+k,String(v)); }catch(e){} };
function narrVoice(){ const n=rdPref("narr",""); return R.voices.find(v=>v.voiceURI===n) || R.voices.find(v=>v.default) || R.voices[0] || null; }
function savedVoice(p){ return p && p.tts_voice ? R.voices.find(v=>v.voiceURI===p.tts_voice||v.name===p.tts_voice) || null : null; }
function charVoice(name){
  const p=S.chars[ckey(name)]||{}; const pick=savedVoice(p); const h=hashStr(name);
  const narr=narrVoice(); const pool=R.voices.filter(v=>v!==narr);
  const voice=pick || (pool.length?pool[h%pool.length]:narr);
  const auto=pool.length>=6?1:0.8+(h%9)*0.05;
  return { voice, pitch:p.tts_pitch?+p.tts_pitch:(pick?1:auto), rate:p.tts_rate?+p.tts_rate:1 };
}
const sayHeading = x => x.replace(/^\s*#?\d+[A-Z]?\s+/,"").replace(/^(INT\.?\s*\/\s*EXT|I\/E)\.?\s*/i,"Interior, exterior. ").replace(/^INT\.?\s+/i,"Interior. ").replace(/^EXT\.?\s+/i,"Exterior. ").replace(/\s+[-–—]\s+/g,". ").toLowerCase();
function chunks(t){
  const out=[]; let cur="";
  (t.match(/[^.!?…]+[.!?…]+["'”’)]*\s*|[^.!?…]+$/g)||[t]).forEach(s=>{ if((cur+s).length>180&&cur){ out.push(cur.trim()); cur=""; } cur+=s; });
  if(cur.trim()) out.push(cur.trim());
  return out.flatMap(c=>c.length<=220?[c]:c.match(/.{1,200}(\s|$)/g).map(x=>x.trim())).filter(Boolean);
}
function buildQueue(){
  const q=[]; const act=rdPref("action","1")==="1", head=rdPref("head","1")==="1";
  S.scenes.forEach(sc=>{ let who=null;
    sc.blocks.forEach((b,i)=>{
      const x=(b.x||"").trim();
      if(b.t==="character"){ who=cleanChar(x)||null; return; }
      if(b.t==="paren") return;
      if(b.t==="dialogue"){ if(x) q.push({sc:sc.id,i,who,text:x}); return; }
      who=null; if(!x) return;
      if(b.t==="scene"){ if(head) q.push({sc:sc.id,i,who:null,text:sayHeading(x)}); }
      else if(act) q.push({sc:sc.id,i,who:null,text:b.t==="transition"?x.toLowerCase():x});
    });
  });
  return q;
}
function markReading(it){
  $$("#scenes .blk.reading").forEach(b=>b.classList.remove("reading"));
  if(!it){ $("#rdNow").textContent=""; return; }
  const el=$(`#scenes section.scene[data-id="${it.sc}"] .blk[data-i="${it.i}"]`);
  if(el){ el.classList.add("reading"); el.scrollIntoView({block:"center",behavior:"smooth"}); }
  $("#rdNow").innerHTML=`<b>Sc. ${sceneNo(it.sc)}</b> · ${esc(it.who||"Narrator")} <span>${R.i+1} / ${R.queue.length}</span>`;
}
function speakItem(){
  if(!R.playing) return;
  const it=R.queue[R.i]; if(!it){ stopRead(); toast("That's the end of the script."); return; }
  markReading(it);
  const tok=++R.tok, vs=it.who?charVoice(it.who):{voice:narrVoice(),pitch:1,rate:1}, base=+rdPref("rate","1");
  const parts=chunks(it.text); let k=0;
  const next=()=>{
    if(tok!==R.tok||!R.playing) return;
    if(k>=parts.length){ R.i++; setTimeout(()=>{ if(tok===R.tok) speakItem(); },it.who?220:140); return; }
    const u=new SpeechSynthesisUtterance(parts[k++]);
    if(vs.voice){ u.voice=vs.voice; u.lang=vs.voice.lang; }
    u.pitch=Math.max(0.1,Math.min(2,vs.pitch)); u.rate=Math.max(0.5,Math.min(2,vs.rate*base));
    u.onend=next; u.onerror=e=>{ if(e&&(e.error==="interrupted"||e.error==="canceled")) return; next(); };
    R.utt=u; TTS.speak(u);
  };
  next();
}
function fillNarr(){
  const cur=narrVoice();
  $("#rdNarr").innerHTML=R.voices.length?R.voices.map(v=>`<option value="${esc(v.voiceURI)}" ${cur===v?"selected":""}>Narrator: ${esc(v.name)}</option>`).join(""):`<option>Default voice</option>`;
  $("#rdAction").checked=rdPref("action","1")==="1"; $("#rdHead").checked=rdPref("head","1")==="1"; $("#rdRate").value=rdPref("rate","1");
}
function setPlayBtn(){ $("#rdPlay").textContent=R.playing?"❚❚ Pause":"▶ Play"; }
function playRead(){ if(!TTS) return; R.playing=true; R.tok++; TTS.cancel(); setPlayBtn(); setTimeout(speakItem,60); }
function pauseRead(){ R.playing=false; R.tok++; if(TTS) TTS.cancel(); setPlayBtn(); }
function stopRead(){ R.on=false; R.playing=false; R.tok++; if(TTS) TTS.cancel(); setPlayBtn(); $("#reader").hidden=true; $(".backlot")&&$(".backlot").classList.remove("reading-on"); markReading(null); }
function stepRead(d){ R.i=Math.max(0,Math.min(R.queue.length-1,R.i+d)); if(R.playing) playRead(); else markReading(R.queue[R.i]); }
function rebuildKeep(){ const cur=R.queue[R.i]; R.queue=buildQueue(); if(!R.queue.length){ stopRead(); return; }
  let j=0; if(cur){ const sk=sceneNo(cur.sc); j=R.queue.findIndex(q=>sceneNo(q.sc)>sk||(q.sc===cur.sc&&q.i>=cur.i)); if(j<0) j=R.queue.length-1; }
  R.i=j; if(R.playing) playRead(); else markReading(R.queue[R.i]); }
function startRead(fromScene){
  if(!TTS){ toast("This browser can't read aloud. Try Chrome, Edge or Safari."); return; }
  if(S.view!=="script") setView("script");
  R.queue=buildQueue(); if(!R.queue.length){ toast("There's nothing to read yet. Write a scene first."); return; }
  if(!R.voices.length) loadVoices();
  const sid=fromScene||S.focus.scene; const j=sid?R.queue.findIndex(q=>q.sc===sid):-1; R.i=j<0?0:j;
  if(document.activeElement&&document.activeElement.blur) document.activeElement.blur();
  R.on=true; $("#reader").hidden=false; fillNarr(); playRead();
}
function sampleLine(name){
  for(const sc of S.scenes){ let who=null; for(const b of sc.blocks){ if(b.t==="character") who=cleanChar(b.x||""); else if(b.t==="dialogue"&&who===name&&(b.x||"").trim()) return b.x.trim().slice(0,200); else if(b.t!=="paren") who=null; } }
  return `Hi, I'm ${name.toLowerCase().replace(/\b\w/g,m=>m.toUpperCase())}.`;
}
function hearChar(name){
  if(!TTS){ toast("This browser can't read aloud. Try Chrome, Edge or Safari."); return; }
  pauseRead(); const vs=charVoice(name); const u=new SpeechSynthesisUtterance(sampleLine(name));
  if(vs.voice){ u.voice=vs.voice; u.lang=vs.voice.lang; } u.pitch=vs.pitch; u.rate=vs.rate*(+rdPref("rate","1")); R.utt=u; TTS.cancel(); TTS.speak(u);
}
function voiceFields(c,dis){
  const p=c.p||{};
  if(!TTS) return `<h3>Table-read voice</h3><p class="hint" style="margin:0">This browser can't read aloud. Open Backlot in Chrome, Edge or Safari to hear the script.</p>`;
  const saved=p.tts_voice, have=savedVoice(p);
  return `<h3>Table-read voice <button class="btn" id="chHear" type="button">▶ Hear a line</button></h3>
    <div class="chf row3 rdv">
      <label>Voice<select class="field" data-cf="tts_voice" ${dis}><option value="">Automatic</option>${saved&&!have?`<option value="${esc(saved)}" selected>Saved voice isn't on this device (automatic)</option>`:""}${R.voices.map(v=>`<option value="${esc(v.voiceURI)}" ${have===v?"selected":""}>${esc(v.name)} · ${esc(v.lang)}</option>`).join("")}</select></label>
      <label>Pitch <small>${esc(p.tts_pitch||"auto")}</small><input type="range" data-cf="tts_pitch" min="0.5" max="1.5" step="0.05" value="${esc(p.tts_pitch||"1")}" ${dis}></label>
      <label>Speed <small>${esc(p.tts_rate||"1")}×</small><input type="range" data-cf="tts_rate" min="0.7" max="1.4" step="0.05" value="${esc(p.tts_rate||"1")}" ${dis}></label>
    </div>
    <p class="hint" style="margin:6px 0 0">Used when you press Table read in the Script tab. Voices come from each person's device, so they can sound a little different on another computer or phone.</p>`;
}
$("#readBtn").onclick=()=>startRead();
$("#rdPlay").onclick=()=>R.playing?pauseRead():playRead();
$("#rdPrev").onclick=()=>stepRead(-1);
$("#rdNext").onclick=()=>stepRead(1);
$("#rdClose").onclick=()=>stopRead();
$("#rdRate").oninput=e=>{ rdSet("rate",e.target.value); };
$("#rdRate").onchange=()=>{ if(R.playing) playRead(); };
$("#rdNarr").onchange=e=>{ rdSet("narr",e.target.value); if(R.playing) playRead(); };
$("#rdAction").onchange=e=>{ rdSet("action",e.target.checked?"1":"0"); rebuildKeep(); };
$("#rdHead").onchange=e=>{ rdSet("head",e.target.checked?"1":"0"); rebuildKeep(); };
$("#scenes").addEventListener("dblclick",e=>{ if(!R.on) return; const el=e.target.closest(".blk"); const sec=e.target.closest("section.scene"); if(!el||!sec) return;
  const j=R.queue.findIndex(q=>q.sc===sec.dataset.id&&q.i>=+el.dataset.i); if(j>=0){ R.i=j; playRead(); } });
document.addEventListener("keydown",e=>{ if(!dead&&R.on&&e.key==="Escape") stopRead(); });

/* ---------- boot ---------- */
function renderAll(){ renderScript(); renderTypes(); renderRev(); }
async function boot(){
  try{ const v=localStorage.getItem("backlot.view"); if(v&&["script","chars","board","calls"].includes(v)) setView(v); }catch(e){}
  renderAll(); setStatus();
  const {db,user,room}=wrapped; const dl=downloads;
  S.db=db; S.user=user; S.room=room; S.dl=dl;
  if(!db){
    S.offline=true; S.loaded=true; renderScript(); setStatus();
    const b=$("#banner"); b.hidden=false; b.textContent="Couldn't reach the shared project. Check your connection and reload.";
    return;
  }
  if(user){ try{ S.myId=await user.id(); const c=await user.can("data.write"); S.canWrite=c!==false; S.canKnown=c!==null; }catch(e){} }
  applyReadOnly();
  const err=e=>{ console.warn(e); if(e&&e.code==="revoked"){ S.offline=true; setStatus(); } };
  db.collection("scenes").orderBy("order").onSnapshot(onScenes,err);
  db.collection("panels").onSnapshot(onPanels,err);
  db.collection("callsheets").onSnapshot(onSheets,err);
  db.collection("characters").onSnapshot(onChars,err);
  db.doc("project/meta").onSnapshot(s=>{ if(document.activeElement===$("#ptitle")) return; S.meta=s.exists?clone(s.data()):{}; $("#ptitle").value=S.meta.title||""; renderRev(); },err);
  db.doc("project/cast").onSnapshot(s=>{ S.actors=s.exists?clone(s.data().actors)||{}:{}; if(S.view==="calls"&&!sheetFocused()) renderSheet(); if(S.view==="chars"&&!chFocused()) renderChars(); },err);
  setStatus();
  if(adapters.versions){ adapters.versions.list(1).then(v=>{ S.lastVersionAt=v[0]?new Date(v[0].created_at).getTime():0; }).catch(()=>{}); }
  if(room){
    unsubs.push(room.onPeers(ch=>{ S.peers=ch.peers.slice(); renderPeople(); }));
    announce();
  }
}
boot();
return ()=>{ dead=true; try{ R.tok++; R.playing=false; if(TTS) TTS.cancel(); }catch(e){} [...S.dirty].forEach(id=>{ clearTimeout(S.timers[id]); flushScene(id); }); unsubs.forEach(u=>{ try{u&&u()}catch(e){} }); };
}
