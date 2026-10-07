import { useEffect, useRef, useState } from "react";
import { api, DEMO, CAPTCHA_KEY, SIGNUPS } from "../lib/backend.js";
import { useAuth } from "../lib/auth.jsx";
import { Link, useRouter } from "../lib/router.jsx";
import { renderMarkdown, readingTime } from "../lib/markdown.js";
import { asset, fmtDate, fmtRuntime } from "../lib/format.js";
import { FilmCard, PostCard, RunningStrip, Empty, Loading, ErrorNote, useLoad, HumanCheck, toast, ConfirmButton } from "../components/ui.jsx";

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

export function BibleStudy() {
  const studies = useLoad(() => api.listStudies(), []);
  useEffect(() => { document.title = "Bible Study · Once Lost Media"; return () => { document.title = "Once Lost Media"; }; }, []);
  return (
    <main className="page">
      <header className="page-head study-head">
        <p className="eyebrow">Open the Word together</p>
        <h1>Bible Study</h1>
        <p className="lede">Studies, reflections and conversation about faith, storytelling and the God who goes looking for the lost. Everyone is welcome, wherever you are on the journey.</p>
      </header>
      {studies.loading ? <Loading /> : studies.error ? <ErrorNote error={studies.error} /> : studies.data.length ? (
        <div className="post-list">{studies.data.map((x) => (
          <PostCard key={x.id} post={x} base="/bible-study" kicker={[x.scripture, x.comments ? `${x.comments} comment${x.comments === 1 ? "" : "s"}` : ""].filter(Boolean).join(" · ") || fmtDate(x.created_at)} more="Open the study →" />
        ))}</div>
      ) : <Empty title="The first study is coming soon"><p>Check back soon, and bring a friend.</p></Empty>}
    </main>
  );
}

export function Study({ slug }) {
  const { user, isOwner } = useAuth();
  const study = useLoad(() => api.getStudy({ slug }), [slug]);
  useEffect(() => {
    if (study.data) document.title = study.data.title + " · Bible Study · Once Lost Media";
    return () => { document.title = "Once Lost Media"; };
  }, [study.data]);
  if (study.loading) return <main className="page"><Loading /></main>;
  if (study.error) return <main className="page"><ErrorNote error={study.error} /></main>;
  const s = study.data;
  if (!s || (!s.published && !isOwner)) return <NotFound what="study" />;
  const questions = (s.questions || "").split("\n").map((q) => q.replace(/^\s*(\d+[.)]|[-*•])\s*/, "").trim()).filter(Boolean);
  return (
    <main className="article">
      {s.cover_url && <div className="article-cover"><img src={s.cover_url} alt="" /></div>}
      <header className="article-head">
        {!s.published && <span className="pill draft">Draft</span>}
        <p className="eyebrow"><Link to="/bible-study">Bible Study</Link></p>
        <h1>{s.title}</h1>
        {s.scripture && <p className="study-ref">{s.scripture}</p>}
        <p className="meta">
          {fmtDate(s.created_at)}{s.author_name ? ` · ${s.author_name}` : ""}
          {isOwner && <> · <Link to={`/studio/study/${s.id}`}>Edit</Link></>}
        </p>
      </header>
      <div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(s.body) }} />
      {questions.length > 0 && (
        <section className="study-qs">
          <h2>Questions for reflection</h2>
          <ol>{questions.map((q, i) => <li key={i}>{q}</li>)}</ol>
          {s.comments_open && <p className="hint">Share your thoughts on any of these below.</p>}
        </section>
      )}
      {s.published && <Comments study={s} user={user} isOwner={isOwner} />}
      <p className="article-back"><Link to="/bible-study">← All studies</Link></p>
    </main>
  );
}

function Comments({ study, user, isOwner }) {
  const { navigate, path } = useRouter();
  const [tick, setTick] = useState(0);
  const list = useLoad(() => api.comments.list(study.id), [study.id, tick]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const rows = list.data || [];
  const shown = rows.filter((c) => !c.hidden || isOwner || (user && c.user_id === user.id));
  const visible = rows.filter((c) => !c.hidden).length;
  const post = async (e) => {
    e.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true);
    try { await api.comments.add(study.id, text); setText(""); setTick((t) => t + 1); toast("Comment posted."); }
    catch (err) { toast(err.message); }
    setBusy(false);
  };
  const act = async (fn, msg) => { try { await fn(); toast(msg); setTick((t) => t + 1); } catch (err) { toast(err.message); } };
  const goSign = (signup) => { setNext(path); navigate(signup && SIGNUPS ? "/login?new=1" : "/login"); };
  return (
    <section className="comments" id="comments">
      <h2>Conversation{visible ? <span className="c-count">{visible}</span> : null}</h2>
      {list.loading ? <Loading /> : list.error ? <ErrorNote error={list.error} /> : shown.length ? (
        <ul className="c-list">
          {shown.map((c) => {
            const mine = user && c.user_id === user.id;
            return (
              <li key={c.id} className={"c-item" + (c.hidden ? " is-hidden" : "")}>
                <span className="c-av" aria-hidden="true">{(c.author_name || "?").trim().charAt(0).toUpperCase()}</span>
                <div className="c-main">
                  <div className="c-top">
                    <strong>{c.author_name || "Friend"}</strong>
                    <time>{fmtDate(c.created_at)}</time>
                    {c.hidden && <span className="pill draft">Hidden</span>}
                  </div>
                  <p className="c-body">{c.body}</p>
                  {(mine || isOwner) && (
                    <div className="c-acts">
                      {isOwner && <button className="linkish" onClick={() => act(() => api.comments.setHidden(c.id, !c.hidden), c.hidden ? "Comment shown." : "Comment hidden.")}>{c.hidden ? "Show" : "Hide"}</button>}
                      <ConfirmButton className="linkish" confirm="Delete for good?" onConfirm={() => act(() => api.comments.remove(c.id), "Comment deleted.")}>Delete</ConfirmButton>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : <p className="muted">No comments yet. Be the first to share a thought.</p>}

      {!study.comments_open ? <p className="hint">Comments are closed on this study.</p> : user ? (
        <form className="c-form" onSubmit={post}>
          <label htmlFor="c-text" className="sr">Your comment</label>
          <textarea id="c-text" className="input" rows="4" maxLength={2000} value={text} onChange={(e) => setText(e.target.value)} placeholder="Share what stood out to you, a question, or a prayer request." />
          <div className="c-form-foot">
            <span className="hint">Be kind. Comments show your name. {text.length > 1800 ? `${2000 - text.length} characters left.` : ""}</span>
            <button className="btn gold" disabled={busy || !text.trim()}>{busy ? "Posting…" : "Post comment"}</button>
          </div>
        </form>
      ) : (
        <div className="c-signin card">
          <p><strong>Join the conversation.</strong> Sign in or create a free account to comment.</p>
          <div className="hero-cta" style={{ justifyContent: "flex-start" }}>
            {SIGNUPS && <button className="btn gold" onClick={() => goSign(true)}>Create free account</button>}
            <button className={"btn " + (SIGNUPS ? "ghost" : "gold")} onClick={() => goSign(false)}>Sign in</button>
          </div>
        </div>
      )}
    </section>
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

/* Public page anyone can see: /backlot */
export function BacklotLanding() {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const start = () => {
    if (user) return navigate("/studio/backlot");
    setNext("/studio/backlot");
    navigate(SIGNUPS ? "/login?new=1" : "/login");
  };
  useEffect(() => { document.title = "Backlot · Once Lost Media"; return () => { document.title = "Once Lost Media"; }; }, []);
  const cta = user ? "Open Backlot" : SIGNUPS ? "Sign up free" : "Sign in";
  return (
    <main className="bl-landing">
      <section className="bl-hero">
        <div className="hero-beam" aria-hidden="true" />
        <div className="bl-hero-copy">
          <p className="eyebrow">Backlot by Once Lost Media</p>
          <h1>Make the movie together.</h1>
          <p className="bl-lede">Write the screenplay, build the characters, draw the storyboard and send call sheets, all in one place, live with your whole crew. Free.</p>
          <div className="hero-cta" style={{ justifyContent: "flex-start" }}>
            <button className="btn gold" onClick={start}>{cta}</button>
            {!user && SIGNUPS && <button className="btn ghost" onClick={() => { setNext("/studio/backlot"); navigate("/login"); }}>I have an account</button>}
          </div>
          {!user && !SIGNUPS && <p className="hint">New accounts are opening soon. Already on a team? Sign in.</p>}
        </div>
        <div className="bl-page" aria-hidden="true">
          <div className="bl-page-bar"><span>Script</span><span>Characters</span><span>Storyboard</span><span>Call sheets</span><i /><i /><i /></div>
          <div className="bl-sheet">
            <p className="sh">INT. DINER - NIGHT</p>
            <p>Rain on the windows. A neon sign buzzes, half the letters dead.</p>
            <p className="ch">MARGO</p>
            <p className="dl">You've been nursing that coffee for an hour.</p>
            <p className="ch">DEV</p>
            <p className="pa">(quietly)</p>
            <p className="dl">I'm waiting for someone.</p>
            <span className="cursor-tag">Sam is editing</span>
          </div>
        </div>
      </section>

      <section className="band">
        <div className="bl-grid">
          <article className="card bl-feat"><span className="bl-num">01</span><h3>Screenplay</h3><p>Proper screenplay format as you type. Enter and Tab handle the formatting, with page counts, scene numbers and print-ready PDFs.</p></article>
          <article className="card bl-feat"><span className="bl-num">02</span><h3>Characters</h3><p>Every speaking character gets a sheet automatically: backstory, wardrobe, casting and every scene they're in.</p></article>
          <article className="card bl-feat"><span className="bl-num">03</span><h3>Storyboard</h3><p>Draw or upload frames for every shot, with lens, angle, movement and notes, organized by scene.</p></article>
          <article className="card bl-feat"><span className="bl-num">04</span><h3>Call sheets</h3><p>Pick the day's scenes and Backlot fills in the cast and page counts. Set call times, then copy it to your group chat.</p></article>
        </div>
      </section>

      <section className="band">
        <div className="band-head"><h2>How it works</h2></div>
        <ol className="bl-steps">
          <li><b>Create a free account</b><span>Just your name and email. Pick a 6-digit PIN to sign in after that.</span></li>
          <li><b>Start a team</b><span>Give it your production's name. You can run up to 3 teams.</span></li>
          <li><b>Send your crew the invite link</b><span>They join in one click. Everyone sees changes live, and two people never edit the same scene at once.</span></li>
        </ol>
      </section>

      <section className="band">
        <div className="card bl-private">
          <h2>Your project stays yours</h2>
          <p>Only people on your team can see your script, storyboards and call sheets. Not other teams, and not the public. You can remove people or turn off an invite link at any time, and version history lets you roll back any change.</p>
          <button className="btn gold" style={{ justifySelf: "start" }} onClick={start}>{cta}</button>
        </div>
      </section>
    </main>
  );
}

export function About() {
  useEffect(() => { document.title = "About · Once Lost Media"; return () => { document.title = "Once Lost Media"; }; }, []);
  return (
    <main className="about">
      <section className="about-hero">
        <div className="hero-beam" aria-hidden="true" />
        <p className="eyebrow">About Once Lost Media</p>
        <h1>I once was lost,<br />but now am found.</h1>
        <p className="about-lede">We make movies that move you. Stories that make you laugh, hold your breath and cheer, and leave you feeling the love of God long after the credits roll.</p>
      </section>

      <section className="band">
        <div className="about-faith">
          <span className="about-cross" aria-hidden="true" />
          <div>
            <p className="eyebrow">Who we are</p>
            <h2>An independent film studio, and followers of Christ.</h2>
            <p>Our faith is the reason we're here. We believe the greatest story ever told is a love story, God's love for every one of us, and every film we make is a chance to share a little of it. It shapes what we make, how we treat our cast and crew, and the kind of studio we want to be.</p>
          </div>
        </div>
      </section>

      <section className="band">
        <div className="band-head"><h2>What we make</h2></div>
        <p className="about-text">Short films, feature films and documentaries made to entertain, full of heart, humor, adventure and hope. Stories you'll want to watch again and share with the people you love, with the love of God woven through every one.</p>
        <div className="about-make">
          <article className="card"><span className="bl-num">01</span><h3>Short films</h3><p>Big stories in small packages, with heart in every frame.</p></article>
          <article className="card"><span className="bl-num">02</span><h3>Feature films</h3><p>Dramas, comedies and adventures with room for the story to breathe.</p></article>
          <article className="card"><span className="bl-num">03</span><h3>Documentaries</h3><p>Real people and real faith, told with heart.</p></article>
        </div>
      </section>

      <section className="band">
        <div className="band-head"><h2>Built for filmmakers</h2></div>
        <p className="about-text">A great film starts long before the camera rolls, with a script rewritten until it's right, a shot list that knows what it's chasing and a crew on the same page. So we built the tools we wanted for ourselves, and we share them.</p>
        <div className="about-make">
          <Link to="/backlot" className="card about-link">
            <h3>Backlot</h3>
            <p>Where we make our movies: screenplay, storyboard, call sheets and characters, all in one place and all live. Now any filmmaker can plan their project with their own team.</p>
            <span className="see-all">Try Backlot →</span>
          </Link>
          <Link to="/journal" className="card about-link">
            <h3>The Journal</h3>
            <p>What we learn on set and in the edit, from lighting and lenses to cameras and craft. No gatekeeping, no fluff, just what works.</p>
            <span className="see-all">Read the journal →</span>
          </Link>
          <Link to="/bible-study" className="card about-link">
            <h3>Bible Study</h3>
            <p>Where we open the Word together, with studies and conversations about faith, storytelling and the God who goes looking for the lost. Everyone is welcome.</p>
            <span className="see-all">Join the study →</span>
          </Link>
        </div>
      </section>

      <section className="band">
        <div className="about-close">
          <p>We're here to make films that matter, help others make theirs, and give God the glory for every frame.</p>
          <p className="about-tag">Stories worth finding, told on film.</p>
          <div className="hero-cta">
            <Link to="/films" className="btn gold">Watch the films</Link>
            <Link to="/journal" className="btn ghost">Read the journal</Link>
          </div>
        </div>
      </section>
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
