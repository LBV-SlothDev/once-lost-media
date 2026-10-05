import { useEffect, useRef, useState } from "react";
import { api, DEMO, slugify, posterFromVideo } from "../lib/backend.js";
import { useAuth } from "../lib/auth.jsx";
import { Link, useRouter } from "../lib/router.jsx";
import { renderMarkdown } from "../lib/markdown.js";
import { fmtDate, fmtBytes } from "../lib/format.js";
import { Loading, ErrorNote, useLoad, toast, ConfirmButton } from "../components/ui.jsx";
import { mountBacklot } from "../backlot/backlot.js";

/* ---------------- Dashboard ---------------- */
export function Studio() {
  const { user, isOwner } = useAuth();
  const { navigate } = useRouter();
  const [tick, setTick] = useState(0);
  const posts = useLoad(() => (isOwner ? api.listPosts({ drafts: true }) : Promise.resolve([])), [tick, isOwner]);
  const films = useLoad(() => (isOwner ? api.listFilms({ drafts: true }) : Promise.resolve([])), [tick, isOwner]);
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

      {DEMO && (
        <div className="notice">
          <strong>Demo mode.</strong> Posts and films save in this browser only, and uploaded movies play until the page reloads. Follow the README to connect Supabase and go live.
        </div>
      )}

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
        <section className="card backlot-card">
          <div className="card-head"><h2>Backlot</h2><Link to="/studio/backlot" className="btn gold sm">Open Backlot</Link></div>
          <p>Write the screenplay together, storyboard every shot, and send call sheets with call times. Everyone on the team sees changes live.</p>
        </section>

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
      </div>
    </main>
  );
}

/* ---------------- Journal editor ---------------- */
const EMPTY_POST = { title: "", slug: "", excerpt: "", body: "", cover_url: "", published: false };

export function PostEditor({ id }) {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [post, setPost] = useState(id ? null : EMPTY_POST);
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
    api.getPost({ id }).then((p) => setPost(p || EMPTY_POST), setError);
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
    if (!post.title.trim()) { setError(new Error("Give the entry a title before saving.")); return; }
    setBusy("Saving…"); setError(null);
    try {
      const row = await api.savePost({ ...post, slug: post.slug || slugify(post.title), published: publish ?? post.published, author_name: post.author_name || (await api.getProfile(user.id))?.display_name || "" });
      setPost(row); setDirty(false);
      toast(row.published ? "Published." : "Draft saved.");
      if (!id) navigate(`/studio/post/${row.id}`, { replace: true });
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
          <p className="eyebrow"><Link to="/studio">Studio</Link> / Journal</p>
          <h1>{id ? "Edit entry" : "New entry"}</h1>
        </div>
        <div className="head-actions">
          {busy && <span className="hint">{busy}</span>}
          {post.id && post.published && <Link to={`/journal/${post.slug}`} className="btn ghost">View</Link>}
          <button className="btn" onClick={() => save(false)} disabled={!!busy}>{post.published ? "Unpublish" : "Save draft"}</button>
          <button className="btn gold" onClick={() => save(true)} disabled={!!busy}>{post.published ? "Update" : "Publish"}</button>
        </div>
      </header>
      <ErrorNote error={error} />

      <div className="ed-meta">
        <div className="fm">
          <label htmlFor="pt">Title</label>
          <input id="pt" className="input title-input" value={post.title} onChange={(e) => set("title", e.target.value)} placeholder="What's this entry about?" />
          <label htmlFor="ps">Web address</label>
          <div className="slug"><span>/journal/</span><input id="ps" className="input" value={post.slug} onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} /></div>
          <label htmlFor="pe">Short summary</label>
          <textarea id="pe" className="input" rows="2" value={post.excerpt || ""} onChange={(e) => set("excerpt", e.target.value)} placeholder="One or two sentences shown on the journal page" />
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
            placeholder={"Write your entry here.\n\nUse ## for a heading, **bold**, _italic_, and paste images straight in."} aria-label="Entry text" />
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
    if (!film.video_url) { setError(new Error("Upload the movie file first.")); return; }
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
export function BacklotPage() {
  const ref = useRef(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    let alive = true, unmount = null, adapters = null;
    api.backlot().then((ad) => {
      adapters = ad;
      if (!alive) { ad.destroy(); return; }
      unmount = mountBacklot(ref.current, ad);
    }, setError);
    return () => {
      alive = false;
      if (unmount) unmount();
      if (adapters) adapters.destroy();
    };
  }, []);
  return (
    <main className="backlot-host">
      <ErrorNote error={error} />
      <div ref={ref} className="backlot"><div style={{ padding: 32 }}><Loading label="Opening Backlot" /></div></div>
    </main>
  );
}
