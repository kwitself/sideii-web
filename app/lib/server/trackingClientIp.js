import {isIP} from 'node:net';

export function trackingClientIp(headers,{vercel=false}={}){
 if(!vercel)return 'unknown';
 const raw=headers.get('x-vercel-forwarded-for')||headers.get('x-forwarded-for')||'';
 const candidate=raw.split(',')[0].trim();
 return candidate.length<=45&&isIP(candidate)?candidate:'unknown';
}
