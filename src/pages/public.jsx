import { useEffect, useRef, useState } from "react";
import { api, DEMO, CAPTCHA_KEY, SIGNUPS } from "../lib/backend.js";
import { useAuth } from "../lib/auth.jsx";
import { Link, useRouter } from "../lib/router.jsx";
import { renderMarkdown, readingTime } from "../lib/markdown.js";
import { asset, fmtDate, fmtRuntime } from "../lib/format.js";
import { FilmCard, PostCard, RunningStrip, Empty, Loading, ErrorNote, useLoad, HumanCheck, toast } from "../components/ui.jsx";

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

      <RunningStrip films={f} posts={p} />

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

/* Where to go after signing in (for example, back to an invite link). */
const readNext = () => { try { const n = sessionStorage.getItem("olm.next"); return n && n.startsWith("/") ? n : "/studio"; } catch { return "/studio"; } };
export const setNext = (n) => { try { sessionStorage.setItem("olm.next", n); } catch {} };
const clearNext = () => { try { sessionStorage.removeItem("olm.next"); } catch {} };

export function Login() {
  const { user } = useAuth();
  const { navigate, path } = useRouter();
  const read = () => { try { return localStorage.getItem("olm.lastEmail") || ""; } catch { return ""; } };
  const wantSignup = SIGNUPS && /[?&]new=1/.test(typeof location !== "undefined" ? location.search + location.hash : "");
  const [remembered, setRemembered] = useState(read);
  const [email, setEmail] = useState(read);
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [mode, setMode] = useState(() => (wantSignup ? "signup" : read() ? "pin" : "link"));
  const [state, setState] = useState({ busy: false, sent: false, error: null });
  const [captcha, setCaptcha] = useState(null);
  const [resetKey, setResetKey] = useState(0);
  useEffect(() => { if (user) { const n = readNext(); clearNext(); navigate(n, { replace: true }); } }, [user, navigate]);
  const remember = (v) => { try { localStorage.setItem("olm.lastEmail", v); } catch {} };
  const needCaptcha = !!CAPTCHA_KEY && !DEMO;
  const switchTo = (m) => { setMode(m); setState({ busy: false, sent: false, error: null }); setResetKey((k) => k + 1); };
  const fail = (error) => { setState({ busy: false, sent: false, error }); setResetKey((k) => k + 1); };

  const sendLink = async (e, create = false) => {
    e && e.preventDefault();
    if (needCaptcha && !captcha) return fail(new Error("Please finish the human check first."));
    if (create && !name.trim()) return fail(new Error("Add your name so your team knows who you are."));
    setState({ busy: true, sent: false, error: null });
    remember(email.trim());
    try {
      const r = await api.signIn(email.trim(), { captcha, create, name: name.trim(), next: readNext() });
      setState({ busy: false, sent: !(r && r.instant), error: null, created: create });
    } catch (error) { fail(error); }
  };
  const pinIn = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pin)) return fail(new Error("Your PIN is 6 numbers."));
    if (needCaptcha && !captcha) return fail(new Error("Please finish the human check first."));
    setState({ busy: true, sent: false, error: null });
    remember(email.trim());
    try { await api.signInWithPin(email.trim(), pin, captcha); setState({ busy: false, sent: false, error: null }); }
    catch (error) { setPin(""); fail(error); }
  };
  const forget = () => { setEmail(""); setPin(""); setRemembered(""); switchTo("link"); try { localStorage.removeItem("olm.lastEmail"); } catch {} };
  const check = <HumanCheck siteKey={needCaptcha ? CAPTCHA_KEY : ""} onToken={setCaptcha} resetKey={resetKey} />;

  return (
    <main className="page narrow">
      <header className="page-head">
        <p className="eyebrow">{mode === "signup" ? "Backlot" : SIGNUPS ? "Studio & Backlot" : "Team only"}</p>
        <h1>{mode === "signup" ? "Create your account" : "Sign in to the Studio"}</h1>
        {mode === "signup" && <p className="lede">Free for filmmakers. Write screenplays, build storyboards and call sheets, and work live with your own team. Only people you invite can see your projects.</p>}
      </header>
      {state.sent ? (
        <div className="card fm">
          <p style={{ margin: 0 }}>Check <strong>{email}</strong> for {state.created ? "a link to confirm your email" : "a sign-in link"}. It opens the Studio in this browser.</p>
          <p className="hint">After you're in, set a 6-digit PIN in the Studio. Next time you can sign in with your email and PIN, with no email needed.</p>
          <button className="linkish" style={{ justifySelf: "start" }} onClick={() => switchTo(mode)}>Back</button>
        </div>
      ) : mode === "pin" ? (
        <form className="card fm" onSubmit={pinIn}>
          {remembered && email === remembered && <p className="hint">Welcome back.</p>}
          <label htmlFor="login-email">Email</label>
          <input id="login-email" className="input" type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
          <label htmlFor="login-pin">6-digit PIN</label>
          <input id="login-pin" className="input pin-input" type="password" inputMode="numeric" autoComplete="current-password" pattern="\d{6}" maxLength={6} required autoFocus={!!email}
            value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="••••••" />
          {check}
          <ErrorNote error={state.error} />
          <button className="btn gold" disabled={state.busy || pin.length !== 6 || (needCaptcha && !captcha)}>{state.busy ? "Signing in…" : "Sign in"}</button>
          <div className="login-alt">
            <button type="button" className="linkish" onClick={() => switchTo("link")}>Forgot your PIN or first time here? Email me a link</button>
            {remembered && <button type="button" className="linkish" onClick={forget}>Not you? Use a different email</button>}
            {SIGNUPS && <button type="button" className="linkish" onClick={() => switchTo("signup")}>New here? Create an account</button>}
          </div>
        </form>
      ) : mode === "signup" ? (
        <form className="card fm" onSubmit={(e) => sendLink(e, true)}>
          <label htmlFor="su-name">Your name</label>
          <input id="su-name" className="input" required autoComplete="name" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} placeholder="How your team will see you" />
          <label htmlFor="su-email">Email</label>
          <input id="su-email" className="input" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
          {check}
          <ErrorNote error={state.error} />
          <button className="btn gold" disabled={state.busy || (needCaptcha && !captcha)}>{state.busy ? "Sending…" : "Create account"}</button>
          <p className="hint">We'll email you a link to confirm it's really you. No password needed: you'll pick a 6-digit PIN after.</p>
          <div className="login-alt">
            <button type="button" className="linkish" onClick={() => switchTo(remembered ? "pin" : "link")}>Already have an account? Sign in</button>
          </div>
        </form>
      ) : (
        <form className="card fm" onSubmit={sendLink}>
          <label htmlFor="login-email">Email</label>
          <input id="login-email" className="input" type="email" required autoComplete="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
          {check}
          <ErrorNote error={state.error} />
          <button className="btn gold" disabled={state.busy || (needCaptcha && !captcha)}>{state.busy ? "Sending…" : DEMO ? "Enter the Studio (demo)" : "Email me a sign-in link"}</button>
          <div className="login-alt">
            <button type="button" className="linkish" onClick={() => switchTo("pin")}>Already set a PIN? Sign in with it</button>
            {SIGNUPS && <button type="button" className="linkish" onClick={() => switchTo("signup")}>New here? Create an account</button>}
          </div>
          <p className="hint">{DEMO ? "Demo mode: any email works and nothing leaves this browser." : SIGNUPS ? "Sign in with the email you signed up with." : "Only people the site owner has invited can sign in."}</p>
        </form>
      )}
    </main>
  );
}

/* Invite links: /join/<token> */
export function Join({ token }) {
  const { user, loading } = useAuth();
  const { navigate } = useRouter();
  const info = useLoad(() => (user ? api.teams.inviteInfo(token) : Promise.resolve(null)), [user && user.id, token]);
  const [state, setState] = useState({ busy: false, error: null });
  const join = async () => {
    setState({ busy: true, error: null });
    try { const ws = await api.teams.join(token); toast("You're on the team."); navigate("/studio/backlot/" + ws); }
    catch (error) { setState({ busy: false, error }); }
  };
  const go = (signup) => { setNext("/join/" + token); navigate(signup ? "/login?new=1" : "/login"); };
  if (loading) return <main className="page narrow"><Loading /></main>;
  return (
    <main className="page narrow">
      <header className="page-head">
        <p className="eyebrow">Backlot invite</p>
        <h1>{user && info.data ? `Join ${info.data.team_name}` : "You're invited to a Backlot team"}</h1>
        <p className="lede">Backlot is where the team writes the screenplay, builds the storyboard and plans call sheets together, live.</p>
      </header>
      <div className="card fm">
        {!user ? (<>
          <p style={{ margin: 0 }}>Sign in or create a free account to join.</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {SIGNUPS && <button className="btn gold" onClick={() => go(true)}>Create account</button>}
            <button className={"btn" + (SIGNUPS ? "" : " gold")} onClick={() => go(false)}>Sign in</button>
          </div>
        </>) : info.loading ? <Loading /> : info.error ? <ErrorNote error={info.error} /> : !info.data || !info.data.valid ? (
          <p style={{ margin: 0 }}>This invite link has expired or was turned off. Ask the person who sent it for a new one.</p>
        ) : info.data.already_member ? (<>
          <p style={{ margin: 0 }}>You're already on <strong>{info.data.team_name}</strong>.</p>
          <button className="btn gold" style={{ justifySelf: "start" }} onClick={join}>Open Backlot</button>
        </>) : (<>
          <p style={{ margin: 0 }}>Signed in as {user.email}. Join <strong>{info.data.team_name}</strong> to see and work on its projects.</p>
          <ErrorNote error={state.error} />
          <button className="btn gold" style={{ justifySelf: "start" }} disabled={state.busy} onClick={join}>{state.busy ? "Joining…" : "Join team"}</button>
        </>)}
      </div>
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
