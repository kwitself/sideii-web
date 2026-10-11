import {createHmac,timingSafeEqual} from 'node:crypto';

export function verifyResendSignature({body,id,timestamp,signature,secret,now=Date.now()}){
 if(typeof body!=='string'||!id||!timestamp||!signature||!secret?.startsWith('whsec_'))return false;
 if(!/^\\d+$/.test(String(timestamp)))return false;
 const time=Number(timestamp)*1000;
 if(!Number.isSafeInteger(time)||Math.abs(now-time)>300000)return false;
 let key;
 try{key=Buffer.from(secret.slice(6),'base64')}catch{return false}
 if(!key.length)return false;
 const expected=createHmac('sha256',key).update(id+'.'+timestamp+'.'+body).digest();
 for(const candidate of signature.split(' ')){
  if(!candidate.startsWith('v1,'))continue;
  const supplied=Buffer.from(candidate.slice(3),'base64');
  if(supplied.length===expected.length&&timingSafeEqual(supplied,expected))return true;
 }
 return false;
}
