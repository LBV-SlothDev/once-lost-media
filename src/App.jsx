import { useState } from "react";
import { Router, useRouter, match } from "./lib/router.jsx";
import { AuthProvider } from "./lib/auth.jsx";
import FilmIntro from "./components/FilmIntro.jsx";
import { Nav, Footer, Toaster, RequireTeam, RequireOwner } from "./components/ui.jsx";
import { Home, Films, Watch, Journal, Post, Login, NotFound } from "./pages/public.jsx";
import { Studio, PostEditor, FilmEditor, BacklotPage } from "./pages/studio.jsx";

const seen = () => {
  try { return sessionStorage.getItem("olm.intro") === "1"; } catch { return false; }
};
const markSeen = () => {
  try { sessionStorage.setItem("olm.intro", "1"); } catch {}
};

function Routes() {
  const { path } = useRouter();
  const team = (el) => <RequireTeam>{el}</RequireTeam>;
  const owner = (el) => <RequireOwner>{el}</RequireOwner>;
  let m;
  if (path === "/") return <Home />;
  if (path === "/films") return <Films />;
  if ((m = match("/films/:id", path))) return <Watch id={m.id} />;
  if (path === "/journal") return <Journal />;
  if ((m = match("/journal/:slug", path))) return <Post slug={m.slug} />;
  if (path === "/login") return <Login />;
  if (path === "/studio") return team(<Studio />);
  if (path === "/studio/post/new") return owner(<PostEditor key="new" />);
  if ((m = match("/studio/post/:id", path))) return owner(<PostEditor key={m.id} id={m.id} />);
  if (path === "/studio/film/new") return owner(<FilmEditor key="new" />);
  if ((m = match("/studio/film/:id", path))) return owner(<FilmEditor key={m.id} id={m.id} />);
  if (path === "/studio/backlot") return team(<BacklotPage />);
  return <NotFound />;
}

function Shell() {
  const { path } = useRouter();
  const [intro, setIntro] = useState(() => !seen() && !path.startsWith("/studio") && path !== "/login");
  const done = () => { markSeen(); setIntro(false); };
  const backlot = path === "/studio/backlot";
  const replay = () => { window.scrollTo(0, 0); setIntro(true); };
  return (
    <>
      {intro && <FilmIntro onDone={done} />}
      <div className={"site" + (intro ? " behind-intro" : "")}>
        <Nav onReplay={replay} />
        <Routes />
        {!backlot && <Footer onReplay={replay} />}
      </div>
      <Toaster />
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </Router>
  );
}
