// Local cart prices are estimates; only a complete server quote enables checkout.
export function isValidCartQuote(value){
 if(!value||Array.isArray(value)||typeof value!=='object')return false;
 const amount=n=>(typeof n==='number'||(typeof n==='string'&&n.trim()!==''))&&Number.isFinite(Number(n))&&Number(n)>=0;
 return ['subtotal','total'].every(key=>amount(value[key]))
  && ['shipping_total','discount_total','support_total'].every(key=>value[key]==null||amount(value[key]));
}
export function parseOrderNumber(value){
 const match=String(value||'').trim().match(/^(?:#?SII[- ]?)?0*([1-9]\d*)$/i);
 const number=match?Number(match[1]):NaN;
 return Number.isSafeInteger(number)&&number>0?number:null;
}
