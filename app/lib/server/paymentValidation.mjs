import {createHmac,timingSafeEqual} from 'node:crypto';

export function verifyPaymentSignature(raw,signature,secret){
 if(typeof raw!=='string'||!secret||typeof signature!=='string'||!/^[a-f0-9]{64}$/i.test(signature))return false;
 const expected=createHmac('sha256',secret).update(raw).digest();
 return timingSafeEqual(Buffer.from(signature,'hex'),expected);
}
