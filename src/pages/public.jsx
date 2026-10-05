import { useEffect, useRef, useState } from "react";
import { api, DEMO } from "../lib/backend.js";
import { useAuth } from "../lib/auth.jsx";
import { Link, useRouter } from "../lib/router.jsx";
import { renderMarkdown, readingTime } from "../lib/markdown.js";
import { asset, fmtDate, fmtRuntime } from "../lib/format.js";
import { FilmCard, PostCard, RunningStrip, Empty, Loading, ErrorNote, useLoad } from "../components/ui.jsx";

export function Home() {
  const { isOwner: user } = useAuth();
  const films = useLoad(() => api.listFilms(), []);
  const posts = useLoad(() => api.listPosts(), []);
  const f = films.data || [];
  const p = posts.data || [];
  return (
    <main>
      <section className="hero">
        <div className="hero-beam" aria-hidden="true" />
        <img className="hero-logo" src={asset("logo.png")} alt="Once Lost Media" />
        <p className="hero-line">Stories worth finding, told on film.</p>
        <div className="hero-cta">
          <Link to="/films" className="btn gold">Watch the films</Link>
          <Link to="/journal" className="btn ghost">Read the journal</Link>
        </div>
      </section>

      <RunningStrip films={f} />

      <section className="band">
        <div className="band-head">
          <h2>Now showing</h2>
          {f.length > 3 && <Link to="/films" className="see-all">All films →</Link>}
        </div>
        {films.loading ? <Loading /> : films.error ? <ErrorNote error={films.error} /> : f.length ? (
          <div className="film-grid">{f.slice(0, 6).map((x) => <FilmCard key={x.id} film={x} />)}</div>
        ) : (
          <Empty title="The first film is on its way">
            <p>{user ? "Upload a film from the Studio and it will play here." : "Check back soon."}</p>
            {user && <Link to="/studio/film/new" className="btn gold">Upload a film</Link>}
          </Empty>
        )}
      </section>

      <section className="band">
        <div className="band-head">
          <h2>From the journal</h2>
          {p.length > 3 && <Link to="/journal" className="see-all">All entries →</Link>}
        </div>
        {posts.loading ? <Loading /> : posts.error ? <ErrorNote error={posts.error} /> : p.length ? (
          <div className="post-grid">{p.slice(0, 3).map((x, i) => <PostCard key={x.id} post={x} big={i === 0} />)}</div>
        ) : (
          <Empty title="No journal entries yet">
            <p>{user ? "Write the first entry from the Studio." : "Behind-the-scenes notes are coming."}</p>
            {user && <Link to="/studio/post/new" className="btn gold">Write an entry</Link>}
          </Empty>
        )}
      </section>
    </main>
  );
}

export function Films() {
  const films = useLoad(() => api.listFilms(), []);
  return (
    <main className="page">
      <header className="page-head">
        <p className="eyebrow">The collection</p>
        <h1>Films</h1>
      </header>
      {films.loading ? <Loading /> : films.error ? <ErrorNote error={films.error} /> : films.data.length ? (
        <div className="film-grid">{films.data.map((x) => <FilmCard key={x.id} film={x} />)}</div>
      ) : <Empty title="No films yet"><p>New work will screen here.</p></Empty>}
    </main>
  );
}

export function Watch({ id }) {
  const film = useLoad(() => api.getFilm(id), [id]);
  const more = useLoad(() => api.listFilms(), []);
  const [broken, setBroken] = useState(false);
  const vid = useRef(null);
  useEffect(() => setBroken(false), [id]);
  useEffect(() => {
    if (film.data) document.title = film.data.title + " · Once Lost Media";
    return () => { document.title = "Once Lost Media"; };
  }, [film.data]);
  if (film.loading) return <main className="page"><Loading /></main>;
  if (film.error) return <main className="page"><ErrorNote error={film.error} /></main>;
  const f = film.data;
  if (!f) return <NotFound what="film" />;
  const others = (more.data || []).filter((x) => x.id !== f.id).slice(0, 3);
  return (
    <main className="watch">
      <div className="screen">
        {broken ? (
          <div className="screen-msg">
            <p>{DEMO ? "Demo uploads only play until the page reloads. Connect Supabase to keep films." : "This film couldn't be loaded. Try again in a moment."}</p>
          </div>
        ) : (
          <video ref={vid} key={f.id} src={f.video_url} poster={f.poster_url || undefined} controls playsInline preload="metadata" onError={() => setBroken(true)} controlsList="nodownload" />
        )}
      </div>
      <div className="watch-info">
        <div>
          {!f.published && <span className="pill draft">Draft · only the team can see this</span>}
          <h1>{f.title}</h1>
          <p className="meta">{[f.year, fmtRuntime(f.runtime)].filter(Boolean).join(" · ")}</p>
        </div>
        {f.description && <div className="prose small" dangerouslySetInnerHTML={{ __html: renderMarkdown(f.description) }} />}
      </div>
      {others.length > 0 && (
        <section className="band">
          <div className="band-head"><h2>More from Once Lost Media</h2></div>
          <div className="film-grid">{others.map((x) => <FilmCard key={x.id} film={x} />)}</div>
        </section>
      )}
    </main>
  );
}

export function Journal() {
  const posts = useLoad(() => api.listPosts(), []);
  return (
    <main className="page">
      <header className="page-head">
        <p className="eyebrow">Notes from the set</p>
        <h1>Journal</h1>
      </header>
      {posts.loading ? <Loading /> : posts.error ? <ErrorNote error={posts.error} /> : posts.data.length ? (
        <div className="post-list">{posts.data.map((x) => <PostCard key={x.id} post={x} />)}</div>
      ) : <Empty title="No entries yet"><p>The first entry is being written.</p></Empty>}
    </main>
  );
}

export function Post({ slug }) {
  const { user, isOwner } = useAuth();
  const post = useLoad(() => api.getPost({ slug }), [slug]);
  useEffect(() => {
    if (post.data) document.title = post.data.title + " · Once Lost Media";
    return () => { document.title = "Once Lost Media"; };
  }, [post.data]);
  if (post.loading) return <main className="page"><Loading /></main>;
  if (post.error) return <main className="page"><ErrorNote error={post.error} /></main>;
  const p = post.data;
  if (!p || (!p.published && !user)) return <NotFound what="journal entry" />;
  return (
    <main className="article">
      {p.cover_url && <div className="article-cover"><img src={p.cover_url} alt="" /></div>}
      <header className="article-head">
        {!p.published && <span className="pill draft">Draft</span>}
        <h1>{p.title}</h1>
        <p className="meta">
          {fmtDate(p.created_at)} · {readingTime(p.body)} min read{p.author_name ? ` · ${p.author_name}` : ""}
          {isOwner && <> · <Link to={`/studio/post/${p.id}`}>Edit</Link></>}
        </p>
      </header>
      <div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(p.body) }} />
      <p className="article-back"><Link to="/journal">← Back to the journal</Link></p>
    </main>
  );
}

export function Login() {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const read = () => { try { return localStorage.getItem("olm.lastEmail") || ""; } catch { return ""; } };
  const [remembered, setRemembered] = useState(read);
  const [email, setEmail] = useState(read);
  const [pin, setPin] = useState("");
  const [mode, setMode] = useState(() => (read() ? "pin" : "link"));
  const [state, setState] = useState({ busy: false, sent: false, error: null });
  useEffect(() => { if (user) navigate("/studio", { replace: true }); }, [user, navigate]);
  const remember = (v) => { try { localStorage.setItem("olm.lastEmail", v); } catch {} };

  const sendLink = async (e) => {
    e && e.preventDefault();
    setState({ busy: true, sent: false, error: null });
    remember(email.trim());
    try {
      const r = await api.signIn(email.trim());
      setState({ busy: false, sent: !(r && r.instant), error: null });
    } catch (error) {
      setState({ busy: false, sent: false, error });
    }
  };
  const pinIn = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pin)) { setState({ busy: false, sent: false, error: new Error("Your PIN is 6 numbers.") }); return; }
    setState({ busy: true, sent: false, error: null });
    remember(email.trim());
    try { await api.signInWithPin(email.trim(), pin); setState({ busy: false, sent: false, error: null }); }
    catch (error) { setPin(""); setState({ busy: false, sent: false, error }); }
  };
  const forget = () => { setEmail(""); setPin(""); setRemembered(""); setMode("link"); try { localStorage.removeItem("olm.lastEmail"); } catch {} };

  return (
    <main className="page narrow">
      <header className="page-head">
        <p className="eyebrow">Team only</p>
        <h1>Sign in to the Studio</h1>
      </header>
      {state.sent ? (
        <div className="card fm">
          <p style={{ margin: 0 }}>Check <strong>{email}</strong> for a sign-in link. It opens the Studio in this browser.</p>
          <p className="hint">After you're in, set a 6-digit PIN in the Studio. Next time you can sign in with your email and PIN, with no email needed.</p>
          <button className="linkish" style={{ justifySelf: "start" }} onClick={() => setState({ busy: false, sent: false, error: null })}>Back</button>
        </div>
      ) : mode === "pin" ? (
        <form className="card fm" onSubmit={pinIn}>
          {remembered && email === remembered && <p className="hint">Welcome back.</p>}
          <label htmlFor="login-email">Work email</label>
          <input id="login-email" className="input" type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@oncelostmedia.com" />
          <label htmlFor="login-pin">6-digit PIN</label>
          <input id="login-pin" className="input pin-input" type="password" inputMode="numeric" autoComplete="current-password" pattern="\d{6}" maxLength={6} required autoFocus={!!email}
            value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="••••••" />
          <ErrorNote error={state.error} />
          <button className="btn gold" disabled={state.busy || pin.length !== 6}>{state.busy ? "Signing in…" : "Sign in"}</button>
          <div className="login-alt">
            <button type="button" className="linkish" onClick={() => { setMode("link"); setState({ busy: false, sent: false, error: null }); }}>Forgot your PIN or first time here? Email me a link</button>
            {remembered && <button type="button" className="linkish" onClick={forget}>Not you? Use a different email</button>}
          </div>
        </form>
      ) : (
        <form className="card fm" onSubmit={sendLink}>
          <label htmlFor="login-email">Work email</label>
          <input id="login-email" className="input" type="email" required autoComplete="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@oncelostmedia.com" />
          <ErrorNote error={state.error} />
          <button className="btn gold" disabled={state.busy}>{state.busy ? "Sending…" : DEMO ? "Enter the Studio (demo)" : "Email me a sign-in link"}</button>
          <div className="login-alt">
            <button type="button" className="linkish" onClick={() => { setMode("pin"); setState({ busy: false, sent: false, error: null }); }}>Already set a PIN? Sign in with it</button>
          </div>
          <p className="hint">{DEMO ? "Demo mode: any email works and nothing leaves this browser." : "Only people the site owner has invited can sign in."}</p>
        </form>
      )}
    </main>
  );
}

export function NotFound({ what = "page" }) {
  return (
    <main className="page narrow">
      <Empty title={`This ${what} was lost`}>
        <p>It may have moved or been taken down.</p>
        <Link to="/" className="btn gold">Back to the start</Link>
      </Empty>
    </main>
  );
}
