import { useEffect, useRef, useState } from "react";
import { DICTATE_OK, createDictation, insertText } from "../lib/dictate.js";
import { toast } from "./ui.jsx";

/* "Talk to type": press, speak, and the words go into the box with the given id. */
export function TalkButton({ targetId, className = "" }) {
  const [on, setOn] = useState(false);
  const [heard, setHeard] = useState("");
  const d = useRef(null);
  useEffect(() => () => { if (d.current) d.current.stop(); }, []);
  if (!DICTATE_OK) return null;
  const toggle = () => {
    if (d.current && d.current.active) { d.current.stop(); return; }
    const el = document.getElementById(targetId);
    if (!el) return;
    el.focus();
    d.current = createDictation({
      onFinal: (t) => { const box = document.getElementById(targetId); if (box) insertText(box, t); },
      onInterim: setHeard,
      onState: setOn,
      onError: (m) => toast(m),
    });
    d.current.start();
  };
  return (
    <span className={"talk-inline " + className}>
      <button type="button" className={"btn ghost sm talk-inline-btn" + (on ? " on" : "")} onPointerDown={(e) => e.preventDefault()} onClick={toggle} aria-pressed={on}
        title='Press and speak. Say "period", "comma" or "new line" for punctuation.'>
        <span className="talk-dot" aria-hidden="true" />{on ? "Stop" : "Talk to type"}
      </button>
      {on && <span className="hint talk-heard" aria-live="polite">{heard || "Listening… speak now"}</span>}
    </span>
  );
}
