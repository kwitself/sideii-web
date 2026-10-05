'use client';
import {useEffect,useMemo,useState} from 'react';
import {usePathname} from 'next/navigation';
import {supabase} from '../lib/supabase';
import {readCart,writeCart} from '../lib/cart';
import TurkeyAddressFields from './TurkeyAddressFields';
const fmt=n=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY',maximumFractionDigits:0}).format(Number(n||0));
const promoErrorMessage=m=>{
 const s=String(m||'');
 if(/usage limit/i.test(s))return 'This code has reached its usage limit.';
 if(/expired/i.test(s))return 'This code has expired.';
 if(/inactive/i.test(s))return 'This code is currently inactive.';
 if(/not started/i.test(s))return 'This code is not active yet.';
 if(/minimum not met/i.test(s)){const a=s.match(/:\s*([0-9.]+)/)?.[1];return a?'This code requires a minimum basket of ₺'+Number(a).toLocaleString('tr-TR')+'.':'Your basket does not meet the minimum for this code.'}
 if(/quantity minimum/i.test(s)){const a=s.match(/:\s*(\d+)/)?.[1];return a?'This code requires at least '+a+' eligible items.':'This code requires more eligible items.'}
 if(/not applicable/i.test(s))return 'This code does not apply to the items in your bag.';
 if(/first order only/i.test(s))return 'This code is valid for first orders only.';
 if(/customer limit reached/i.test(s))return 'You have already used this code the maximum number of times.';
 if(/requires customer email/i.test(s))return 'Enter your email at checkout to validate this code.';
 return 'This code is not valid.';
};
export default function GlobalBag(){
 const pathname=usePathname(),[cart,setCart]=useState([]),[open,setOpen]=useState(false),[checkout,setCheckout]=useState(false),[busy,setBusy]=useState(false),[done,setDone]=useState(null),[error,setError]=useState(''),[quote,setQuote]=useState(null),[promoInput,setPromoInput]=useState(''),[promoCode,setPromoCode]=useState(''),[promoBusy,setPromoBusy]=useState(false),[quoteError,setQuoteError]=useState('');
 const[form,setForm]=useState({name:'',email:'',phone:'',address:'',city:'',district:'',postal:'',notes:''});
 const[invoice,setInvoice]=useState({type:'individual',company:'',tax_office:'',tax_number:'',same_as_shipping:true,address:''});
 const[accountProfile,setAccountProfile]=useState(null);
 const[savedAddresses,setSavedAddresses]=useState([]),[selectedAddressId,setSelectedAddressId]=useState('');
 const[cartUser,setCartUser]=useState(null),[cartSyncReady,setCartSyncReady]=useState(false);
 async function loadSavedAddresses(){
  if(!supabase)return;
  const {data:s}=await supabase.auth.getSession();
  const user=s.session?.user;
  if(!user){setSavedAddresses([]);setSelectedAddressId('');return}
  const {data}=await supabase.from('customer_addresses').select('id,label,full_name,phone,address_line,city,district,postal_code,is_default').eq('user_id',user.id).order('is_default',{ascending:false}).order('created_at',{ascending:true});
  const rows=Array.isArray(data)?data:[];
  setSavedAddresses(rows);
  const def=rows.find(x=>x.is_default)||rows[0];
  if(def&&!selectedAddressId)setSelectedAddressId(def.id);
 }
 function applySavedAddress(a){
  if(!a)return;
  setSelectedAddressId(a.id||'');
  setForm(v=>({...v,
   name:a.full_name||v.name,
   phone:a.phone||v.phone,
   address:a.address_line||v.address,
   city:a.city||v.city,
   district:a.district||v.district,
   postal:a.postal_code||v.postal
  }));
 }
 useEffect(()=>{loadSavedAddresses()},[]);

 useEffect(()=>{const sync=e=>setCart(e?.detail||readCart());const openBag=()=>setOpen(true);const account=e=>{setAccountProfile(e?.detail||null);loadSavedAddresses()};const address=e=>{const a=e?.detail;if(!a)return;setForm(v=>({...v,name:a.full_name||v.name,phone:a.phone||v.phone,address:a.address_line||v.address,city:a.city||v.city,district:a.district||v.district,postal:a.postal_code||v.postal}));setOpen(true);setCheckout(true)};sync();window.addEventListener('sideii-cart',sync);window.addEventListener('sideii-open-bag',openBag);window.addEventListener('sideii-account-profile',account);window.addEventListener('sideii-checkout-address',address);return()=>{window.removeEventListener('sideii-cart',sync);window.removeEventListener('sideii-open-bag',openBag);window.removeEventListener('sideii-account-profile',account);window.removeEventListener('sideii-checkout-address',address)}},[]);

 useEffect(()=>{
  if(!supabase)return;
  let live=true;
  const mergeCarts=(local,remote)=>{
   const map=new Map();
   for(const item of [...(remote||[]),...(local||[])]){
    const key=String(item.key||item.variantId||item.sku||'');
    if(!key)continue;
    const prev=map.get(key);
    if(!prev)map.set(key,item);
    else map.set(key,{...prev,...item,qty:Math.max(Number(prev.qty||1),Number(item.qty||1))});
   }
   return [...map.values()];
  };
  const load=async()=>{
   const {data:s}=await supabase.auth.getSession();
   if(!live)return;
   const user=s.session?.user||null;
   setCartUser(user);
   if(!user){setCartSyncReady(false);return}
   const local=readCart();
   const {data:row}=await supabase.from('customer_saved_cart').select('cart').eq('user_id',user.id).maybeSingle();
   if(!live)return;
   const merged=mergeCarts(local,Array.isArray(row?.cart)?row.cart:[]);
   setCart(merged);writeCart(merged);
   await supabase.from('customer_saved_cart').upsert({user_id:user.id,cart:merged,updated_at:new Date().toISOString()},{onConflict:'user_id'});
   window.dispatchEvent(new CustomEvent('sideii-saved-cart',{detail:merged}));
   setCartSyncReady(true);
  };
  load();
  const {data:sub}=supabase.auth.onAuthStateChange((event,s)=>{
   if(!live)return;
   const user=s?.user||null;
   setCartUser(user);
   if(event==='SIGNED_IN'&&user)setTimeout(load,0);
   if(event==='SIGNED_OUT'){
    setCartSyncReady(false);
    setCart([]);
    writeCart([]);
    window.dispatchEvent(new CustomEvent('sideii-saved-cart',{detail:[]}));
   }
  });
  return()=>{live=false;sub.subscription.unsubscribe()};
 },[]);

 useEffect(()=>{
  if(!supabase||!cartUser||!cartSyncReady)return;
  const timer=setTimeout(async()=>{
   await supabase.from('customer_saved_cart').upsert({user_id:cartUser.id,cart,updated_at:new Date().toISOString()},{onConflict:'user_id'});
   window.dispatchEvent(new CustomEvent('sideii-saved-cart',{detail:cart}));
  },350);
  return()=>clearTimeout(timer);
 },[cart,cartUser,cartSyncReady]);
 const localSubtotal=useMemo(()=>cart.reduce((s,x)=>s+x.price*x.qty,0),[cart]),physical=cart.some(x=>!x.digital),digital=cart.some(x=>x.digital),subtotal=quote?Number(quote.subtotal):localSubtotal,discount=quote?Number(quote.discount_total||0):0,shipping=quote?Number(quote.shipping_total):0,total=quote?Number(quote.total):subtotal-discount+shipping,orderType=physical&&digital?'MIXED ORDER':physical?'PHYSICAL ORDER':'DIGITAL ORDER',update=n=>{setCart(n);writeCart(n)};
 function cartItemId(x){return String(x?.key||x?.variantId||x?.sku||'')}
 function removeItem(item){
  const id=cartItemId(item);
  const current=readCart();
  const source=current.length?current:cart;
  const next=source.filter(y=>cartItemId(y)!==id);
  setCart(next);
  writeCart(next);
  setQuote(null);
  if(supabase&&cartUser&&cartSyncReady){
   supabase.from('customer_saved_cart').upsert({user_id:cartUser.id,cart:next,updated_at:new Date().toISOString()},{onConflict:'user_id'});
   window.dispatchEvent(new CustomEvent('sideii-saved-cart',{detail:next}));
  }
 }
 useEffect(()=>{let live=true;if(!supabase||cart.length===0){setQuote(null);return()=>{live=false}};const timer=setTimeout(async()=>{const items=cart.map(x=>({variant_id:x.variantId,quantity:x.qty}));const {data,error}=await supabase.rpc('quote_store_order_v4',{p_items:items,p_promo_code:promoCode||null,p_email:form.email.trim()||null});if(!live)return;if(error){const msg=promoErrorMessage(error.message);if(promoCode&&/requires customer email/i.test(String(error.message||''))){const base=await supabase.rpc('quote_store_order_v4',{p_items:items,p_promo_code:null,p_email:form.email.trim()||null});if(!live)return;if(!base.error)setQuote(base.data);setQuoteError(msg);return}setQuote(null);if(promoCode)setQuoteError(msg);return}setQuote(data);setQuoteError('')},120);return()=>{live=false;clearTimeout(timer)}},[cart,promoCode,form.email]);
 async function applyPromo(){
  const code=promoInput.trim().toUpperCase();
  if(!code){setPromoCode('');setPromoInput('');setQuoteError('');return}
  setPromoBusy(true);setQuoteError('');
  const items=cart.map(x=>({variant_id:x.variantId,quantity:x.qty}));
  const {data,error}=await supabase.rpc('quote_store_order_v4',{p_items:items,p_promo_code:code,p_email:form.email.trim()||null});
  setPromoBusy(false);
  if(error){
    const msg=promoErrorMessage(error.message);
    if(/requires customer email/i.test(String(error.message||''))){
      const base=await supabase.rpc('quote_store_order_v4',{p_items:items,p_promo_code:null,p_email:form.email.trim()||null});
      if(!base.error)setQuote(base.data);
      setPromoCode(code);setPromoInput(code);setQuoteError(msg);return;
    }
    setQuoteError(msg);return;
  }
  setPromoCode(code);setPromoInput(code);setQuote(data);
 }
 async function removePromo(){setPromoCode('');setPromoInput('');setQuoteError('');setQuote(null)}
 function openCheckout(){
  setError('');
  const chosen=savedAddresses.find(x=>x.id===selectedAddressId)||savedAddresses.find(x=>x.is_default)||savedAddresses[0]||null;
  setForm(v=>{
   const base=accountProfile?{
    ...v,
    email:accountProfile.email||v.email,
    name:accountProfile.full_name||v.name,
    phone:accountProfile.phone||v.phone,
    address:accountProfile.address_line||v.address,
    city:accountProfile.city||v.city,
    district:accountProfile.district||v.district,
    postal:accountProfile.postal_code||v.postal
   }:v;
   return chosen?{...base,
    name:chosen.full_name||base.name,
    phone:chosen.phone||base.phone,
    address:chosen.address_line||base.address,
    city:chosen.city||base.city,
    district:chosen.district||base.district,
    postal:chosen.postal_code||base.postal
   }:base;
  });
  if(chosen)setSelectedAddressId(chosen.id);
  setCheckout(true);
 }
 async function placeOrder(e){e.preventDefault();setError('');const email=form.email.trim(),phone=form.phone.replace(/\s|\(|\)|-/g,'');if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return setError('Enter a valid email address.');if(physical&&!/^(?:\+90|0)?5\d{9}$/.test(phone))return setError('Enter a valid Turkish mobile number.');if(physical&&form.address.trim().length<10)return setError('Enter a complete delivery address.');if(physical&&(!form.city||!form.district))return setError('Select city and district.');if(!supabase)return setError('Store connection unavailable.');setBusy(true);const address=physical?{line1:form.address,city:form.city,district:form.district,postal_code:form.postal,country:'TR'}:null;const items=cart.map(x=>({variant_id:x.variantId,quantity:x.qty}));const invoicePayload={type:invoice.type,company:invoice.type==='company'?invoice.company.trim():null,tax_office:invoice.type==='company'?invoice.tax_office.trim():null,tax_number:invoice.type==='company'?invoice.tax_number.trim():null,address:invoice.same_as_shipping?address:(invoice.address.trim()?{line1:invoice.address.trim()}:null)};const {data,error:rpcError}=await supabase.rpc('create_store_order_v4',{p_email:email,p_full_name:form.name.trim(),p_phone:physical?phone:null,p_address:address,p_notes:form.notes||null,p_items:items,p_promo_code:promoCode||null,p_invoice:invoicePayload});setBusy(false);if(rpcError)return setError(rpcError.message);setDone(data);update([]);setCheckout(false);try{fetch('/api/orders/notify',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({order_id:data?.order_id,email})})}catch{}}
 const close=()=>{setOpen(false);setCheckout(false);setError('')};
 return <>{!open&&<button className="globalBagTrigger" onClick={()=>{setDone(null);setOpen(true)}}>BAG · {cart.reduce((s,x)=>s+x.qty,0)}</button>}<aside className={'globalBagDrawer '+(open?'open':'')}><button className="globalBagClose" onClick={close}>CLOSE ×</button><span>SHOPPING BAG</span>
 {done?<div className="orderDone"><b>ORDER RECEIVED</b><strong>#SII-{String(done.order_no).padStart(4,'0')}</strong><p>{fmt(done.total)}</p><small>Payment is not collected yet.</small></div>
 :checkout?<form className="checkoutForm globalCheckout" onSubmit={placeOrder}><h3>Checkout</h3>{physical&&savedAddresses.length>0&&<div className="checkoutSavedAddresses">
  <div className="checkoutSavedAddressHead"><span>SAVED ADDRESS</span><small>{savedAddresses.length}</small></div>
  <select className="checkoutSavedAddressSelect" value={selectedAddressId} onChange={e=>{const a=savedAddresses.find(x=>x.id===e.target.value);if(a)applySavedAddress(a)}}>
    {savedAddresses.map(a=><option key={a.id} value={a.id}>{a.label||'ADDRESS'}{a.is_default?' · DEFAULT':''} · {[a.district,a.city].filter(Boolean).join(' / ')}</option>)}
  </select>
  {(()=>{const a=savedAddresses.find(x=>x.id===selectedAddressId)||savedAddresses[0];return a?<div className="checkoutSavedAddressPreview"><b>{a.label||'ADDRESS'}</b><small>{a.full_name||''}{a.phone?' · '+a.phone:''}</small><p>{a.address_line}</p><p>{[a.district,a.city,a.postal_code].filter(Boolean).join(' · ')}</p></div>:null})()}
 </div>}<label>EMAIL<input type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label><label>FULL NAME<input required={physical} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label>PHONE<input required={physical} value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label>{physical&&<><label>ADDRESS<textarea required value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/></label><TurkeyAddressFields form={form} setForm={setForm}/><label>POSTAL CODE<input value={form.postal} onChange={e=>setForm({...form,postal:e.target.value})}/></label></>}<section className="checkoutInvoice"><div className="checkoutSavedAddressHead"><span>INVOICE / TAX INFO</span><small>{invoice.type==='company'?'COMPANY':'INDIVIDUAL'}</small></div><div className="checkoutInvoiceType"><button type="button" className={invoice.type==='individual'?'active':''} onClick={()=>setInvoice({...invoice,type:'individual'})}>INDIVIDUAL</button><button type="button" className={invoice.type==='company'?'active':''} onClick={()=>setInvoice({...invoice,type:'company'})}>COMPANY</button></div>{invoice.type==='company'&&<><label>COMPANY NAME<input required value={invoice.company} onChange={e=>setInvoice({...invoice,company:e.target.value})}/></label><div className="checkoutSplit"><label>TAX OFFICE<input value={invoice.tax_office} onChange={e=>setInvoice({...invoice,tax_office:e.target.value})}/></label><label>TAX NUMBER<input required value={invoice.tax_number} onChange={e=>setInvoice({...invoice,tax_number:e.target.value})}/></label></div></>}<label className="checkoutInvoiceCheck"><input type="checkbox" checked={invoice.same_as_shipping} onChange={e=>setInvoice({...invoice,same_as_shipping:e.target.checked})}/><span>USE DELIVERY ADDRESS FOR INVOICE</span></label>{!invoice.same_as_shipping&&<label>INVOICE ADDRESS<textarea value={invoice.address} onChange={e=>setInvoice({...invoice,address:e.target.value})}/></label>}</section><label>ORDER NOTE<textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label>{error&&<p className="checkoutError">{error}</p>}{physical&&quote?.free_shipping_threshold&&Number(quote.free_shipping_threshold)>0&&<div className="freeShippingProgress checkoutProgress"><div><span>{Number(quote.free_shipping_remaining||0)>0?fmt(quote.free_shipping_remaining)+' TO FREE SHIPPING':'FREE SHIPPING UNLOCKED'}</span><small>{fmt(quote.free_shipping_threshold)}</small></div><i><b style={{width:Math.min(100,Math.max(0,(Number(quote.subtotal||0)/Number(quote.free_shipping_threshold))*100))+'%'}}/></i></div>}<div className="checkoutSummary"><div className="checkoutSummaryHead"><span>ORDER SUMMARY</span><small>{orderType}</small></div>{cart.map(x=><div className="checkoutSummaryItem" key={x.key}><span>{x.title}<small>{x.format} · QTY {x.qty}</small></span><strong>{fmt(x.price*x.qty)}</strong></div>)}<div className="checkoutSummaryRow"><span>SUBTOTAL</span><strong>{fmt(subtotal)}</strong></div>{quote?.campaign_name&&<div className="checkoutSummaryRow checkoutSummaryDiscount"><span>CAMPAIGN · {quote.campaign_name}</span><strong>{Number(quote?.campaign_discount_total||0)>0?'−'+fmt(quote.campaign_discount_total):shipping===0&&physical?'FREE SHIPPING':'APPLIED'}</strong></div>}{Number(quote?.promo_discount_total||0)>0&&<div className="checkoutSummaryRow checkoutSummaryDiscount"><span>DISCOUNT · {promoCode}</span><strong>−{fmt(quote.promo_discount_total)}</strong></div>}<div className="checkoutSummaryRow"><span>SHIPPING</span><strong>{physical?(quote?(shipping>0?fmt(shipping):'FREE'):'CALCULATING…'):'NOT REQUIRED'}</strong></div><div className="checkoutSummaryRow checkoutSummaryTotal"><span>TOTAL</span><strong>{fmt(total)}</strong></div></div><button className="globalBagCheckout" disabled={busy}>{busy?'CREATING ORDER…':'PLACE ORDER'}</button><button type="button" className="checkoutBack" onClick={()=>setCheckout(false)}>← BACK TO BAG</button></form>
 :cart.length===0?<p className="globalBagEmpty">Your bag is empty.</p>:<><div className="globalBagItems">{cart.map(x=><article key={x.key}>{x.cover&&<img src={x.cover} alt=""/>}<div><b>{x.title}</b><small>{x.format}{x.digital?' · DOWNLOAD':''}{x.preorderEnabled&&Number(x.stock||0)<=0?' · PRE-ORDER':''}{x.editionNumberingEnabled&&x.editionTotal?' · LIMITED '+x.editionTotal:''}</small><div className="globalBagQty"><button type="button" onClick={()=>update(cart.map(y=>y.key===x.key?{...y,qty:Math.max(1,y.qty-1)}:y))}>−</button><span>{x.qty}</span><button type="button" disabled={!x.preorderEnabled&&x.stock!=null&&x.qty>=x.stock} onClick={()=>update(cart.map(y=>y.key===x.key?{...y,qty:(y.stock==null||y.preorderEnabled)?y.qty+1:Math.min(y.qty+1,y.stock)}:y))}>＋</button><button type="button" onClick={e=>{e.preventDefault();e.stopPropagation();removeItem(x)}}>REMOVE</button></div></div><strong>{fmt(x.price*x.qty)}</strong></article>)}</div><div className="promoBox"><div className="promoLabel"><span>GIFT / PROMO CODE</span>{promoCode&&<button type="button" onClick={removePromo}>REMOVE</button>}</div><div className="promoEntry"><input value={promoInput} placeholder="ENTER CODE" onChange={e=>setPromoInput(e.target.value.toUpperCase())}/><button type="button" disabled={promoBusy||!promoInput.trim()} onClick={applyPromo}>{promoBusy?'CHECKING…':promoCode?'UPDATE':'APPLY'}</button></div>{promoCode&&quote&&!quoteError&&<small>CODE {promoCode} APPLIED</small>}</div>{physical&&quote?.free_shipping_threshold&&Number(quote.free_shipping_threshold)>0&&<div className="freeShippingProgress"><div><span>{Number(quote.free_shipping_remaining||0)>0?fmt(quote.free_shipping_remaining)+' TO FREE SHIPPING':'FREE SHIPPING UNLOCKED'}</span><small>{fmt(quote.free_shipping_threshold)}</small></div><i><b style={{width:Math.min(100,Math.max(0,(Number(quote.subtotal||0)/Number(quote.free_shipping_threshold))*100))+'%'}}/></i></div>}<div className="globalBagTotal"><span>SUBTOTAL</span><strong>{fmt(localSubtotal)}</strong></div>{quote?.campaign_name&&<div className="cartDiscount"><span>CAMPAIGN · {quote.campaign_name}</span><strong>{Number(quote?.campaign_discount_total||0)>0?'−'+fmt(quote.campaign_discount_total):shipping===0&&physical?'FREE SHIPPING':'APPLIED'}</strong></div>}{Number(quote?.promo_discount_total||0)>0&&<div className="cartDiscount"><span>DISCOUNT · {promoCode}</span><strong>−{fmt(quote.promo_discount_total)}</strong></div>}{physical&&quote&&<div className="cartShipping"><span>SHIPPING</span><strong>{shipping>0?fmt(shipping):'FREE'}</strong></div>}{quoteError&&<p className="checkoutError">{quoteError}</p>}<button className="globalBagCheckout" disabled={!!quoteError&&!/Enter your email at checkout/i.test(quoteError)} onClick={openCheckout}>{quoteError&&/Enter your email at checkout/i.test(quoteError)?'CONTINUE TO CHECKOUT →':quoteError?'UNAVAILABLE':'CHECKOUT →'}</button></>}</aside>{open&&<button className="globalBagShade" aria-label="Close bag" onClick={close}/>}</>
}