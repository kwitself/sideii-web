'use client';
import {Fragment,useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {formatSelection,runsFromDom,validateRuns} from '../../lib/builder-rich-text';
import {safeUrl} from '../../lib/builder-url';

export function RichTextValue({text,runs}) {
  if(!runs?.length)return String(text||'').split('\n').map((line,i)=><Fragment key={i}>{i>0&&<br/>}{line}</Fragment>);
  return runs.map((r,i)=>{const Tag=r.href?'a':'span';return <Tag key={i} className="pbRichRun" href={r.href} data-color={r.color} style={{'--pb-rich-color':r.color,'--pb-rich-weight':r.bold?'700':undefined,'--pb-rich-style':r.italic?'italic':undefined,'--pb-rich-decoration':r.underline?'underline':undefined,color:r.color,fontWeight:r.bold?700:undefined,fontStyle:r.italic?'italic':undefined,textDecoration:r.underline?'underline':undefined}}>{r.text}</Tag>;});
}
function offsets(root) {
  const s=root.ownerDocument.getSelection();if(!s?.rangeCount||!root.contains(s.anchorNode)||!root.contains(s.focusNode))return null;
  const r=s.getRangeAt(0),before=r.cloneRange();before.selectNodeContents(root);before.setEnd(r.startContainer,r.startOffset);return [before.toString().length,before.toString().length+r.toString().length];
}
function restore(root,[start,end]) {
  const d=root.ownerDocument,walker=d.createTreeWalker(root,4),nodes=[];let node;
  while((node=walker.nextNode()))nodes.push(node);
  const point=index=>{for(const n of nodes){if(index<=n.length)return [n,index];index-=n.length;}return [root,root.childNodes.length];};
  const range=d.createRange();range.setStart(...point(start));range.setEnd(...point(end));const s=d.getSelection();s.removeAllRanges();s.addRange(range);
}
function draw(root,runs) {
  const d=root.ownerDocument;
  root.replaceChildren(...runs.map(r=>{const n=d.createElement(r.href?'a':'span');n.textContent=r.text;n.className='pbRichRun';if(r.href)n.setAttribute('href',r.href);if(r.color){n.dataset.color=r.color;n.style.setProperty('--pb-rich-color',r.color);}if(r.bold){n.style.fontWeight='700';n.style.setProperty('--pb-rich-weight','700');}if(r.italic){n.style.fontStyle='italic';n.style.setProperty('--pb-rich-style','italic');}if(r.underline){n.style.textDecoration='underline';n.style.setProperty('--pb-rich-decoration','underline');}return n;}));
}
export default function InlineText({text='',runs,editing=false,onCommit,allowLinks=true,maxLength=12000,label='Metin'}) {
  const [active,setActive]=useState(false),[error,setError]=useState(''),[href,setHref]=useState(''),[position,setPosition]=useState(null);
  const field=useRef(null),toolbar=useRef(null),selection=useRef([0,0]),finishing=useRef(false);
  useEffect(()=>{
    if(!active)return;finishing.current=false;const root=field.current,d=root.ownerDocument;
    draw(root,runs?.length?runs:[{text}]);root.focus();restore(root,[0,text.length]);selection.current=[0,text.length];
    const remember=()=>{const value=offsets(root);if(value)selection.current=value;};
    const place=()=>{const rect=root.getBoundingClientRect();setPosition({left:Math.max(8,Math.min(rect.left,d.defaultView.innerWidth-420)),top:Math.max(8,rect.top-48)});};
    place();d.addEventListener('selectionchange',remember);d.defaultView.addEventListener('scroll',place,true);
    return()=>{d.removeEventListener('selectionchange',remember);d.defaultView.removeEventListener('scroll',place,true);};
  },[active]);
  const finish=cancel=>{
    if(finishing.current)return;
    if(!cancel){try{const next=runsFromDom(field.current),plain=next.map(r=>r.text).join('');if(plain.length>maxLength)throw new Error('En fazla '+maxLength+' karakter kullanılabilir.');validateRuns(next,plain,allowLinks);onCommit?.(plain,next);}catch(e){setError(e.message);return;}}
    finishing.current=true;field.current?.replaceChildren();setActive(false);setError('');
  };
  const apply=patch=>{try{const root=field.current,next=formatSelection(runsFromDom(root),...selection.current,patch);validateRuns(next,next.map(r=>r.text).join(''),allowLinks);draw(root,next);root.focus();restore(root,selection.current);setError('');}catch(e){setError(e.message);}};
  if(!editing)return <RichTextValue text={text} runs={runs}/>;
  return <><span ref={field} className={'pbInlineField'+(active?' pbInlineActive':'')} contentEditable={active} suppressContentEditableWarning role={active?'textbox':undefined} aria-label={active?label:undefined} aria-multiline={active||undefined} onDoubleClick={e=>{e.preventDefault();e.stopPropagation();setActive(true);}} onBlur={()=>{setTimeout(()=>{const focused=field.current?.ownerDocument.activeElement;if(active&&!field.current?.contains(focused)&&!toolbar.current?.contains(focused))finish(false);},0);}} onPaste={e=>{if(!active)return;e.preventDefault();const root=field.current,s=root.ownerDocument.getSelection();if(!s?.rangeCount)return;const range=s.getRangeAt(0);range.deleteContents();const n=root.ownerDocument.createTextNode(e.clipboardData.getData('text/plain'));range.insertNode(n);range.setStartAfter(n);range.collapse(true);s.removeAllRanges();s.addRange(range);}} onKeyDown={e=>{if(!active)return;e.stopPropagation();if(e.key==='Escape'){e.preventDefault();finish(true);}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();finish(false);return;}if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();finish(false);}}}>{!active&&<RichTextValue text={text} runs={runs}/>}</span>
    {active&&position&&createPortal(<div ref={toolbar} className="pbTextToolbar" role="toolbar" aria-label="Metin biçimlendirme" style={position} onPointerDown={e=>{e.stopPropagation();if(e.target.tagName==='BUTTON')e.preventDefault();}}>
      <button type="button" aria-label="Seçili metni kalın yap" onClick={()=>apply({bold:true})}><b>B</b></button><button type="button" aria-label="Seçili metni italik yap" onClick={()=>apply({italic:true})}><i>I</i></button><button type="button" aria-label="Seçili metnin altını çiz" onClick={()=>apply({underline:true})}><u>U</u></button><input type="color" aria-label="Seçili metnin rengi" defaultValue="#742633" onChange={e=>apply({color:e.target.value})}/>
      {allowLinks&&<><input type="url" aria-label="Seçili metnin bağlantısı" placeholder="https:// veya /sayfa" value={href} onChange={e=>setHref(e.target.value)}/><button type="button" aria-label="Metin bağlantısını uygula" onClick={()=>href&&!safeUrl(href)?setError('Güvenli bir bağlantı gir.'):apply({href})}>↗</button></>}
      <button type="button" aria-label="Metin biçimini temizle" onClick={()=>apply({bold:null,italic:null,underline:null,color:null,href:null})}>Tx</button><button type="button" onClick={()=>finish(false)}>Bitti</button><button type="button" onClick={()=>finish(true)}>Vazgeç</button>{error&&<span role="alert">{error}</span>}
    </div>,field.current.ownerDocument.body)}
  </>;
}
