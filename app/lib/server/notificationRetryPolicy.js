export function notificationRetryDecision(attempts,now=Date.now()){
 const rows=Array.isArray(attempts)?attempts:[];
 if(!rows.length)return {send:true,reason:'first_attempt'};
 const latest=rows[0];
 if(latest.outcome==='sent')return {send:false,reason:'provider_accepted_review'};
 if(rows.length>=5)return {send:false,reason:'max_attempts_review'};
 if(latest.error_code==='network_error')return {send:false,reason:'unknown_delivery_review'};
 const code=Number(String(latest.error_code||'').replace(/^http_/,''));
 if(![408,409,425,429,500,502,503,504].includes(code))return {send:false,reason:'permanent_error_review'};
 const time=Date.parse(latest.attempted_at);
 if(!Number.isFinite(time))return {send:false,reason:'invalid_history_review'};
 const cooldownMinutes=[5,15,60,240][Math.min(rows.length-1,3)];
 if(now-time<cooldownMinutes*60000)return {send:false,reason:'retry_cooldown'};
 return {send:true,reason:'retry_due'};
}
