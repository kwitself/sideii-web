import {safeUrl} from './builder-url.js';
const marks=['bold','italic','underline','color','href'];
const same=(a,b)=>marks.every(k=>a[k]===b[k]);
export function normalizeRuns(runs) {const out=[];for(const run of runs){if(!run.text)continue;const last=out.at(-1);if(last&&same(last,run))last.text+=run.text;else out.push({...run});}return out;}
export function validateRuns(runs,plain,links=true) {
  if(!Array.isArray(runs)||runs.length>200||runs.some(r=>!r||typeof r!=='object'||Array.isArray(r)||typeof r.text!=='string'||Object.keys(r).some(k=>k!=='text'&&!marks.includes(k))))throw new Error('Geçersiz biçimli metin.');
  if(runs.map(r=>r.text).join('')!==plain)throw new Error('Metin ve biçimlendirme eşleşmiyor.');
  for(const r of runs){for(const k of ['bold','italic','underline'])if(r[k]!==undefined&&typeof r[k]!=='boolean')throw new Error('Geçersiz metin biçimi.');if(r.color&&!/^#[a-fA-F0-9]{6}$/.test(r.color))throw new Error('Geçersiz metin rengi.');if(r.href&&(!links||!safeUrl(r.href)))throw new Error('Geçersiz metin bağlantısı.');}
  return normalizeRuns(runs);
}
export function formatSelection(runs,start,end,patch) {
  let offset=0;const result=[];
  for(const run of runs){const a=offset,b=offset+run.text.length;offset=b;if(b<=start||a>=end){result.push(run);continue;}if(start>a)result.push({...run,text:run.text.slice(0,start-a)});const middle={...run,text:run.text.slice(Math.max(0,start-a),Math.min(b,end)-a)};for(const [k,v]of Object.entries(patch)){if(v===null||v===false||v==='')delete middle[k];else middle[k]=v;}result.push(middle);if(end<b)result.push({...run,text:run.text.slice(end-a)});}
  return normalizeRuns(result);
}
export function runsFromDom(root) {
  const out=[];
  function walk(node,style={}){
    if(node.nodeType===3){out.push({text:node.textContent,...style});return;}
    if(node.nodeType!==1||['SCRIPT','STYLE','IFRAME','OBJECT'].includes(node.tagName))return;
    if(node.tagName==='BR'){out.push({text:'\n',...style});return;}
    const next={...style};
    if(['B','STRONG'].includes(node.tagName)||node.style.fontWeight==='700')next.bold=true;
    if(['I','EM'].includes(node.tagName)||node.style.fontStyle==='italic')next.italic=true;
    if(node.tagName==='U'||node.style.textDecoration==='underline')next.underline=true;
    if(node.dataset.color)next.color=node.dataset.color;
    if(node.tagName==='A'&&safeUrl(node.getAttribute('href')))next.href=node.getAttribute('href');
    if(['DIV','P'].includes(node.tagName)&&out.length&&out.at(-1).text.at(-1)!=='\n')out.push({text:'\n'});
    for(const child of node.childNodes)walk(child,next);
  }
  for(const child of root.childNodes)walk(child);return normalizeRuns(out);
}
