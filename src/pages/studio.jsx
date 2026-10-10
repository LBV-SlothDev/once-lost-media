import { useEffect, useRef, useState } from "react";
import { api, DEMO, slugify, posterFromVideo, logVisit } from "../lib/backend.js";
import { useAuth } from "../lib/auth.jsx";
import { Link, useRouter } from "../lib/router.jsx";
import { renderMarkdown } from "../lib/markdown.js";
import { fmtDate, fmtBytes } from "../lib/format.js";
import { Loading, ErrorNote, useLoad, toast, ConfirmButton, Empty } from "../components/ui.jsx";
import { mountBacklot } from "../backlot/backlot.js";

/* ---------------- Visitor counts (owner only) ---------------- */
function StatsCard() {
  const s = useLoad(() => api.siteStats(), []);
  const n = (v) => (v == null ? "–" : Number(v).toLocaleString());
  const row = (label, d, note) => (
    <div className="stat-row">
      <h3>{label}</h3>
      <div className="stat-nums">
        <div><b>{n(d[0])}</b><span>Today</span></div>
        <div><b>{n(d[1])}</b><span>7 days</span></div>
        <div><b>{n(d[2])}</b><span>30 days</span></div>
        <div><b>{n(d[3])}</b><span>{note}</span></div>
      </div>
    </div>
  );
  return (
    <section className="card stats-card">
      <div className="card-head"><h2>Who's here</h2><span className="hint">Only you can see this</span></div>
      {s.loading ? <Loading /> : s.error ? (
        <p className="muted">{/function|site_stats|schema cache/i.test(s.error.message || "") ? "Counts aren't switched on yet. Run supabase/stats.sql in Supabase to start counting." : s.error.message}</p>
      ) : (<>
        {row("People on the site", [s.data.site_today, s.data.site_7, s.data.site_30, s.data.site_all], "All time")}
        {row("People using Backlot", [s.data.backlot_today, s.data.backlot_7, s.data.backlot_30, s.data.backlot_all], "All time")}
        <p className="hint">{n(s.data.accounts)} accounts ({n(s.data.accounts_30)} new in 30 days) · {n(s.data.projects)} Backlot projects{s.data.since ? ` · Counting visitors since ${fmtDate(s.data.since + "T12:00:00")}` : " · Visitor counting just started"}. Your own visits aren't counted.</p>
      </>)}
    </section>
  );
}

/* ---------------- Dashboard ---------------- */
export function Studio() {
  const { user, isOwner } = useAuth();
  const { navigate } = useRouter();
  const [tick, setTick] = useState(0);
  const posts = useLoad(() => (isOwner ? api.listPosts({ drafts: true }) : Promise.resolve([])), [tick, isOwner]);
  const films = useLoad(() => (isOwner ? api.listFilms({ drafts: true }) : Promise.resolve([])), [tick, isOwner]);
  const studies = useLoad(() => (isOwner ? api.listStudies({ drafts: true }) : Promise.resolve([])), [tick, isOwner]);
  const [name, setName] = useState("");
  useEffect(() => { api.getProfile(user.id).then((p) => p && setName(p.display_name || "")); }, [user.id]);

  return (
    <main className="page wide">
      <header className="page-head row">
        <div>
          <p className="eyebrow">Studio</p>
          <h1>Welcome back{name ? `, ${name.split(" ")[0]}` : ""}</h1>
        </div>
        <div className="head-actions">
          <button className="btn ghost" onClick={async () => { await api.signOut(); navigate("/"); }}>Sign out</button>
        </div>
      </header>

      {!DEMO && user.user_metadata && user.user_metadata.must_change_pin && (
        <div className="notice">
          <strong>Choose your own PIN.</strong> You signed in with a temporary PIN from the site owner. Pick a new 6-digit PIN in the Sign-in PIN card below.
        </div>
      )}

      {!DEMO && !(user.user_metadata && user.user_metadata.has_pin) && (
        <div className="notice">
          <strong>Set your sign-in PIN.</strong> Choose a 6-digit PIN below. Next time, sign in with your email and PIN instead of waiting for an email.
        </div>
      )}

      {DEMO && (
        <div className="notice">
          <strong>Demo mode.</strong> Posts and films save in this browser only, and uploaded movies play until the page reloads. Follow the README to connect Supabase and go live.
        </div>
      )}

      {isOwner && <StatsCard />}

      <div className="studio-grid">
        {isOwner && (<>
        <section className="card">
          <div className="card-head"><h2>Journal</h2><Link to="/studio/post/new" className="btn gold sm">New entry</Link></div>
          {posts.loading ? <Loading /> : posts.error ? <ErrorNote error={posts.error} /> : posts.data.length ? (
            <ul className="rows">
              {posts.data.map((p) => (
                <li key={p.id}>
                  <div className="row-main">
                    <Link to={`/studio/post/${p.id}`} className="row-title">{p.title || "Untitled"}</Link>
                    <span className="row-sub">{fmtDate(p.created_at)}</span>
                  </div>
                  <span className={"pill " + (p.published ? "live" : "draft")}>{p.published ? "Published" : "Draft"}</span>
                  <ConfirmButton className="btn ghost sm" confirm="Delete?" onConfirm={async () => { try { await api.deletePost(p.id); toast("Entry deleted."); setTick((t) => t + 1); } catch (e) { toast(e.message); } }}>Delete</ConfirmButton>
                </li>
              ))}
            </ul>
          ) : <p className="muted">No entries yet. Write the first one.</p>}
        </section>

        <section className="card">
          <div className="card-head"><h2>Bible Study</h2><Link to="/studio/study/new" className="btn gold sm">New study</Link></div>
          {studies.loading ? <Loading /> : studies.error ? <ErrorNote error={studies.error} /> : studies.data.length ? (
            <ul className="rows">
              {studies.data.map((p) => (
                <li key={p.id}>
                  <div className="row-main">
                    <Link to={`/studio/study/${p.id}`} className="row-title">{p.title || "Untitled"}</Link>
                    <span className="row-sub">{[p.scripture, fmtDate(p.created_at), p.comments ? `${p.comments} comment${p.comments === 1 ? "" : "s"}` : ""].filter(Boolean).join(" · ")}</span>
                  </div>
                  <span className={"pill " + (p.published ? "live" : "draft")}>{p.published ? "Published" : "Draft"}</span>
                  <ConfirmButton className="btn ghost sm" confirm="Delete?" onConfirm={async () => { try { await api.deleteStudy(p.id); toast("Study deleted."); setTick((t) => t + 1); } catch (e) { toast(e.message); } }}>Delete</ConfirmButton>
                </li>
              ))}
            </ul>
          ) : <p className="muted">No studies yet. Write the first one.</p>}
        </section>

        <section className="card">
          <div className="card-head"><h2>Films</h2><Link to="/studio/film/new" className="btn gold sm">Upload film</Link></div>
          {films.loading ? <Loading /> : films.error ? <ErrorNote error={films.error} /> : films.data.length ? (
            <ul className="rows">
              {films.data.map((f) => (
                <li key={f.id}>
                  {f.poster_url ? <img className="row-thumb" src={f.poster_url} alt="" /> : <span className="row-thumb" />}
                  <div className="row-main">
                    <Link to={`/studio/film/${f.id}`} className="row-title">{f.title || "Untitled"}</Link>
                    <span className="row-sub">{[f.year, fmtDate(f.created_at)].filter(Boolean).join(" · ")}</span>
                  </div>
                  <span className={"pill " + (f.published ? "live" : "draft")}>{f.published ? "Published" : "Draft"}</span>
                  <ConfirmButton className="btn ghost sm" confirm="Delete film?" onConfirm={async () => { try { await api.deleteFilm(f); toast("Film deleted."); setTick((t) => t + 1); } catch (e) { toast(e.message); } }}>Delete</ConfirmButton>
                </li>
              ))}
            </ul>
          ) : <p className="muted">No films yet. Upload a movie file to start.</p>}
        </section>

        </>)}
        <TeamsCard me={user} />

        {!DEMO && (
          <section className="card">
            <div className="card-head"><h2>Your name</h2></div>
            <form className="fm inline" onSubmit={async (e) => { e.preventDefault(); try { await api.setDisplayName(user.id, name.trim()); toast("Name saved."); } catch (err) { toast(err.message); } }}>
              <label htmlFor="disp-name" className="sr">Display name</label>
              <input id="disp-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="How teammates see you" />
              <button className="btn">Save</button>
            </form>
            <p className="hint">Shown on journal entries and in Backlot. Signed in as {user.email}.</p>
          </section>
        )}

        {!DEMO && <PinCard user={user} />}

        {isOwner && <TeamCard me={user} />}
      </div>
    </main>
  );
}

const newPin = () => {
  const a = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(a);
    const p = String(a[0] % 1000000).padStart(6, "0");
    if (!/^(\d)\1{5}$/.test(p) && !"0123456789".includes(p) && !"9876543210".includes(p)) return p;
  }
};
const fmtSeen = (iso) => (iso ? "Last signed in " + fmtDate(iso) : "Hasn't signed in yet");

function TeamCard({ me }) {
  const [tick, setTick] = useState(0);
  const team = useLoad(() => api.team.list(), [tick]);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [given, setGiven] = useState(null); // { who, email, pin } shown once after add or reset

  const add = async (e) => {
    e.preventDefault(); setError(null); setGiven(null);
    const em = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return setError(new Error("Enter their email address."));
    const pin = newPin();
    setBusy(true);
    try {
      await api.team.add(em, name.trim(), pin);
      setGiven({ who: name.trim() || em, email: em, pin });
      setEmail(""); setName(""); setTick((t) => t + 1);
    } catch (err) { setError(err); }
    setBusy(false);
  };
  const reset = async (p) => {
    const pin = newPin();
    try { await api.team.resetPin(p.user_id, pin); setGiven({ who: p.display_name || p.email, email: p.email, pin, reset: true }); setTick((t) => t + 1); }
    catch (err) { toast(err.message); }
  };
  const remove = async (p) => {
    try { await api.team.remove(p.user_id); toast((p.display_name || p.email) + " was removed from the team."); setTick((t) => t + 1); if (given && given.email === p.email) setGiven(null); }
    catch (err) { toast(err.message); }
  };
  const copy = () => {
    const t = `You're on the Once Lost Media team. Sign in at ${location.origin}/login with ${given.email} and the PIN ${given.pin}, then choose your own PIN in the Studio.`;
    navigator.clipboard.writeText(t).then(() => toast("Copied. Send it to them by text or message."), () => toast("Copy isn't available here. Read the PIN to them instead."));
  };

  return (
    <section className="card team-card">
      <div className="card-head"><h2>Accounts</h2><span className="muted">{team.data ? team.data.length : ""}</span></div>
      <p className="hint" style={{ marginTop: 0 }}>Everyone with an account on the site. People you add here join the Once Lost Media team in Backlot. Only you can write journal entries and upload films. Remove spam accounts here.</p>
      {team.loading ? <Loading /> : team.error ? <ErrorNote error={team.error} /> : (
        <ul className="rows">
          {team.data.map((p) => (
            <li key={p.user_id}>
              <div className="row-main">
                <span className="row-title">{p.display_name || p.email.split("@")[0]}{p.user_id === me.id ? " (you)" : ""}</span>
                <span className="row-sub">{p.email} · {fmtSeen(p.last_sign_in_at)}</span>
              </div>
              {p.is_owner ? <span className="pill live">Owner</span> : p.must_change_pin ? <span className="pill draft">Temporary PIN</span> : <span className="pill live">Active</span>}
              {!p.is_owner && (<>
                <ConfirmButton className="btn ghost sm" confirm="New PIN?" onConfirm={() => reset(p)}>Reset PIN</ConfirmButton>
                <ConfirmButton className="btn ghost sm" confirm="Remove?" onConfirm={() => remove(p)}>Remove</ConfirmButton>
              </>)}
            </li>
          ))}
        </ul>
      )}
      {given && (
        <div className="notice pin-given" role="status">
          <span>{given.reset ? "New temporary PIN for" : "Added"} <strong>{given.who}</strong>. Their temporary PIN is</span>
          <span className="pin-show">{given.pin}</span>
          <span className="hint">Send it to them yourself. It won't be shown again. They'll be asked to choose their own PIN after signing in.</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button type="button" className="btn sm" onClick={copy}>Copy sign-in message</button><button type="button" className="btn ghost sm" onClick={() => setGiven(null)}>Done</button></div>
        </div>
      )}
      <form className="fm" onSubmit={add} style={{ marginTop: 14 }}>
        <div className="two">
          <div><label htmlFor="tm-email">Email</label><input id="tm-email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@email.com" /></div>
          <div><label htmlFor="tm-name">Name</label><input id="tm-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Optional" /></div>
        </div>
        <ErrorNote error={error} />
        <button className="btn gold" disabled={busy || !email.trim()} style={{ justifySelf: "start" }}>{busy ? "Adding…" : "Add team member"}</button>
        <p className="hint" style={{ margin: 0 }}>Backlot makes a temporary 6-digit PIN for them. No email is sent.</p>
      </form>
    </section>
  );
}

function PinCard({ user }) {
  const has = !!(user.user_metadata && user.user_metadata.has_pin);
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const clean = (v) => v.replace(/\D/g, "").slice(0, 6);
  const save = async (e) => {
    e.preventDefault(); setError(null);
    if (!/^\d{6}$/.test(pin)) return setError(new Error("Use exactly 6 numbers."));
    if (/^(\d)\1{5}$/.test(pin) || "0123456789".includes(pin) || "9876543210".includes(pin)) return setError(new Error("Pick something harder to guess than repeated or sequential numbers."));
    if (pin !== pin2) return setError(new Error("The two PINs don't match."));
    setBusy(true);
    try { await api.setPin(pin); setDone(true); setPin(""); setPin2(""); toast("PIN saved."); }
    catch (err) { setError(err); }
    setBusy(false);
  };
  return (
    <section className="card">
      <div className="card-head"><h2>Sign-in PIN</h2>{(has || done) && <span className="pill live">Set</span>}</div>
      <form className="fm" onSubmit={save}>
        <div className="two">
          <div><label htmlFor="pin1">{has || done ? "New 6-digit PIN" : "Choose a 6-digit PIN"}</label>
            <input id="pin1" className="input pin-input" type="password" inputMode="numeric" autoComplete="new-password" maxLength={6} value={pin} onChange={(e) => setPin(clean(e.target.value))} placeholder="••••••" /></div>
          <div><label htmlFor="pin2">Type it again</label>
            <input id="pin2" className="input pin-input" type="password" inputMode="numeric" autoComplete="new-password" maxLength={6} value={pin2} onChange={(e) => setPin2(clean(e.target.value))} placeholder="••••••" /></div>
        </div>
        <ErrorNote error={error} />
        <button className="btn gold" disabled={busy || pin.length !== 6 || pin2.length !== 6} style={{ justifySelf: "start" }}>{busy ? "Saving…" : has || done ? "Change PIN" : "Save PIN"}</button>
      </form>
      <p className="hint">Sign in with {user.email} and this PIN. If you forget it, use "Email me a link" on the sign-in page, then set a new one here.</p>
    </section>
  );
}

/* ---------------- Journal editor ---------------- */
const EMPTY_POST = { title: "", slug: "", excerpt: "", body: "", cover_url: "", published: false };
const EMPTY_STUDY = { ...EMPTY_POST, scripture: "", questions: "", comments_open: true };
const KINDS = {
  post: { section: "Journal", noun: "entry", base: "/journal", edit: "/studio/post", get: (q) => api.getPost(q), save: (p) => api.savePost(p), empty: EMPTY_POST, summary: "One or two sentences shown on the journal page", ask: "What's this entry about?" },
  study: { section: "Bible Study", noun: "study", base: "/bible-study", edit: "/studio/study", get: (q) => api.getStudy(q), save: (p) => api.saveStudy(p), empty: EMPTY_STUDY, summary: "One or two sentences shown on the Bible Study page", ask: "What's this study called?" },
};

export function PostEditor({ id, kind = "post" }) {
  const K = KINDS[kind];
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [post, setPost] = useState(id ? null : K.empty);
  const [slugTouched, setSlugTouched] = useState(!!id);
  const [view, setView] = useState("write");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState(null);
  const [dirty, setDirty] = useState(false);
  const body = useRef(null);
  const imgInput = useRef(null);
  const coverInput = useRef(null);

  useEffect(() => {
    if (!id) return;
    K.get({ id }).then((p) => setPost(p || K.empty), setError);
  }, [id]);
  useEffect(() => {
    const warn = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const set = (k, v) => { setDirty(true); setPost((p) => ({ ...p, [k]: v, ...(k === "title" && !slugTouched ? { slug: slugify(v) } : {}) })); };

  const wrap = (before, after = before, placeholder = "text") => {
    const ta = body.current;
    const { selectionStart: a, selectionEnd: b, value } = ta;
    const sel = value.slice(a, b) || placeholder;
    const next = value.slice(0, a) + before + sel + after + value.slice(b);
    set("body", next);
    requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(a + before.length, a + before.length + sel.length); });
  };
  const linePrefix = (prefix) => {
    const ta = body.current;
    const { selectionStart: a, value } = ta;
    const ls = value.lastIndexOf("\n", a - 1) + 1;
    set("body", value.slice(0, ls) + prefix + value.slice(ls));
    requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(a + prefix.length, a + prefix.length); });
  };
  const insertAtCursor = (text) => {
    const ta = body.current;
    const a = ta ? ta.selectionStart : post.body.length;
    set("body", post.body.slice(0, a) + text + post.body.slice(a));
  };

  const uploadInline = async (file) => {
    if (!file) return;
    setBusy("Uploading image…");
    try {
      const url = await api.uploadImage(file);
      insertAtCursor(`\n![${file.name.replace(/\.\w+$/, "")}](${url})\n`);
    } catch (e) { toast(e.message); }
    setBusy("");
  };
  const uploadCover = async (file) => {
    if (!file) return;
    setBusy("Uploading cover…");
    try { set("cover_url", await api.uploadImage(file)); } catch (e) { toast(e.message); }
    setBusy("");
  };

  const save = async (publish) => {
    if (!post.title.trim()) { setError(new Error(`Give the ${K.noun} a title before saving.`)); return; }
    setBusy("Saving…"); setError(null);
    try {
      const row = await K.save({ ...post, slug: post.slug || slugify(post.title), published: publish ?? post.published, author_name: post.author_name || (await api.getProfile(user.id))?.display_name || "" });
      setPost(row); setDirty(false);
      toast(row.published ? "Published." : "Draft saved.");
      if (!id) navigate(`${K.edit}/${row.id}`, { replace: true });
    } catch (e) { setError(e); }
    setBusy("");
  };

  useEffect(() => {
    const k = (e) => { if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); save(); } };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });

  if (!post) return <main className="page"><ErrorNote error={error} /><Loading /></main>;
  return (
    <main className="page wide editor">
      <header className="page-head row">
        <div>
          <p className="eyebrow"><Link to="/studio">Studio</Link> / {K.section}</p>
          <h1>{id ? `Edit ${K.noun}` : `New ${K.noun}`}</h1>
        </div>
        <div className="head-actions">
          {busy && <span className="hint">{busy}</span>}
          {post.id && post.published && <Link to={`${K.base}/${post.slug}`} className="btn ghost">View</Link>}
          <button className="btn" onClick={() => save(false)} disabled={!!busy}>{post.published ? "Unpublish" : "Save draft"}</button>
          <button className="btn gold" onClick={() => save(true)} disabled={!!busy}>{post.published ? "Update" : "Publish"}</button>
        </div>
      </header>
      <ErrorNote error={error} />

      <div className="ed-meta">
        <div className="fm">
          <label htmlFor="pt">Title</label>
          <input id="pt" className="input title-input" value={post.title} onChange={(e) => set("title", e.target.value)} placeholder={K.ask} />
          {kind === "study" && (<>
            <label htmlFor="pr">Scripture</label>
            <input id="pr" className="input" value={post.scripture || ""} onChange={(e) => set("scripture", e.target.value)} placeholder="For example: Luke 15:1-7" />
          </>)}
          <label htmlFor="ps">Web address</label>
          <div className="slug"><span>{K.base}/</span><input id="ps" className="input" value={post.slug} onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} /></div>
          <label htmlFor="pe">Short summary</label>
          <textarea id="pe" className="input" rows="2" value={post.excerpt || ""} onChange={(e) => set("excerpt", e.target.value)} placeholder={K.summary} />
          {kind === "study" && (<>
            <label htmlFor="pq">Questions for reflection</label>
            <textarea id="pq" className="input" rows="4" value={post.questions || ""} onChange={(e) => set("questions", e.target.value)} placeholder={"One question per line.\nWhat does this passage show us about God's love?"} />
            <label className="check"><input type="checkbox" checked={post.comments_open !== false} onChange={(e) => set("comments_open", e.target.checked)} /> Allow comments</label>
          </>)}
        </div>
        <div className="cover-pick">
          <span className="label">Cover image</span>
          <button type="button" className="cover-box" onClick={() => coverInput.current.click()}>
            {post.cover_url ? <img src={post.cover_url} alt="Cover" /> : <span>Add a cover image</span>}
          </button>
          {post.cover_url && <button type="button" className="linkish" onClick={() => set("cover_url", "")}>Remove cover</button>}
          <input ref={coverInput} type="file" accept="image/*" hidden onChange={(e) => { uploadCover(e.target.files[0]); e.target.value = ""; }} />
        </div>
      </div>

      <div className="md-bar" role="toolbar" aria-label="Formatting">
        <div className="seg">
          <button className={view === "write" ? "on" : ""} onClick={() => setView("write")}>Write</button>
          <button className={view === "split" ? "on" : ""} onClick={() => setView("split")}>Side by side</button>
          <button className={view === "preview" ? "on" : ""} onClick={() => setView("preview")}>Preview</button>
        </div>
        {view !== "preview" && (
          <div className="md-tools">
            <button onClick={() => linePrefix("## ")} title="Heading">H</button>
            <button onClick={() => wrap("**")} title="Bold"><b>B</b></button>
            <button onClick={() => wrap("_")} title="Italic"><i>I</i></button>
            <button onClick={() => linePrefix("> ")} title="Quote">❝</button>
            <button onClick={() => linePrefix("- ")} title="List">• List</button>
            <button onClick={() => wrap("[", "](https://)", "link text")} title="Link">Link</button>
            <button onClick={() => imgInput.current.click()} title="Insert image">Image</button>
            <button onClick={() => insertAtCursor('\n<iframe src="https://www.youtube.com/embed/VIDEO_ID"></iframe>\n')} title="Embed a YouTube or Vimeo video">Embed</button>
            <input ref={imgInput} type="file" accept="image/*" hidden onChange={(e) => { uploadInline(e.target.files[0]); e.target.value = ""; }} />
          </div>
        )}
      </div>
      <div className={"md-panes " + view}>
        {view !== "preview" && (
          <textarea ref={body} className="md-input" value={post.body} onChange={(e) => set("body", e.target.value)} onPaste={(e) => { const f = [...e.clipboardData.files].find((x) => x.type.startsWith("image/")); if (f) { e.preventDefault(); uploadInline(f); } }}
            placeholder={kind === "study" ? "Write the study here.\n\nQuote the passage with > at the start of a line, use ## for headings, **bold** and _italic_." : "Write your entry here.\n\nUse ## for a heading, **bold**, _italic_, and paste images straight in."} aria-label="Entry text" />
        )}
        {view !== "write" && <div className="md-preview prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) || "<p class='muted'>Nothing to preview yet.</p>" }} />}
      </div>
    </main>
  );
}

/* ---------------- Film upload / edit ---------------- */
const EMPTY_FILM = { title: "", description: "", year: "", runtime: "", video_url: "", video_path: "", poster_url: "", published: false };

export function FilmEditor({ id }) {
  const { navigate } = useRouter();
  const [film, setFilm] = useState(id ? null : EMPTY_FILM);
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState(null);
  const up = useRef(null);
  const posterInput = useRef(null);
  const videoInput = useRef(null);

  useEffect(() => { if (id) api.getFilm(id).then((f) => setFilm(f || EMPTY_FILM), setError); }, [id]);
  useEffect(() => () => up.current && up.current.abort(), []);
  const set = (k, v) => setFilm((f) => ({ ...f, [k]: v }));

  const pickVideo = async (f) => {
    if (!f) return;
    if (!f.type.startsWith("video/") && !/\.(mp4|m4v|mov|webm)$/i.test(f.name)) { setError(new Error("Choose a video file (MP4 works best on every device).")); return; }
    setError(null); setFile(f);
    if (!film.title) set("title", f.name.replace(/\.\w+$/, "").replace(/[_-]+/g, " "));
    setProgress(0);
    const shot = posterFromVideo(f);
    up.current = api.uploadVideo(f, setProgress);
    try {
      const { url, path } = await up.current.promise;
      setFilm((x) => ({ ...x, video_url: url, video_path: path }));
      setProgress(1);
      const s = await shot;
      if (s) {
        if (s.duration && !film.runtime) set("runtime", Math.round(s.duration / 60));
        if (s.blob && !film.poster_url) {
          const posterUrl = await api.uploadImage(new File([s.blob], "poster.jpg", { type: "image/jpeg" })).catch(() => "");
          if (posterUrl) set("poster_url", posterUrl);
        }
      }
    } catch (e) { setError(e); setProgress(null); setFile(null); }
    up.current = null;
  };

  const uploadPoster = async (f) => {
    if (!f) return;
    setBusy("Uploading poster…");
    try { set("poster_url", await api.uploadImage(f)); } catch (e) { setError(e); }
    setBusy("");
  };

  const save = async (publish) => {
    if (!film.title.trim()) { setError(new Error("Give the film a title.")); return; }
    if (progress !== null && progress < 1) { setError(new Error("Wait for the movie to finish uploading.")); return; }
    setBusy("Saving…"); setError(null);
    try {
      const row = await api.saveFilm({ ...film, year: film.year ? Number(film.year) : null, runtime: film.runtime ? Number(film.runtime) : null, published: publish ?? film.published });
      setFilm(row);
      toast(row.published ? "Film published." : "Film saved as a draft.");
      if (!id) navigate(`/studio/film/${row.id}`, { replace: true });
    } catch (e) { setError(e); }
    setBusy("");
  };

  if (!film) return <main className="page"><ErrorNote error={error} /><Loading /></main>;
  const uploading = progress !== null && progress < 1;
  return (
    <main className="page wide">
      <header className="page-head row">
        <div>
          <p className="eyebrow"><Link to="/studio">Studio</Link> / Films</p>
          <h1>{id ? "Edit film" : "Upload a film"}</h1>
        </div>
        <div className="head-actions">
          {busy && <span className="hint">{busy}</span>}
          {film.id && <Link to={`/films/${film.id}`} className="btn ghost">Watch</Link>}
          <button className="btn" onClick={() => save(false)} disabled={!!busy || uploading}>{film.published ? "Unpublish" : "Save draft"}</button>
          <button className="btn gold" onClick={() => save(true)} disabled={!!busy || uploading}>{film.published ? "Update" : "Publish"}</button>
        </div>
      </header>
      <ErrorNote error={error} />

      <div className="film-ed">
        <div>
          <div className={"drop" + (uploading ? " busy" : "")}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); if (!uploading) pickVideo(e.dataTransfer.files[0]); }}>
            {film.video_url && !uploading ? (
              <video src={film.video_url} poster={film.poster_url || undefined} controls preload="metadata" />
            ) : uploading ? (
              <div className="up">
                <p><strong>{file && file.name}</strong> · {file && fmtBytes(file.size)}</p>
                <div className="progress"><span style={{ width: `${Math.round(progress * 100)}%` }} /></div>
                <p className="hint">{Math.round(progress * 100)}% uploaded. Keep this tab open; if the connection drops, choose the same file again to resume.</p>
                <button className="btn ghost sm" onClick={() => { up.current && up.current.abort(); setProgress(null); setFile(null); }}>Cancel upload</button>
              </div>
            ) : (
              <button className="drop-cta" onClick={() => videoInput.current.click()}>
                <strong>Drop a movie file here</strong>
                <span>or click to choose one · MP4 (H.264) plays everywhere</span>
                <span>No movie yet? Add a poster and description and it will show as In development.</span>
              </button>
            )}
          </div>
          {film.video_url && !uploading && <button className="linkish" onClick={() => videoInput.current.click()}>Replace the movie file</button>}
          <input ref={videoInput} type="file" accept="video/*,.mp4,.mov,.m4v,.webm" hidden onChange={(e) => { pickVideo(e.target.files[0]); e.target.value = ""; }} />
        </div>

        <div className="fm">
          <label htmlFor="ft">Title</label>
          <input id="ft" className="input" value={film.title} onChange={(e) => set("title", e.target.value)} />
          <div className="two">
            <div><label htmlFor="fy">Year</label><input id="fy" className="input" inputMode="numeric" value={film.year || ""} onChange={(e) => set("year", e.target.value.replace(/\D/g, "").slice(0, 4))} /></div>
            <div><label htmlFor="fr">Runtime (minutes)</label><input id="fr" className="input" inputMode="numeric" value={film.runtime || ""} onChange={(e) => set("runtime", e.target.value.replace(/\D/g, ""))} /></div>
          </div>
          <label htmlFor="fd">Description</label>
          <textarea id="fd" className="input" rows="6" value={film.description || ""} onChange={(e) => set("description", e.target.value)} placeholder="Logline, credits, festival laurels…" />
          <span className="label">Poster</span>
          <button type="button" className="cover-box wide" onClick={() => posterInput.current.click()}>
            {film.poster_url ? <img src={film.poster_url} alt="Poster" /> : <span>A still is taken from the movie automatically. Click to upload your own.</span>}
          </button>
          <input ref={posterInput} type="file" accept="image/*" hidden onChange={(e) => { uploadPoster(e.target.files[0]); e.target.value = ""; }} />
        </div>
      </div>
    </main>
  );
}

/* ---------------- Backlot ---------------- */
const lastTeam = { get: () => { try { return localStorage.getItem("olm.lastTeam") || ""; } catch { return ""; } }, set: (v) => { try { localStorage.setItem("olm.lastTeam", v); } catch {} } };

/* /studio/backlot: go straight to the team you used last, or pick one. */
export function BacklotPicker() {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const teams = useLoad(() => api.teams.mine(), []);
  useEffect(() => {
    if (!teams.data) return;
    const last = lastTeam.get();
    const pick = teams.data.find((t) => t.id === last) || (teams.data.length === 1 ? teams.data[0] : null);
    if (pick) navigate("/studio/backlot/" + pick.id, { replace: true });
  }, [teams.data, navigate]);
  if (teams.loading || (teams.data && (teams.data.length === 1 || teams.data.some((t) => t.id === lastTeam.get())))) return <main className="page"><Loading label="Opening Backlot" /></main>;
  if (teams.data && teams.data.length === 0) return <FirstTeam />;
  return (
    <main className="page wide">
      <header className="page-head"><p className="eyebrow">Backlot</p><h1>Pick a project</h1></header>
      {teams.error ? <ErrorNote error={teams.error} /> : <div className="studio-grid"><TeamsCard me={user} /></div>}
    </main>
  );
}

export function BacklotPage({ ws }) {
  const ref = useRef(null);
  useEffect(() => { logVisit("backlot"); }, []);
  const { navigate } = useRouter();
  const [busy, setBusy] = useState(false);
  const newProject = async () => {
    const name = window.prompt("Name your new project (you can change it later)", "Untitled project");
    if (name == null) return;
    setBusy(true);
    try { const id = await api.teams.create(name.trim() || "Untitled project"); navigate("/studio/backlot/" + id); }
    catch (e) { toast(e.message || "Couldn't start a new project."); }
    setBusy(false);
  };
  const [error, setError] = useState(null);
  const teams = useLoad(() => api.teams.mine(), []);
  const team = teams.data && teams.data.find((t) => t.id === ws);
  useEffect(() => {
    let alive = true, unmount = null, adapters = null;
    lastTeam.set(ws);
    api.backlot(ws).then((ad) => {
      adapters = ad;
      if (!alive) { ad.destroy(); return; }
      unmount = mountBacklot(ref.current, ad);
    }, setError);
    return () => {
      alive = false;
      if (unmount) unmount();
      if (adapters) adapters.destroy();
    };
  }, [ws]);
  if (teams.data && !team) return (
    <main className="page narrow"><Empty title="You're not on this project"><p>Ask the project owner for an invite link, or open one of your own projects.</p><Link to="/studio" className="btn gold">Go to the Studio</Link></Empty></main>
  );
  return (
    <main className="backlot-host">
      <div className="team-strip">
        <label htmlFor="projSel" className="muted">Project</label>
        <select id="projSel" className="input proj-sel" value={ws} onChange={(e) => navigate("/studio/backlot/" + e.target.value)} disabled={!teams.data}>
          {(teams.data || (team ? [team] : [{ id: ws, name: "…" }])).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <span className="muted">{team ? `${team.members} ${team.members === 1 ? "person" : "people"}` : ""}</span>
        <span style={{ marginRight: "auto" }} />
        <button type="button" className="btn" onClick={newProject} disabled={busy}>{busy ? "Starting…" : "+ New project"}</button>
        <Link to="/studio" className="linkish">Add people to this project</Link>
      </div>
      <ErrorNote error={error} />
      <div ref={ref} className="backlot"><div style={{ padding: 32 }}><Loading label="Opening Backlot" /></div></div>
    </main>
  );
}

/* First visit: name your team and go straight into Backlot. */
function FirstTeam() {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const first = ((user && user.email) || "").split("@")[0];
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const go = async (e) => {
    e.preventDefault(); setError(null); setBusy(true);
    try { const id = await api.teams.create(name.trim() || "My production"); navigate("/studio/backlot/" + id, { replace: true }); }
    catch (err) { setError(err); setBusy(false); }
  };
  return (
    <main className="page narrow">
      <header className="page-head">
        <p className="eyebrow">Welcome to Backlot</p>
        <h1>Name your first project</h1>
        <p className="lede">Each project has its own screenplay, storyboard and call sheets. You can add people to it next.</p>
      </header>
      <form className="card fm" onSubmit={go}>
        <label htmlFor="ft-name">Project name</label>
        <input id="ft-name" className="input" autoFocus maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder={first ? first + "'s production" : "Night Shift Films"} />
        <ErrorNote error={error} />
        <button className="btn gold" disabled={busy} style={{ justifySelf: "start" }}>{busy ? "Setting up…" : "Start writing"}</button>
        <p className="hint" style={{ margin: 0 }}>Got an invite link from someone? Open it instead to join their team.</p>
      </form>
    </main>
  );
}

/* ---------------- Backlot teams ---------------- */
function TeamsCard({ me }) {
  const [tick, setTick] = useState(0);
  const teams = useLoad(() => api.teams.mine(), [tick]);
  const [open, setOpen] = useState(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const { navigate } = useRouter();
  const create = async (e) => {
    e.preventDefault(); setError(null); setBusy(true);
    try { const id = await api.teams.create(name.trim()); setName(""); toast("Project created."); navigate("/studio/backlot/" + id); }
    catch (err) { setError(err); }
    setBusy(false);
  };
  const refresh = () => setTick((t) => t + 1);
  return (
    <section className="card backlot-card teams-card" id="teams">
      <div className="card-head"><h2>Backlot projects</h2><span className="muted">{teams.data ? teams.data.length : ""}</span></div>
      <p className="hint" style={{ marginTop: 0 }}>Each project has its own screenplay, storyboard and call sheets. Add people to any project and write together, live. A project is private to the people on it.</p>
      {teams.loading ? <Loading /> : teams.error ? <ErrorNote error={teams.error} /> : teams.data.length ? (
        <ul className="rows">
          {teams.data.map((t) => (
            <li key={t.id} className="team-row">
              <div className="team-line">
                <div className="row-main">
                  <span className="row-title">{t.name}</span>
                  <span className="row-sub">{t.role === "owner" ? "Your project" : "Shared with you"} · {t.members} {t.members === 1 ? "person" : "people"}</span>
                </div>
                <button className="btn ghost sm" onClick={() => setOpen(open === t.id ? null : t.id)} aria-expanded={open === t.id}>{open === t.id ? "Close" : t.role === "owner" ? "Invite & manage" : "Members"}</button>
                <Link to={"/studio/backlot/" + t.id} className="btn gold sm">Open</Link>
              </div>
              {open === t.id && <TeamPanel team={t} me={me} onChange={refresh} onGone={() => { setOpen(null); refresh(); }} />}
            </li>
          ))}
        </ul>
      ) : <p className="muted">You don't have a project yet. Start one below, or open an invite link someone sent you.</p>}
      <form className="fm inline" onSubmit={create} style={{ marginTop: 14 }}>
        <label htmlFor="new-team" className="sr">New project name</label>
        <input id="new-team" className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="New project name, e.g. Bought Back" />
        <button className="btn" disabled={busy}>{busy ? "Starting…" : "Start a project"}</button>
      </form>
      <ErrorNote error={error} />
    </section>
  );
}

function TeamPanel({ team, me, onChange, onGone }) {
  const owner = team.role === "owner";
  const [tick, setTick] = useState(0);
  const members = useLoad(() => api.teams.members(team.id), [tick]);
  const invites = useLoad(() => (owner ? api.teams.invites(team.id) : Promise.resolve([])), [tick]);
  const [rename, setRename] = useState(team.name);
  const link = (tok) => `${location.origin}/join/${tok}`;
  const copy = (tok) => navigator.clipboard.writeText(link(tok)).then(() => toast("Invite link copied. Send it to your crew."), () => toast("Copy isn't available here. Select the link and copy it."));
  const act = async (fn, msg) => { try { await fn(); if (msg) toast(msg); setTick((t) => t + 1); onChange(); } catch (e) { toast(e.message); } };
  return (
    <div className="team-panel">
      {owner && (
        <div className="tp-block">
          <h3>Invite people</h3>
          <p className="hint" style={{ margin: 0 }}>Anyone with the link can join this project for 14 days, up to 25 people. They'll need a free account.</p>
          {invites.loading ? <Loading /> : (invites.data || []).map((i) => (
            <div key={i.token} className="invite-row">
              <input className="input" readOnly value={link(i.token)} onFocus={(e) => e.target.select()} aria-label="Invite link" />
              <button className="btn sm" onClick={() => copy(i.token)}>Copy</button>
              <ConfirmButton className="btn ghost sm" confirm="Turn off?" onConfirm={() => act(() => api.teams.revoke(i.token), "Invite link turned off.")}>Turn off</ConfirmButton>
              <span className="row-sub">Expires {fmtDate(i.expires_at)} · used {i.uses}×</span>
            </div>
          ))}
          <button className="btn gold sm" style={{ justifySelf: "start" }} onClick={() => act(async () => { const i = await api.teams.invite(team.id); copy(i.token); })}>Create invite link</button>
        </div>
      )}
      <div className="tp-block">
        <h3>Members</h3>
        {members.loading ? <Loading /> : members.error ? <ErrorNote error={members.error} /> : (
          <ul className="rows compact">
            {members.data.map((m) => (
              <li key={m.user_id}>
                <div className="row-main"><span className="row-title">{m.display_name || "Teammate"}{m.user_id === me.id ? " (you)" : ""}</span><span className="row-sub">Joined {fmtDate(m.joined_at)}</span></div>
                <span className={"pill " + (m.role === "owner" ? "live" : "draft")}>{m.role === "owner" ? "Owner" : "Member"}</span>
                {owner && m.user_id !== me.id && <ConfirmButton className="btn ghost sm" confirm="Remove?" onConfirm={() => act(() => api.teams.removeMember(team.id, m.user_id), "Removed from the team.")}>Remove</ConfirmButton>}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="tp-block">
        {owner ? (<>
          <form className="fm inline" onSubmit={(e) => { e.preventDefault(); act(() => api.teams.rename(team.id, rename), "Project renamed."); }}>
            <label htmlFor={"rn-" + team.id} className="sr">Project name</label>
            <input id={"rn-" + team.id} className="input" value={rename} maxLength={80} onChange={(e) => setRename(e.target.value)} />
            <button className="btn sm">Rename</button>
          </form>
          {!team.is_home && <ConfirmButton className="btn danger sm" confirm="Delete this project, including its screenplay, storyboard and call sheets?" onConfirm={async () => { try { await api.teams.remove(team.id); toast("Project deleted."); onGone(); } catch (e) { toast(e.message); } }}>Delete project</ConfirmButton>}
        </>) : (
          <ConfirmButton className="btn ghost sm" confirm="Leave this project?" onConfirm={async () => { try { await api.teams.leave(team.id); toast("You left the project."); onGone(); } catch (e) { toast(e.message); } }}>Leave project</ConfirmButton>
        )}
      </div>
    </div>
  );
}
