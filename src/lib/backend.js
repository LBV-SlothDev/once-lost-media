/*
 * Everything the site saves goes through this file.
 * With VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY set, it uses Supabase
 * (database, logins, file storage, live updates). Without them the site runs
 * in demo mode and keeps data in this browser only.
 */
import { createDocStore, colorFor, avatarFor } from "../backlot/docstore.js";

const ENV = import.meta.env || {};
const URL_ = ENV.VITE_SUPABASE_URL || "";
const KEY = ENV.VITE_SUPABASE_ANON_KEY || "";
export const DEMO = !URL_ || !KEY || URL_.includes("YOUR-PROJECT");
/* Cloudflare Turnstile site key (public). When set, sign-in and sign-up ask for the human check and new accounts are allowed. */
export const CAPTCHA_KEY = DEMO ? "" : (ENV.VITE_TURNSTILE_SITE_KEY || "");
export const SIGNUPS = !!CAPTCHA_KEY;
const withCaptcha = (o, token) => (token ? { ...o, captchaToken: token } : o);

/* ---------------- shared helpers ---------------- */
export const slugify = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "untitled";
const safeName = (n) => String(n || "file").replace(/[^\w.\-]+/g, "_").slice(-80);
const stamp = () => new Date().toISOString();
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));

function friendly(error) {
  if (!error) return null;
  const e = new Error(error.message || "Something went wrong");
  e.code = error.code;
  if (error.code === "23505") e.message = "That web address (slug) is already used by another item.";
  if (error.code === "42501" || /row-level security/i.test(error.message || "")) e.message = "Your account isn't allowed to make this change. Ask the site owner to add you to the team.";
  return e;
}

/* Shrink big images before upload so pages stay fast. */
export async function shrinkImage(file, max = 2000, quality = 0.85) {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") return file;
  const bmp = await createImageBitmap(file).catch(() => null);
  if (!bmp) return file;
  const s = Math.min(1, max / Math.max(bmp.width, bmp.height));
  if (s === 1 && file.size < 1.5e6) return file;
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * s);
  c.height = Math.round(bmp.height * s);
  c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
  const blob = await new Promise((r) => c.toBlob(r, "image/jpeg", quality));
  return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
}

/* Grab a still from a video file to use as its poster. */
export function posterFromVideo(file, at = 0.12) {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    v.muted = true;
    v.preload = "metadata";
    v.src = URL.createObjectURL(file);
    let done = false;
    const finish = (val) => {
      if (done) return;
      done = true;
      URL.revokeObjectURL(v.src);
      resolve(val);
    };
    v.onloadedmetadata = () => {
      v.currentTime = Math.min(v.duration * at, Math.max(0, v.duration - 0.5)) || 1;
    };
    v.onseeked = () => {
      const c = document.createElement("canvas");
      const s = Math.min(1, 1600 / v.videoWidth);
      c.width = Math.round(v.videoWidth * s) || 1280;
      c.height = Math.round(v.videoHeight * s) || 720;
      c.getContext("2d").drawImage(v, 0, 0, c.width, c.height);
      c.toBlob((b) => finish(b ? { blob: b, duration: v.duration } : { duration: v.duration }), "image/jpeg", 0.85);
    };
    v.onerror = () => finish(null);
    setTimeout(() => finish(null), 15000);
  });
}

/* ---------------- Supabase ---------------- */
let sbP;
const sb = () => (sbP ||= import("@supabase/supabase-js").then((m) => m.createClient(URL_, KEY, { auth: { persistSession: true, detectSessionInUrl: true } })));

const supa = {
  async getUser() {
    const c = await sb();
    const { data } = await c.auth.getSession();
    return data.session ? data.session.user : null;
  },
  async onAuth(cb) {
    const c = await sb();
    const { data } = c.auth.onAuthStateChange((_e, session) => {
      setTimeout(() => cb(session ? session.user : null), 0);
    });
    return () => data.subscription.unsubscribe();
  },
  /* Email link. With create=true this also makes a new account (needs the human check). */
  async signIn(email, { captcha, create = false, name = "", next = "/studio" } = {}) {
    const c = await sb();
    const options = withCaptcha({ shouldCreateUser: !!create, emailRedirectTo: window.location.origin + next }, captcha);
    if (create && name) options.data = { display_name: name.slice(0, 60) };
    const { error } = await c.auth.signInWithOtp({ email, options });
    if (error) {
      if (error.status === 429 || /rate limit/i.test(error.message)) throw friendly({ message: "Too many sign-in emails have been sent. Wait a bit, or sign in with your PIN." });
      if (/captcha/i.test(error.message)) throw friendly({ message: "The human check didn't go through. Try it again." });
      throw friendly(error.status === 422 || /signups not allowed|not found/i.test(error.message)
        ? { message: create ? "New accounts aren't open yet." : "We couldn't find an account for that email. Create one first." }
        : error);
    }
  },
  /* After the first emailed link, team members sign in with their email and a 6-digit PIN. */
  async signInWithPin(email, pin, captcha) {
    const c = await sb();
    const { error } = await c.auth.signInWithPassword({ email, password: pin, options: withCaptcha({}, captcha) });
    if (error) {
      if (error.status === 429 || /rate limit|too many/i.test(error.message)) throw friendly({ message: "Too many tries. Wait a few minutes and try again." });
      if (/captcha/i.test(error.message)) throw friendly({ message: "The human check didn't go through. Try it again." });
      if (/email not confirmed/i.test(error.message)) throw friendly({ message: "Use the emailed sign-in link once first, then set your PIN in the Studio." });
      throw friendly({ message: "That email and PIN don't match. Try again, or email yourself a sign-in link." });
    }
  },
  async setPin(pin) {
    const c = await sb();
    const { error } = await c.auth.updateUser({ password: pin, data: { has_pin: true, must_change_pin: false } });
    if (error) throw friendly(/reauthentication|nonce/i.test(error.message) ? { message: "For security, sign in again with an email link, then set your PIN." } : error);
  },
  async signOut() {
    const c = await sb();
    await c.auth.signOut();
  },
  /* Team (owner only). The database functions check that the caller is the site owner. */
  team: {
    async list() {
      const c = await sb();
      const { data, error } = await c.rpc("team_list");
      if (error) throw friendly(error);
      return data || [];
    },
    async add(email, name, pin) {
      const c = await sb();
      const { data, error } = await c.rpc("team_add", { p_email: email, p_name: name, p_pin: pin });
      if (error) throw friendly(error);
      return data;
    },
    async resetPin(userId, pin) {
      const c = await sb();
      const { error } = await c.rpc("team_reset_pin", { p_user: userId, p_pin: pin });
      if (error) throw friendly(error);
    },
    async remove(userId) {
      const c = await sb();
      const { error } = await c.rpc("team_remove", { p_user: userId });
      if (error) throw friendly(error);
    },
  },
  /* Backlot teams. Anyone signed in can start a team and invite people with a link. */
  teams: {
    async mine() {
      const c = await sb();
      const { data, error } = await c.rpc("my_workspaces");
      if (error) throw friendly(error);
      return data || [];
    },
    async create(name) {
      const c = await sb();
      const { data, error } = await c.rpc("create_workspace", { p_name: name });
      if (error) throw friendly(error);
      return data;
    },
    async rename(id, name) {
      const c = await sb();
      const { error } = await c.from("workspaces").update({ name: name.trim().slice(0, 80) || "Untitled team" }).eq("id", id);
      if (error) throw friendly(error);
    },
    async remove(id) {
      const c = await sb();
      const { error } = await c.rpc("delete_workspace", { p_ws: id });
      if (error) throw friendly(error);
    },
    async members(id) {
      const c = await sb();
      const { data, error } = await c.rpc("ws_members", { p_ws: id });
      if (error) throw friendly(error);
      return data || [];
    },
    async removeMember(id, userId) {
      const c = await sb();
      const { error } = await c.from("workspace_members").delete().eq("workspace_id", id).eq("user_id", userId);
      if (error) throw friendly(error);
    },
    async leave(id) {
      const me = await supa.getUser();
      return supa.teams.removeMember(id, me.id);
    },
    async invites(id) {
      const c = await sb();
      const { data, error } = await c.from("workspace_invites").select("token,expires_at,uses,revoked").eq("workspace_id", id).eq("revoked", false).gt("expires_at", new Date().toISOString()).order("created_at", { ascending: false });
      if (error) throw friendly(error);
      return data || [];
    },
    async invite(id) {
      const c = await sb();
      const { data, error } = await c.from("workspace_invites").insert({ workspace_id: id }).select("token,expires_at,uses,revoked").single();
      if (error) throw friendly(error);
      return data;
    },
    async revoke(token) {
      const c = await sb();
      const { error } = await c.from("workspace_invites").update({ revoked: true }).eq("token", token);
      if (error) throw friendly(error);
    },
    async inviteInfo(token) {
      const c = await sb();
      const { data, error } = await c.rpc("invite_info", { p_token: token });
      if (error) throw friendly(error);
      return (data && data[0]) || null;
    },
    async join(token) {
      const c = await sb();
      const { data, error } = await c.rpc("join_workspace", { p_token: token });
      if (error) throw friendly(error);
      return data;
    },
  },
  async isOwner() {
    const c = await sb();
    const { data, error } = await c.rpc("is_site_owner");
    return !error && data === true;
  },
  async getProfile(id) {
    const c = await sb();
    const { data } = await c.from("profiles").select("id,display_name").eq("id", id).maybeSingle();
    return data;
  },
  async setDisplayName(id, name) {
    const c = await sb();
    const { error } = await c.from("profiles").upsert({ id, display_name: name });
    if (error) throw friendly(error);
  },

  async listPosts({ drafts } = {}) {
    const c = await sb();
    let q = c.from("posts").select("id,slug,title,excerpt,cover_url,published,created_at,updated_at,author_name").order("created_at", { ascending: false });
    if (!drafts) q = q.eq("published", true);
    const { data, error } = await q;
    if (error) throw friendly(error);
    return data;
  },
  async getPost({ id, slug }) {
    const c = await sb();
    const { data, error } = await c.from("posts").select("*").eq(id ? "id" : "slug", id || slug).maybeSingle();
    if (error) throw friendly(error);
    return data;
  },
  async savePost(p) {
    const c = await sb();
    const row = { slug: p.slug, title: p.title, excerpt: p.excerpt, body: p.body, cover_url: p.cover_url, published: !!p.published, author_name: p.author_name, updated_at: stamp() };
    const q = p.id ? c.from("posts").update(row).eq("id", p.id) : c.from("posts").insert(row);
    const { data, error } = await q.select().single();
    if (error) throw friendly(error);
    return data;
  },
  async deletePost(id) {
    const c = await sb();
    const { error } = await c.from("posts").delete().eq("id", id);
    if (error) throw friendly(error);
  },

  async listStudies({ drafts } = {}) {
    const c = await sb();
    let q = c.from("studies").select("id,slug,title,scripture,excerpt,cover_url,published,comments_open,created_at,updated_at,author_name").order("created_at", { ascending: false });
    if (!drafts) q = q.eq("published", true);
    const { data, error } = await q;
    if (error) throw friendly(error);
    const counts = await c.rpc("study_comment_counts");
    const n = Object.fromEntries((counts.data || []).map((r) => [r.study_id, Number(r.n)]));
    return data.map((s) => ({ ...s, comments: n[s.id] || 0 }));
  },
  async getStudy({ id, slug }) {
    const c = await sb();
    const { data, error } = await c.from("studies").select("*").eq(id ? "id" : "slug", id || slug).maybeSingle();
    if (error) throw friendly(error);
    return data;
  },
  async saveStudy(p) {
    const c = await sb();
    const row = { slug: p.slug, title: p.title, scripture: p.scripture || "", excerpt: p.excerpt, body: p.body, questions: p.questions || "", cover_url: p.cover_url, comments_open: p.comments_open !== false, published: !!p.published, author_name: p.author_name, updated_at: stamp() };
    const q = p.id ? c.from("studies").update(row).eq("id", p.id) : c.from("studies").insert(row);
    const { data, error } = await q.select().single();
    if (error) throw friendly(error);
    return data;
  },
  async deleteStudy(id) {
    const c = await sb();
    const { error } = await c.from("studies").delete().eq("id", id);
    if (error) throw friendly(error);
  },
  comments: {
    async list(studyId) {
      const c = await sb();
      const { data, error } = await c.from("study_comments").select("id,study_id,user_id,author_name,body,hidden,created_at").eq("study_id", studyId).order("created_at", { ascending: true });
      if (error) throw friendly(error);
      return data;
    },
    async add(studyId, body) {
      const c = await sb();
      const { data, error } = await c.from("study_comments").insert({ study_id: studyId, body }).select("id,study_id,user_id,author_name,body,hidden,created_at").single();
      if (error) throw friendly(error.code === "42501" ? { message: "Comments are closed on this study." } : error);
      return data;
    },
    async remove(id) {
      const c = await sb();
      const { error } = await c.from("study_comments").delete().eq("id", id);
      if (error) throw friendly(error);
    },
    async setHidden(id, hidden) {
      const c = await sb();
      const { error } = await c.from("study_comments").update({ hidden }).eq("id", id);
      if (error) throw friendly(error);
    },
  },

  async listFilms({ drafts } = {}) {
    const c = await sb();
    let q = c.from("films").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: false });
    if (!drafts) q = q.eq("published", true);
    const { data, error } = await q;
    if (error) throw friendly(error);
    return data;
  },
  async getFilm(id) {
    const c = await sb();
    const { data, error } = await c.from("films").select("*").eq("id", id).maybeSingle();
    if (error) throw friendly(error);
    return data;
  },
  async saveFilm(f) {
    const c = await sb();
    const row = { title: f.title, description: f.description, year: f.year || null, runtime: f.runtime || null, video_url: f.video_url, video_path: f.video_path, poster_url: f.poster_url, published: !!f.published, sort_order: f.sort_order ?? 0, updated_at: stamp() };
    const q = f.id ? c.from("films").update(row).eq("id", f.id) : c.from("films").insert(row);
    const { data, error } = await q.select().single();
    if (error) throw friendly(error);
    return data;
  },
  async deleteFilm(f) {
    const c = await sb();
    const { error } = await c.from("films").delete().eq("id", f.id);
    if (error) throw friendly(error);
    if (f.video_path) await c.storage.from("films").remove([f.video_path]);
  },

  async uploadImage(file, folder = "images") {
    const c = await sb();
    const f = await shrinkImage(file);
    const path = `${folder}/${Date.now()}-${safeName(f.name)}`;
    const { error } = await c.storage.from("media").upload(path, f, { cacheControl: "31536000", contentType: f.type, upsert: false });
    if (error) throw friendly(error);
    return c.storage.from("media").getPublicUrl(path).data.publicUrl;
  },
  /* Large movies upload in 6 MB pieces and can resume if the connection drops. */
  uploadVideo(file, onProgress) {
    let upload;
    const promise = (async () => {
      const c = await sb();
      const { Upload } = await import("tus-js-client");
      const { data } = await c.auth.getSession();
      if (!data.session) throw new Error("Sign in again to upload.");
      const path = `${Date.now()}-${safeName(file.name)}`;
      await new Promise((resolve, reject) => {
        upload = new Upload(file, {
          endpoint: `${URL_}/storage/v1/upload/resumable`,
          retryDelays: [0, 2000, 5000, 10000, 20000],
          headers: { authorization: `Bearer ${data.session.access_token}`, "x-upsert": "false" },
          uploadDataDuringCreation: true,
          removeFingerprintOnSuccess: true,
          chunkSize: 6 * 1024 * 1024,
          metadata: { bucketName: "films", objectName: path, contentType: file.type || "video/mp4", cacheControl: "3600" },
          onError: (err) => reject(new Error(/413|too large|exceeded/i.test(String(err)) ? "This file is bigger than your storage plan allows. Raise the upload limit in Supabase > Storage > Settings." : "The upload stopped: " + (err.message || err))),
          onProgress: (sent, total) => onProgress && onProgress(sent / total),
          onSuccess: resolve,
        });
        upload.findPreviousUploads().then((prev) => {
          if (prev.length) upload.resumeFromPreviousUpload(prev[0]);
          upload.start();
        });
      });
      return { path, url: c.storage.from("films").getPublicUrl(path).data.publicUrl };
    })();
    return { promise, abort: () => upload && upload.abort(true) };
  },

  async backlot(ws) {
    const c = await sb();
    const me = await supa.getUser();
    if (!me) throw new Error("Sign in to open Backlot.");
    if (!ws) throw new Error("Pick a team to open Backlot.");
    const chk = ({ error }) => {
      if (error) throw { code: error.code === "42501" ? "invalid_argument" : "unavailable", message: error.message };
    };
    const store = createDocStore({
      set: (path, coll, data) => c.from("backlot_docs").upsert({ workspace_id: ws, path, coll, data, updated_by: me.id }, { onConflict: "workspace_id,path" }).then(chk),
      update: (path, patch) => c.rpc("backlot_update", { p_ws: ws, p_path: path, p_patch: patch }).then(chk),
      delete: (path) => c.from("backlot_docs").delete().eq("workspace_id", ws).eq("path", path).then(chk),
    });
    const docs = c
      .channel("backlot-docs-" + ws)
      .on("postgres_changes", { event: "*", schema: "public", table: "backlot_docs", filter: "workspace_id=eq." + ws }, (p) => {
        if (p.eventType === "DELETE") store.remote(p.old.path, null);
        else store.remote(p.new.path, p.new.data);
      })
      .subscribe();
    const rows = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await c.from("backlot_docs").select("path,data").eq("workspace_id", ws).range(from, from + 999);
      if (error) throw friendly(error);
      rows.push(...data);
      if (data.length < 1000) break;
    }
    store.load(rows.map((r) => [r.path, r.data]));

    /* who is here right now */
    let state = {};
    let joined = false;
    const handlers = new Set();
    const pres = c.channel("backlot-presence-" + ws, { config: { presence: { key: me.id } } });
    const peers = () =>
      Object.entries(pres.presenceState()).map(([k, arr]) => ({ peer: k, by: k, isMe: k === me.id, presence: arr[arr.length - 1] || {} }));
    pres.on("presence", { event: "sync" }, () => handlers.forEach((h) => h({ peers: peers() })));
    pres.subscribe(async (s) => {
      if (s === "SUBSCRIBED") {
        joined = true;
        await pres.track(state);
      }
    });

    const names = {};
    const user = {
      id: async () => me.id,
      can: async () => true,
      canEdit: async () => true,
      isOwner: async () => false,
      profiles: async (ids) => {
        const miss = ids.filter((i) => !(i in names));
        if (miss.length) {
          const { data } = await c.from("profiles").select("id,display_name").in("id", miss);
          miss.forEach((i) => (names[i] = ""));
          (data || []).forEach((r) => (names[r.id] = r.display_name || ""));
        }
        return Object.fromEntries(ids.map((i) => [i, { id: i, name: names[i] || "", color: colorFor(i), avatarUrl: avatarFor(names[i] || "?", colorFor(i)), isMe: i === me.id }]));
      },
    };
    const room = {
      presence: async (patch) => {
        state = { ...state, ...patch };
        if (joined) await pres.track(state);
      },
      onPeers: (h) => {
        handlers.add(h);
        return () => handlers.delete(h);
      },
    };
    const versions = {
      async list(n = 100) {
        const { data, error } = await c.from("backlot_versions").select("id,created_at,created_by,label,auto,scene_count,pages").eq("workspace_id", ws).order("created_at", { ascending: false }).limit(n);
        if (error) throw friendly(error);
        return data;
      },
      async get(id) {
        const { data, error } = await c.from("backlot_versions").select("*").eq("workspace_id", ws).eq("id", id).maybeSingle();
        if (error) throw friendly(error);
        return data;
      },
      async save(v) {
        const { data, error } = await c.from("backlot_versions").insert({ workspace_id: ws, label: v.label, auto: v.auto, data: v.data, scene_count: v.scene_count, pages: v.pages }).select("id,created_at").single();
        if (error) throw friendly(error);
        return data;
      },
    };
    return { db: store.db, user, room, versions, tts: hdVoices, uploadImage: (f) => supa.uploadImage(f, "backlot/" + ws), destroy: () => { c.removeChannel(docs); c.removeChannel(pres); } };
  },
};

/* HD voices for Backlot table reads (ElevenLabs, through the "tts" Supabase function so the key stays secret) */
const hdVoices = {
  async call(payload) {
    const c = await sb();
    const { data } = await c.auth.getSession();
    const token = data && data.session ? data.session.access_token : KEY;
    return fetch(`${URL_}/functions/v1/tts`, { method: "POST", headers: { "Content-Type": "application/json", apikey: KEY, Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
  },
  async voices() {
    const r = await hdVoices.call({ action: "voices" });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(j.error || "HD voices aren't available right now."); e.status = r.status; throw e; }
    return j.voices || [];
  },
  async quota() { try { const r = await hdVoices.call({ action: "quota" }); return r.ok ? r.json() : null; } catch { return null; } },
  async speak(text, voice, model) {
    const r = await hdVoices.call({ action: "speak", text, voice, model });
    if (!r.ok) { const j = await r.json().catch(() => ({})); const e = new Error(j.error || "The HD voice couldn't read that line."); e.status = r.status; throw e; }
    return r.blob();
  },
};

/* ---------------- Demo (this browser only) ---------------- */
const DKEY = "olm.demo.v1";
const blobs = new Map();
const readDemo = () => {
  try {
    return JSON.parse(localStorage.getItem(DKEY)) || { posts: [], films: [] };
  } catch {
    return { posts: [], films: [] };
  }
};
const writeDemo = (d) => {
  try {
    localStorage.setItem(DKEY, JSON.stringify(d));
  } catch {
    throw new Error("This browser's demo storage is full. Connect Supabase to store real content.");
  }
};
const authSubs = new Set();
const fileToDataUrl = (f) => new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(f); });

const demo = {
  async getUser() {
    try {
      return JSON.parse(sessionStorage.getItem("olm.demo.user"));
    } catch {
      return null;
    }
  },
  async onAuth(cb) {
    authSubs.add(cb);
    return () => authSubs.delete(cb);
  },
  async signInWithPin(email) { return demo.signIn(email); },
  async setPin() {},
  teams: (() => {
    let list = [{ id: "demo-team", name: "Demo team", role: "owner", is_home: true, members: 1, created_at: new Date().toISOString() }];
    return {
      async mine() { return list.slice(); },
      async create(name) { const t = { id: "demo-" + Date.now(), name: name || "Untitled team", role: "owner", is_home: false, members: 1, created_at: new Date().toISOString() }; list.push(t); return t.id; },
      async rename(id, name) { list = list.map((t) => (t.id === id ? { ...t, name } : t)); },
      async remove(id) { list = list.filter((t) => t.id !== id); },
      async members() { return [{ user_id: "demo", display_name: "You", role: "owner", joined_at: new Date().toISOString() }]; },
      async removeMember() {},
      async leave(id) { list = list.filter((t) => t.id !== id); },
      async invites() { return []; },
      async invite() { return { token: "demo-invite", expires_at: new Date(Date.now() + 14 * 864e5).toISOString(), uses: 0, revoked: false }; },
      async revoke() {},
      async inviteInfo() { return { team_name: "Demo team", valid: true, already_member: true }; },
      async join() { return "demo-team"; },
    };
  })(),
  team: (() => {
    let people = [{ user_id: "demo-owner", email: "you@oncelostmedia.com", display_name: "You", is_owner: true, has_pin: true, must_change_pin: false, last_sign_in_at: new Date().toISOString(), created_at: new Date().toISOString() }];
    return {
      async list() { return people.slice(); },
      async add(email, name, pin) {
        if (people.some((p) => p.email === email.toLowerCase())) throw new Error("That email is already on the team.");
        people.push({ user_id: "demo-" + Date.now(), email: email.toLowerCase(), display_name: name, is_owner: false, has_pin: true, must_change_pin: true, last_sign_in_at: null, created_at: new Date().toISOString() });
      },
      async resetPin() {},
      async remove(id) { people = people.filter((p) => p.user_id !== id); },
    };
  })(),
  async signIn(email) {
    const u = { id: "demo-" + slugify(email), email };
    try { sessionStorage.setItem("olm.demo.user", JSON.stringify(u)); } catch {}
    authSubs.forEach((cb) => cb(u));
    return { instant: true };
  },
  async signOut() {
    try { sessionStorage.removeItem("olm.demo.user"); } catch {}
    authSubs.forEach((cb) => cb(null));
  },
  async getProfile() { return null; },
  async isOwner() { return true; },
  async setDisplayName() {},
  async listPosts({ drafts } = {}) {
    return readDemo().posts.filter((p) => drafts || p.published).sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  async getPost({ id, slug }) {
    return readDemo().posts.find((p) => (id ? p.id === id : p.slug === slug)) || null;
  },
  async savePost(p) {
    const d = readDemo();
    if (d.posts.some((x) => x.slug === p.slug && x.id !== p.id)) throw new Error("That web address (slug) is already used by another post.");
    const row = { ...p, id: p.id || uid(), created_at: p.created_at || stamp(), updated_at: stamp() };
    d.posts = d.posts.filter((x) => x.id !== row.id).concat(row);
    writeDemo(d);
    return row;
  },
  async deletePost(id) {
    const d = readDemo();
    d.posts = d.posts.filter((x) => x.id !== id);
    writeDemo(d);
  },
  async listStudies({ drafts } = {}) {
    const d = readDemo();
    return (d.studies || []).filter((p) => drafts || p.published).map((s) => ({ ...s, comments: (d.comments || []).filter((c) => c.study_id === s.id && !c.hidden).length })).sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  async getStudy({ id, slug }) {
    return (readDemo().studies || []).find((p) => (id ? p.id === id : p.slug === slug)) || null;
  },
  async saveStudy(p) {
    const d = readDemo();
    d.studies = d.studies || [];
    if (d.studies.some((x) => x.slug === p.slug && x.id !== p.id)) throw new Error("That web address (slug) is already used by another study.");
    const row = { comments_open: true, ...p, id: p.id || uid(), created_at: p.created_at || stamp(), updated_at: stamp() };
    d.studies = d.studies.filter((x) => x.id !== row.id).concat(row);
    writeDemo(d);
    return row;
  },
  async deleteStudy(id) {
    const d = readDemo();
    d.studies = (d.studies || []).filter((x) => x.id !== id);
    writeDemo(d);
  },
  comments: {
    async list(studyId) { return (readDemo().comments || []).filter((c) => c.study_id === studyId); },
    async add(studyId, body) {
      const u = await demo.getUser();
      if (!u) throw new Error("Sign in to comment.");
      const d = readDemo();
      const row = { id: uid(), study_id: studyId, user_id: u.id, author_name: u.email.split("@")[0], body: body.trim(), hidden: false, created_at: stamp() };
      d.comments = (d.comments || []).concat(row);
      writeDemo(d);
      return row;
    },
    async remove(id) { const d = readDemo(); d.comments = (d.comments || []).filter((c) => c.id !== id); writeDemo(d); },
    async setHidden(id, hidden) { const d = readDemo(); d.comments = (d.comments || []).map((c) => (c.id === id ? { ...c, hidden } : c)); writeDemo(d); },
  },
  async listFilms({ drafts } = {}) {
    return readDemo().films.filter((f) => drafts || f.published).map((f) => ({ ...f, video_url: blobs.get(f.id) || f.video_url })).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || b.created_at.localeCompare(a.created_at));
  },
  async getFilm(id) {
    const f = readDemo().films.find((x) => x.id === id);
    return f ? { ...f, video_url: blobs.get(f.id) || f.video_url } : null;
  },
  async saveFilm(f) {
    const d = readDemo();
    const row = { ...f, id: f.id || uid(), created_at: f.created_at || stamp(), updated_at: stamp() };
    if (row.video_url && row.video_url.startsWith("blob:")) blobs.set(row.id, row.video_url);
    d.films = d.films.filter((x) => x.id !== row.id).concat(row);
    writeDemo(d);
    return row;
  },
  async deleteFilm(f) {
    const d = readDemo();
    d.films = d.films.filter((x) => x.id !== f.id);
    writeDemo(d);
  },
  async uploadImage(file) {
    return fileToDataUrl(await shrinkImage(file, 1400, 0.8));
  },
  uploadVideo(file, onProgress) {
    let stop = false;
    const promise = new Promise((res, rej) => {
      let p = 0;
      const t = setInterval(() => {
        if (stop) { clearInterval(t); rej(new Error("Upload cancelled.")); return; }
        p = Math.min(1, p + 0.08);
        onProgress && onProgress(p);
        if (p >= 1) { clearInterval(t); res({ path: "", url: URL.createObjectURL(file) }); }
      }, 90);
    });
    return { promise, abort: () => (stop = true) };
  },
  async backlot() {
    const me = (await demo.getUser()) || { id: "demo-you", email: "you@example.com" };
    let t;
    const store = createDocStore({
      set: async () => persist(),
      update: async () => persist(),
      delete: async () => persist(),
    });
    function persist() {
      clearTimeout(t);
      t = setTimeout(() => {
        try { localStorage.setItem("olm.demo.backlot", JSON.stringify(store.dump())); } catch {}
      }, 300);
    }
    let saved = [];
    try { saved = JSON.parse(localStorage.getItem("olm.demo.backlot")) || []; } catch {}
    store.load(saved);
    const handlers = new Set();
    let state = {};
    const emit = () => handlers.forEach((h) => h({ peers: [{ peer: me.id, by: me.id, isMe: true, presence: state }] }));
    return {
      db: store.db,
      user: {
        id: async () => me.id,
        can: async () => true,
        profiles: async (ids) => Object.fromEntries(ids.map((i) => [i, { id: i, name: i === me.id ? "You" : "", color: colorFor(i), avatarUrl: avatarFor(i === me.id ? "You" : "?", colorFor(i)), isMe: i === me.id }])),
      },
      room: {
        presence: async (p) => { state = { ...state, ...p }; emit(); },
        onPeers: (h) => { handlers.add(h); setTimeout(emit, 0); return () => handlers.delete(h); },
      },
      versions: {
        async list(n = 100) {
          let v = [];
          try { v = JSON.parse(localStorage.getItem("olm.demo.versions")) || []; } catch {}
          return v.slice(0, n).map(({ data, ...rest }) => rest);
        },
        async get(id) {
          let v = [];
          try { v = JSON.parse(localStorage.getItem("olm.demo.versions")) || []; } catch {}
          return v.find((x) => x.id === id) || null;
        },
        async save(row) {
          let v = [];
          try { v = JSON.parse(localStorage.getItem("olm.demo.versions")) || []; } catch {}
          const rec = { ...row, id: uid(), created_at: stamp(), created_by: me.id };
          v.unshift(rec);
          try { localStorage.setItem("olm.demo.versions", JSON.stringify(v.slice(0, 30))); } catch {}
          return rec;
        },
      },
      uploadImage: (f) => demo.uploadImage(f),
      tts: (typeof window !== "undefined" && window.__fakeTTS) || undefined,
      destroy: () => {},
    };
  },
};

export const api = DEMO ? demo : supa;
