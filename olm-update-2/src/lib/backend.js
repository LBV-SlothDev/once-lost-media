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
  async signIn(email) {
    const c = await sb();
    const { error } = await c.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: window.location.origin + "/studio" } });
    if (error) throw friendly(error.status === 422 || /signups not allowed|not found/i.test(error.message) ? { message: "That email isn't on the Once Lost Media team. Ask the site owner to invite you." } : error);
  },
  async signOut() {
    const c = await sb();
    await c.auth.signOut();
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

  async uploadImage(file) {
    const c = await sb();
    const f = await shrinkImage(file);
    const path = `images/${Date.now()}-${safeName(f.name)}`;
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

  async backlot() {
    const c = await sb();
    const me = await supa.getUser();
    if (!me) throw new Error("Sign in to open Backlot.");
    const chk = ({ error }) => {
      if (error) throw { code: error.code === "42501" ? "invalid_argument" : "unavailable", message: error.message };
    };
    const store = createDocStore({
      set: (path, coll, data) => c.from("backlot_docs").upsert({ path, coll, data, updated_by: me.id }).then(chk),
      update: (path, patch) => c.rpc("backlot_update", { p_path: path, p_patch: patch }).then(chk),
      delete: (path) => c.from("backlot_docs").delete().eq("path", path).then(chk),
    });
    const docs = c
      .channel("backlot-docs")
      .on("postgres_changes", { event: "*", schema: "public", table: "backlot_docs" }, (p) => {
        if (p.eventType === "DELETE") store.remote(p.old.path, null);
        else store.remote(p.new.path, p.new.data);
      })
      .subscribe();
    const rows = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await c.from("backlot_docs").select("path,data").range(from, from + 999);
      if (error) throw friendly(error);
      rows.push(...data);
      if (data.length < 1000) break;
    }
    store.load(rows.map((r) => [r.path, r.data]));

    /* who is here right now */
    let state = {};
    let joined = false;
    const handlers = new Set();
    const pres = c.channel("backlot-presence", { config: { presence: { key: me.id } } });
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
        const { data, error } = await c.from("backlot_versions").select("id,created_at,created_by,label,auto,scene_count,pages").order("created_at", { ascending: false }).limit(n);
        if (error) throw friendly(error);
        return data;
      },
      async get(id) {
        const { data, error } = await c.from("backlot_versions").select("*").eq("id", id).maybeSingle();
        if (error) throw friendly(error);
        return data;
      },
      async save(v) {
        const { data, error } = await c.from("backlot_versions").insert({ label: v.label, auto: v.auto, data: v.data, scene_count: v.scene_count, pages: v.pages }).select("id,created_at").single();
        if (error) throw friendly(error);
        return data;
      },
    };
    return { db: store.db, user, room, versions, uploadImage: (f) => supa.uploadImage(f), destroy: () => { c.removeChannel(docs); c.removeChannel(pres); } };
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
      destroy: () => {},
    };
  },
};

export const api = DEMO ? demo : supa;
