import { createContext, useContext, useEffect, useState } from "react";
import { api } from "./backend.js";

const AuthCtx = createContext({ user: null, loading: true });

export function AuthProvider({ children }) {
  const [state, setState] = useState({ user: null, loading: true });
  useEffect(() => {
    let off = () => {};
    let alive = true;
    api.getUser().then((user) => alive && setState({ user, loading: false }));
    api.onAuth((user) => alive && setState({ user, loading: false })).then((u) => (off = u));
    return () => {
      alive = false;
      off();
    };
  }, []);
  return <AuthCtx.Provider value={state}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
