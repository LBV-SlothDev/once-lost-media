import { useEffect, useRef, useState } from "react";
import { Link, useRouter } from "../lib/router.jsx";
import { useAuth } from "../lib/auth.jsx";
import { DEMO, api } from "../lib/backend.js";
import { asset, fmtDate, fmtRuntime } from "../lib/format.js";

export function Nav({ onReplay }) {
  const { user } = useAuth();
  return (
    <header className="topnav">
      <div className="nav-in">
        <Link to="/" className="nav-brand" aria-label="Once Lost Media home">
          <img src={asset("emblem.png")} alt="" width="38" height="32" />
          <span>Once Lost Media</span>
        </Link>
        <div className="nav-right">
          <nav className="nav-links" aria-label="Main">
            <Link to="/films">Films</Link>
            <Link to="/journal">Journal</Link>
            {user && <Link to="/studio">Studio</Link>}
          </nav>
          <MoreMenu user={user} onReplay={onReplay} />
        </div>
      </div>
    </header>
  );
}

/* The three-dot menu in the top bar. */
function MoreMenu({ user, onReplay }) {
  const { navigate, path } = useRouter();
  const [open, setOpen] = useState(false);
  const wrap = useRef(null);
  const btn = useRef(null);
  const items = [
    { label: "Home", to: "/" },
    { label: "Films", to: "/films" },
    { label: "Journal", to: "/journal" },
    "sep",
    ...(user
      ? [
          { label: "Studio", to: "/studio" },
          { label: "Upload a film", to: "/studio/film/new" },
          { label: "Write a journal entry", to: "/studio/post/new" },
          { label: "Backlot", to: "/studio/backlot", hint: "Script · storyboard · call sheets" },
          "sep",
        ]
      : []),
    { label: "Replay the opening reel", run: () => onReplay && onReplay() },
    user ? { label: "Sign out", run: async () => { await api.signOut(); navigate("/"); } } : { label: "Team sign in", to: "/login" },
  ];

  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const away = (e) => { if (wrap.current && !wrap.current.contains(e.target)) setOpen(false); };
    const key = (e) => {
      const list = [...wrap.current.querySelectorAll("[role=menuitem]")];
      const i = list.indexOf(document.activeElement);
      if (e.key === "Escape") { setOpen(false); btn.current.focus(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); list[(i + 1) % list.length].focus(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); list[(i - 1 + list.length) % list.length].focus(); }
      else if (e.key === "Home") { e.preventDefault(); list[0].focus(); }
      else if (e.key === "End") { e.preventDefault(); list[list.length - 1].focus(); }
      else if (e.key === "Tab") setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", key);
    requestAnimationFrame(() => { const f = wrap.current && wrap.current.querySelector("[role=menuitem]"); if (f) f.focus(); });
    return () => { document.removeEventListener("pointerdown", away); document.removeEventListener("keydown", key); };
  }, [open]);

  const choose = (it) => {
    setOpen(false);
    if (it.to) navigate(it.to);
    else if (it.run) it.run();
  };

  return (
    <div className="more" ref={wrap}>
      <button ref={btn} className="more-btn" aria-label="More options" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="12" cy="5" r="2" fill="currentColor" /><circle cx="12" cy="12" r="2" fill="currentColor" /><circle cx="12" cy="19" r="2" fill="currentColor" /></svg>
      </button>
      {open && (
        <div className="more-menu" role="menu" aria-label="More options">
          {items.map((it, i) =>
            it === "sep" ? <div key={i} className="more-sep" role="separator" /> : (
              <button key={i} role="menuitem" className={"more-item" + (it.to && it.to === path ? " cur" : "")} onClick={() => choose(it)}>
                <span>{it.label}</span>
                {it.hint && <small>{it.hint}</small>}
              </button>
            )
          )}
          {user && user.email && <div className="more-who">Signed in as {user.email}</div>}
        </div>
      )}
    </div>
  );
}

export function Footer({ onReplay }) {
  const { user } = useAuth();
  return (
    <footer className="foot">
      <div className="foot-in">
        <img src={asset("emblem.png")} alt="" width="56" height="47" />
        <div className="foot-txt">
          <strong>Once Lost Media</strong>
          <span>© {new Date().getFullYear()} Once Lost Media. All rights reserved.</span>
        </div>
        <div className="foot-links">
          <button className="linkish" onClick={onReplay}>Replay the opening reel</button>
          {user ? <Link to="/studio">Studio</Link> : <Link to="/login">Team sign in</Link>}
        </div>
      </div>
      {DEMO && <div className="demo-chip" title="Content is saved in this browser only until Supabase is connected.">Demo mode</div>}
    </footer>
  );
}

export function FilmCard({ film }) {
  return (
    <Link to={`/films/${film.id}`} className="film-card">
      <div className="film-poster">
        {film.poster_url ? <img src={film.poster_url} alt="" loading="lazy" /> : <div className="poster-blank"><img src={asset("emblem.png")} alt="" /></div>}
        <span className="play" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M8 5v14l11-7z" fill="currentColor" /></svg></span>
      </div>
      <div className="film-meta">
        <h3>{film.title}</h3>
        <p>{[film.year, fmtRuntime(film.runtime)].filter(Boolean).join(" · ")}</p>
      </div>
    </Link>
  );
}

export function PostCard({ post, big }) {
  return (
    <Link to={`/journal/${post.slug}`} className={"post-card" + (big ? " big" : "")}>
      {post.cover_url && <div className="post-cover"><img src={post.cover_url} alt="" loading="lazy" /></div>}
      <div className="post-body">
        <time>{fmtDate(post.created_at)}</time>
        <h3>{post.title}</h3>
        {post.excerpt && <p>{post.excerpt}</p>}
        <span className="more">Read the entry →</span>
      </div>
    </Link>
  );
}

/* A strip of film that keeps running across the page. */
export function RunningStrip({ films }) {
  const imgs = films.filter((f) => f.poster_url).map((f) => f.poster_url);
  const cells = Array.from({ length: 12 }, (_, i) => imgs.length ? imgs[i % imgs.length] : null);
  const row = cells.map((src, i) => (
    <div className="strip-cell" key={i}>{src ? <img src={src} alt="" /> : <img className="ghost" src={asset("emblem.png")} alt="" />}</div>
  ));
  return (
    <div className="strip" aria-hidden="true">
      <div className="strip-track">{row}{row}</div>
    </div>
  );
}

export function Empty({ title, children }) {
  return (
    <div className="empty">
      <img src={asset("emblem.png")} alt="" width="72" />
      <h3>{title}</h3>
      {children}
    </div>
  );
}

export function Loading({ label = "Loading" }) {
  return <div className="loading" role="status"><span className="reel-spin" aria-hidden="true" />{label}…</div>;
}

export function ErrorNote({ error }) {
  if (!error) return null;
  return <div className="error-note" role="alert">{error.message || String(error)}</div>;
}

export function RequireTeam({ children }) {
  const { user, loading } = useAuth();
  const { navigate } = useRouter();
  useEffect(() => {
    if (!loading && !user) navigate("/login", { replace: true });
  }, [user, loading, navigate]);
  if (loading || !user) return <main className="page"><Loading /></main>;
  return children;
}

/* Load data with loading / error state. */
export function useLoad(fn, deps) {
  const [s, set] = useState({ data: null, error: null, loading: true });
  useEffect(() => {
    let alive = true;
    set((p) => ({ ...p, loading: true, error: null }));
    fn().then(
      (data) => alive && set({ data, error: null, loading: false }),
      (error) => alive && set({ data: null, error, loading: false })
    );
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return s;
}

let toastSet;
export function Toaster() {
  const [msg, setMsg] = useState("");
  useEffect(() => {
    let t;
    toastSet = (m) => { setMsg(m); clearTimeout(t); t = setTimeout(() => setMsg(""), 3200); };
  }, []);
  return msg ? <div className="toast" role="status">{msg}</div> : null;
}
export const toast = (m) => toastSet && toastSet(m);

export function ConfirmButton({ children, confirm = "Click again to confirm", onConfirm, className = "btn danger", disabled }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <button type="button" className={className} disabled={disabled} onClick={() => (armed ? (setArmed(false), onConfirm()) : setArmed(true))}>
      {armed ? confirm : children}
    </button>
  );
}
