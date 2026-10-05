export const BASE = typeof __BASE__ !== "undefined" ? __BASE__ : "/";
export const asset = (p) => BASE + p.replace(/^\//, "");

export const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "";

export const fmtRuntime = (min) => {
  const m = Math.round(Number(min) || 0);
  if (!m) return "";
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m} min`;
};

export const fmtBytes = (b) => {
  if (!b) return "0 MB";
  const gb = b / 1024 ** 3;
  return gb >= 1 ? gb.toFixed(2) + " GB" : (b / 1024 ** 2).toFixed(1) + " MB";
};
