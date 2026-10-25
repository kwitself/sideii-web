'use client';
import {useEffect,useState,useRef} from 'react';
export default function BufferedField({value = '', onCommit, label, multiline = false, type = 'text', ...props}) {
  const [draft, setDraft] = useState(String(value));
  const cancelled = useRef(false);
  useEffect(() => setDraft(String(value)), [value]);
  const Input = multiline ? 'textarea' : 'input';
  return <label className="beField"><span>{label}</span><Input aria-label={label} {...props} type={multiline ? undefined : type} value={draft} onChange={event => setDraft(event.target.value)} onBlur={() => {if(cancelled.current){cancelled.current=false;return;} if (String(value) !== draft) onCommit(draft);}} onKeyDown={event => {if (event.key === 'Enter' && !multiline) event.currentTarget.blur(); if (event.key === 'Escape') {event.stopPropagation();cancelled.current=true;setDraft(String(value)); event.currentTarget.blur();}}}/></label>;
}
