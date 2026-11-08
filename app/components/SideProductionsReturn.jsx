"use client";
import { useEffect, useState } from "react";

const HUB = "https://sideproductions-web.vercel.app/";
const STORAGE_KEY = "side-productions-entry-v1";
export default function SideProductionsReturn() {
  const [active, setActive] = useState(false);
  const [arriving, setArriving] = useState(false);
  const [leaving, setLeaving] = useState(false);\n  const [arrivalExit, setArrivalExit] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    const explicit = url.searchParams.get("side_from") === "productions";
    const previous = window.sessionStorage.getItem(STORAGE_KEY) === "1";
    const navigation = performance.getEntriesByType("navigation")[0];
    const reload = navigation && navigation.type === "reload";
    let sameSiteReferrer = false;
    try { sameSiteReferrer = Boolean(document.referrer) && new URL(document.referrer).origin === location.origin; } catch {}
    const valid = explicit || (previous && (reload || sameSiteReferrer));
    if (explicit) {
      url.searchParams.delete("side_from");
      window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
      setArriving(true);
      const frame = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setArrivalExit(true));
      });
      window.setTimeout(() => setArriving(false), 800);
      return () => window.cancelAnimationFrame(frame);
    }
    if (valid) window.sessionStorage.setItem(STORAGE_KEY, "1");
    else window.sessionStorage.removeItem(STORAGE_KEY);
    setActive(valid);
  }, []);

  useEffect(() => {
    if (arriving) {
      setActive(true);
      window.sessionStorage.setItem(STORAGE_KEY, "1");
    }
  }, [arriving]);

  const goBack = () => {
    if (leaving) return;
    window.sessionStorage.removeItem(STORAGE_KEY);
    setLeaving(true);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.location.assign(HUB);
    } else {
      window.setTimeout(() => window.location.assign(HUB), 550);
    }
  };
  if (!active && !arriving && !leaving) return null;
  return (
    <>
      <style>{`
        .side-return-btn{position:fixed;bottom:24px;left:24px;z-index:2147483000;background:#f4f4f5;color:#101013;border:1px solid #aaa;border-radius:999px;padding:13px 18px;font:700 11px Arial,sans-serif;letter-spacing:.08em;box-shadow:0 8px 35px #0007;cursor:pointer;transition:transform .2s,background .2s}
        .side-return-btn:hover{transform:translateY(-3px);background:#fff}
        .side-return-panel{position:fixed;inset:0;z-index:2147483001;pointer-events:none;background:#e6e6e9;display:grid;place-items:center;transform:translateX(-102%);transition:transform 550ms cubic-bezier(.77,0,.175,1)}
        .side-return-panel.side-leaving{transform:translateX(0);pointer-events:auto}
        .side-return-panel.side-arriving{transform:translateX(0);transition:none}
        .side-return-panel.side-arriving.side-arrived{transform:translateX(102%);transition:transform 700ms cubic-bezier(.77,0,.175,1)}
        .side-return-panel span{font:900 clamp(30px,6vw,76px) Arial,sans-serif;letter-spacing:-.07em;color:#111}
        @media(max-width:560px){.side-return-btn{bottom:16px;left:16px;padding:12px 14px;font-size:10px}}
        @media(prefers-reduced-motion:reduce){.side-return-panel,.side-return-btn{transition:none!important}}
      `}</style>
      {active && !leaving && <button type="button" className="side-return-btn" onClick={goBack} aria-label="Back to SIDE Productions">← BACK TO SIDE:PRODUCTIONS</button>}
      {(arriving || leaving) && <div aria-hidden="true" className={`side-return-panel ${leaving ? "side-leaving" : "side-arriving"}`}><span>SIDE:PRODUCTIONS</span></div>}
    </>
  );
}
