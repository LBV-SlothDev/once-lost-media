/*
 * A tiny Firestore-style document store used by Backlot.
 * Backlot talks to `db.collection(...)` / `db.doc(...)`; this file keeps an
 * in-memory cache, notifies subscribers, and hands every write to `hooks`
 * (Supabase in production, localStorage in demo mode).
 */
export function deepMerge(base, patch) {
  const out = { ...(base || {}) };
  for (const [k, v] of Object.entries(patch || {})) {
    if (v && typeof v === "object" && !Array.isArray(v) && out[k] && typeof out[k] === "object" && !Array.isArray(out[k])) {
      out[k] = deepMerge(out[k], v);
    } else out[k] = v;
  }
  return out;
}

const parentOf = (path) => path.split("/").slice(0, -1).join("/");
const idOf = (path) => path.split("/").pop();
const freeze = (o) => JSON.parse(JSON.stringify(o ?? null));

export function createDocStore(hooks = {}) {
  const cache = new Map();
  const subs = new Set();
  let ready = false;

  const docSnap = (path) => {
    const data = cache.get(path);
    return { id: idOf(path), exists: data !== undefined, data: () => (data === undefined ? undefined : freeze(data)), metadata: { fromCache: false, hasPendingWrites: false } };
  };
  const emit = () => {
    if (!ready) return;
    subs.forEach((s) => {
      try {
        if (s.kind === "doc") s.next(docSnap(s.path));
        else {
          let docs = [...cache.keys()].filter((p) => parentOf(p) === s.path).map(docSnap);
          if (s.order) docs.sort((a, b) => ((a.data()[s.order] ?? Infinity) - (b.data()[s.order] ?? Infinity)) * (s.dir === "desc" ? -1 : 1));
          s.next({ docs, size: docs.length, empty: !docs.length, docChanges: () => [], metadata: { fromCache: false, hasPendingWrites: false } });
        }
      } catch (e) {
        console.error(e);
      }
    });
  };
  const subscribe = (sub) => {
    subs.add(sub);
    if (ready) queueMicrotask(emit);
    return () => subs.delete(sub);
  };

  const docRef = (path) => ({
    id: idOf(path),
    path,
    get: async () => docSnap(path),
    set: async (data) => {
      cache.set(path, freeze(data));
      emit();
      if (hooks.set) await hooks.set(path, parentOf(path), freeze(data));
    },
    update: async (patch) => {
      if (!cache.has(path)) throw { code: "invalid_argument", message: "Document does not exist" };
      cache.set(path, deepMerge(cache.get(path), freeze(patch)));
      emit();
      if (hooks.update) await hooks.update(path, freeze(patch), cache.get(path));
    },
    delete: async () => {
      cache.delete(path);
      emit();
      if (hooks.delete) await hooks.delete(path);
    },
    onSnapshot: (next) => subscribe({ kind: "doc", path, next }),
    collection: (sub) => collRef(path + "/" + sub),
  });

  const collRef = (path, order, dir) => ({
    path,
    doc: (id) => docRef(path + "/" + (id || Math.random().toString(36).slice(2, 12))),
    add: async (data) => {
      const r = docRef(path + "/" + Math.random().toString(36).slice(2, 12));
      await r.set(data);
      return r;
    },
    orderBy: (field, d) => collRef(path, field, d),
    where: () => collRef(path, order, dir),
    limit: () => collRef(path, order, dir),
    get: async () => {
      let docs = [...cache.keys()].filter((p) => parentOf(p) === path).map(docSnap);
      return { docs, size: docs.length, empty: !docs.length };
    },
    onSnapshot: (next) => subscribe({ kind: "coll", path, order, dir, next }),
  });

  return {
    db: { doc: docRef, collection: (p) => collRef(p) },
    /** Load the full set of documents (initial fetch). */
    load(entries) {
      cache.clear();
      entries.forEach(([p, d]) => cache.set(p, d));
      ready = true;
      emit();
    },
    /** Apply a change that came from another person. */
    remote(path, data) {
      if (data === null) cache.delete(path);
      else cache.set(path, data);
      emit();
    },
    dump: () => [...cache.entries()],
  };
}

/* Initials avatar as a data URL, with a stable color per person. */
export function colorFor(id) {
  let h = 0;
  for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return `hsl(${h % 360} 55% 48%)`;
}
export function avatarFor(name, color) {
  const ini = (name || "?").split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="32" fill="${color}"/><text x="32" y="40" font-family="Arial" font-size="24" font-weight="700" fill="#fff" text-anchor="middle">${ini.replace(/[<&>"]/g, "")}</text></svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}
