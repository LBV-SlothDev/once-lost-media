import { createContext, useContext, useEffect, useState, useCallback } from "react";

/* A small router: history URLs on the real site, hash URLs in the preview build. */
const HASH = typeof __HASH_ROUTER__ !== "undefined" && __HASH_ROUTER__;
const RouterCtx = createContext({ path: "/", navigate: () => {} });

const readPath = () => (HASH ? window.location.hash.slice(1) || "/" : window.location.pathname) || "/";

export function Router({ children }) {
  const [path, setPath] = useState(readPath);
  useEffect(() => {
    const on = () => setPath(readPath());
    window.addEventListener(HASH ? "hashchange" : "popstate", on);
    return () => window.removeEventListener(HASH ? "hashchange" : "popstate", on);
  }, []);
  const navigate = useCallback((to, { replace } = {}) => {
    if (HASH) {
      if (replace) window.location.replace("#" + to);
      else window.location.hash = to;
    } else {
      window.history[replace ? "replaceState" : "pushState"]({}, "", to);
      setPath(to);
    }
    window.scrollTo(0, 0);
  }, []);
  return <RouterCtx.Provider value={{ path, navigate }}>{children}</RouterCtx.Provider>;
}

export const useRouter = () => useContext(RouterCtx);

export function href(to) {
  return HASH ? "#" + to : to;
}

export function Link({ to, children, className, ...rest }) {
  const { navigate, path } = useRouter();
  const active = to === "/" ? path === "/" : path.startsWith(to);
  return (
    <a
      href={href(to)}
      className={className}
      aria-current={active ? "page" : undefined}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        navigate(to);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}

/** match("/films/:id", "/films/abc") -> { id: "abc" } or null */
export function match(pattern, path) {
  const p = pattern.split("/").filter(Boolean);
  const s = path.split("?")[0].split("/").filter(Boolean);
  if (p.length !== s.length) return null;
  const params = {};
  for (let i = 0; i < p.length; i++) {
    if (p[i].startsWith(":")) params[p[i].slice(1)] = decodeURIComponent(s[i]);
    else if (p[i] !== s[i]) return null;
  }
  return params;
}
