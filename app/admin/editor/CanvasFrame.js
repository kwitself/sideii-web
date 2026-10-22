'use client';
import {useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';

const FRAME_DOCUMENT = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="color-scheme" content="dark"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Site preview</title></head><body><div id="canvas-root"></div></body></html>';

// A real viewport gives storefront media queries, vw and vh their device dimensions.
// React's portal keeps editor state and handlers without loading a second application.
export default function CanvasFrame({children, height}) {
  const frame = useRef(null);
  const [target, setTarget] = useState(null);
  useEffect(() => {
    if (!target) return;
    const source = frame.current.ownerDocument;
    const destination = target.ownerDocument;
    const copies = new Map();
    const sync = () => {
      const styles = [...source.querySelectorAll('link[rel="stylesheet"], head > style')];
      for (const [original, copy] of copies) if (!styles.includes(original)) {copy.remove();copies.delete(original);}
      for (const original of styles) {
        let copy = copies.get(original);
        if (!copy) {copy = original.cloneNode(true);copies.set(original,copy);destination.head.appendChild(copy);}
        else if (copy.tagName === 'STYLE' && copy.textContent !== original.textContent) copy.textContent = original.textContent;
      }
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(source.head,{childList:true,subtree:true,characterData:true});
    return () => {observer.disconnect();for (const copy of copies.values()) copy.remove();};
  }, [target]);
  return <iframe ref={frame} title="Site önizlemesi" className="bePreviewIframe" style={{height}} srcDoc={FRAME_DOCUMENT} onLoad={() => setTarget(frame.current?.contentDocument?.getElementById('canvas-root') || null)}>{target && createPortal(children,target)}</iframe>;
}
