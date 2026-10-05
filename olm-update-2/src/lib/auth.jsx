import { createContext, useContext, useEffect, useState } from "react";
import { api } from "./backend.js";

const AuthCtx = createContext({ user: null, loading: true, isOwner: false });

export function AuthProvider({ children }) {
  const [state, setState] = useState({ user: null, loading: true, isOwner: false });
  useEffect(() => {
    let off = () => {};
    let alive = true;
    /* The site owner is the only one who can manage the journal and films. */
    const apply = async (user) => {
      const isOwner = user ? await api.isOwner().catch(() => false) : false;
      if (alive) setState({ user, loading: false, isOwner });
    };
    api.getUser().then(apply);
    api.onAuth(apply).then((u) => (off = u));
    return () => {
      alive = false;
      off();
    };
  }, []);
  return <AuthCtx.Provider value={state}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
