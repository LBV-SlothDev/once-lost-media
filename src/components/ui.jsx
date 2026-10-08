import { useEffect, useRef, useState } from "react";
import { Link, useRouter } from "../lib/router.jsx";
import { useAuth } from "../lib/auth.jsx";
import { DEMO, api } from "../lib/backend.js";
import { asset, fmtDate, fmtRuntime } from "../lib/format.js";

export function Nav({ onReplay }) {
  const { user, isOwner } = useAuth();
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
            <Link to="/bible-study">Bible Study</Link>
            <Link to="/backlot">Backlot</Link>
            <Link to="/about">About</Link>
            {user && <Link to="/studio">Studio</Link>}
          </nav>
          <MoreMenu user={user} isOwner={isOwner} onReplay={onReplay} />
        </div>
      </div>
    </header>
  );
}

/* The three-dot menu in the top bar. */
function MoreMenu({ user, isOwner, onReplay }) {
  const { navigate, path } = useRouter();
  const [open, setOpen] = useState(false);
  const wrap = useRef(null);
  const btn = useRef(null);
  const items = [
    { label: "Home", to: "/" },
    { label: "Films", to: "/films" },
    { label: "Journal", to: "/journal" },
    { label: "Bible Study", to: "/bible-study" },
    { label: "About", to: "/about" },
    { label: "PureVibes ↗", href: "https://www.purevibes.me", hint: "Our social media platform" },
    "sep",
    ...(user
      ? [
          { label: "Studio", to: "/studio" },
          ...(isOwner ? [{ label: "Upload a film", to: "/studio/film/new" }, { label: "Write a journal entry", to: "/studio/post/new" }, { label: "Write a Bible study", to: "/studio/study/new" }] : []),
          "sep",
        ]
      : []),
    { label: "Backlot", to: user ? "/studio/backlot" : "/backlot", hint: "Free screenwriting & production tool" },
    { label: "Replay the opening reel", run: () => onReplay && onReplay() },
    user ? { label: "Sign out", run: async () => { await api.signOut(); navigate("/"); } } : { label: "Sign in", to: "/login" },
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
    if (it.href) window.open(it.href, "_blank", "noopener");
    else if (it.to) navigate(it.to);
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
          <Link to="/about">About</Link>
          <a href="https://www.purevibes.me" target="_blank" rel="noopener">PureVibes</a>
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

export function PostCard({ post, big, base = "/journal", more = "Read the entry →", kicker }) {
  return (
    <Link to={`${base}/${post.slug}`} className={"post-card" + (big ? " big" : "")}>
      {post.cover_url && <div className="post-cover"><img src={post.cover_url} alt="" loading="lazy" /></div>}
      <div className="post-body">
        <time>{kicker || fmtDate(post.created_at)}</time>
        <h3>{post.title}</h3>
        {post.excerpt && <p>{post.excerpt}</p>}
        <span className="more">{more}</span>
      </div>
    </Link>
  );
}

/* A strip of film that keeps running across the page. */
/* Free behind-the-scenes stills from Unsplash (free to use, no credit required), shown straight from Unsplash. */
const STILLS = [
  "1485846234645-a62644f84728", "1612544409025-e1f6a56c1152", "1515634928627-2a4e0dae3ddf",
  "1632187981988-40f3cbaeef5e", "1782889187454-a568fe1f20e2", "1594909122845-11baa439b7bf",
  "1759417501248-0aa9489dab3f", "1471341971476-ae15ff5dd4ea", "1611784728558-6c7d9b409cdf",
  "1681137063068-081072cf04b4", "1518930259200-3e5b29f42096", "1632187989763-c9c620420b4d",
].map((id) => `https://images.unsplash.com/photo-${id}?w=420&h=236&fit=crop&q=60&auto=format`);

export function RunningStrip({ films = [], posts = [] }) {
  // Our own images (film posters and journal covers) are spread evenly between the stills.
  const ours = [...films.filter((f) => f.poster_url).map((f) => f.poster_url), ...posts.filter((p) => p.cover_url).map((p) => p.cover_url)];
  const cells = [];
  const every = ours.length ? Math.max(1, Math.round(STILLS.length / ours.length)) : 0;
  let o = 0;
  STILLS.forEach((src, i) => {
    cells.push(src);
    if (every && (i + 1) % every === 0 && o < ours.length) cells.push(ours[o++]);
  });
  while (o < ours.length) cells.push(ours[o++]);
  const row = cells.map((src, i) => (
    <div className="strip-cell" key={i}><img src={src} alt="" decoding="async" onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} /></div>
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

export function RequireOwner({ children }) {
  const { isOwner, loading, user } = useAuth();
  if (loading || !user) return <RequireTeam>{children}</RequireTeam>;
  if (!isOwner) return (
    <main className="page narrow">
      <Empty title="Owner only">
        <p>Only the site owner can add or change journal entries and films. You can still use Backlot with the team.</p>
        <Link to="/studio/backlot" className="btn gold">Open Backlot</Link>
      </Empty>
    </main>
  );
  return children;
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

/* Cloudflare Turnstile "are you human" check. Calls onToken(token) when passed, onToken(null) when it expires.
   Renders nothing when no site key is set (demo mode or before sign-ups are turned on). */
let turnstileLoad;
const loadTurnstile = () =>
  (turnstileLoad ||= new Promise((res, rej) => {
    if (window.turnstile) return res(window.turnstile);
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.onload = () => res(window.turnstile);
    s.onerror = () => { turnstileLoad = null; rej(new Error("The human check couldn't load. Check your connection and reload.")); };
    document.head.appendChild(s);
  }));

export function HumanCheck({ siteKey, onToken, resetKey = 0 }) {
  const box = useRef(null);
  const [err, setErr] = useState(null);
  useEffect(() => {
    if (!siteKey) return;
    let id = null, alive = true;
    onToken(null);
    loadTurnstile().then((ts) => {
      if (!alive || !box.current) return;
      id = ts.render(box.current, {
        sitekey: siteKey, theme: "dark", action: "signin",
        callback: (t) => onToken(t),
        "expired-callback": () => onToken(null),
        "error-callback": () => onToken(null),
      });
    }, setErr);
    return () => { alive = false; if (id != null && window.turnstile) window.turnstile.remove(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey, resetKey]);
  if (!siteKey) return null;
  return (<div className="human-check"><div ref={box} /><ErrorNote error={err} /></div>);
}
