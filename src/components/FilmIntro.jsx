import { useEffect, useRef, useState } from "react";
import { asset } from "../lib/format.js";

/*
 * The opening reel: an academy-leader countdown on running film stock,
 * a fast strip of frames that slows to a stop, then the logo in the
 * projector beam. Click, tap or press any key to skip.
 */
const FRAMES = 14;

export default function FilmIntro({ onDone }) {
  const [phase, setPhase] = useState("leader"); // leader -> reel -> reveal -> exit
  const [count, setCount] = useState(3);
  const grain = useRef(null);
  const timers = useRef([]);
  const finished = useRef(false);

  const finish = (fast) => {
    if (finished.current) return;
    finished.current = true;
    timers.current.forEach(clearTimeout);
    setPhase("exit");
    setTimeout(onDone, fast ? 450 : 900);
  };

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const at = (ms, fn) => timers.current.push(setTimeout(fn, ms));
    if (reduce) {
      setPhase("reveal");
      at(1800, () => finish());
    } else {
      at(850, () => setCount(2));
      at(1700, () => setCount(1));
      at(2550, () => setPhase("reel"));
      at(4300, () => setPhase("reveal"));
      at(7400, () => finish());
    }
    const skip = (e) => {
      if (e.type === "keydown" && ["Shift", "Control", "Alt", "Meta"].includes(e.key)) return;
      finish(true);
    };
    window.addEventListener("keydown", skip);
    document.documentElement.style.overflow = "hidden";
    return () => {
      timers.current.forEach(clearTimeout);
      window.removeEventListener("keydown", skip);
      document.documentElement.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* film grain */
  useEffect(() => {
    const c = grain.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    const w = (c.width = 220), h = (c.height = 124);
    const img = ctx.createImageData(w, h);
    let raf, tick = 0;
    const loop = () => {
      if (tick++ % 2 === 0) {
        const d = img.data;
        for (let i = 0; i < d.length; i += 4) {
          const v = (Math.random() * 255) | 0;
          d[i] = d[i + 1] = d[i + 2] = v;
          d[i + 3] = 255;
        }
        ctx.putImageData(img, 0, 0);
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className={`intro is-${phase}`} onClick={() => finish(true)} role="presentation">
      <div className="intro-gate">
        <div className="sprockets left" aria-hidden="true" />
        <div className="sprockets right" aria-hidden="true" />

        <div className="leader" aria-hidden="true">
          <div className="leader-ring" />
          <div className="leader-sweep" />
          <div className="leader-cross" />
          <span className="leader-num" key={count}>{count}</span>
        </div>

        <div className="reel" aria-hidden="true">
          <div className="reel-track">
            {Array.from({ length: FRAMES }, (_, i) => (
              <div className="reel-frame" key={i}>
                <img src={asset("emblem.png")} alt="" />
                <span>{String(i + 1).padStart(2, "0")}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="reveal">
          <div className="beam" aria-hidden="true" />
          <img className="reveal-logo" src={asset("logo.png")} alt="Once Lost Media" />
        </div>

        <canvas ref={grain} className="grain" aria-hidden="true" />
        <div className="flicker" aria-hidden="true" />
        <div className="scratches" aria-hidden="true" />
      </div>
      <button className="intro-skip" onClick={(e) => { e.stopPropagation(); finish(true); }}>
        Skip intro
      </button>
    </div>
  );
}
