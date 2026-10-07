'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {usePathname} from 'next/navigation';
import {supabase} from '../lib/supabase';
import {MAX_CART_LINE_QTY,readCart,writeCart} from '../lib/cart';
import GlobalAddressFields from './GlobalAddressFields';
import {useLocaleCurrency} from './LocaleCurrencyProvider';
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
 if(/Extra support is only available/i.test(s))return 'Extra support is only available on active WWYS products.';
 return 'The bag could not be quoted. Please review the items and try again.';
};
export default function GlobalBag(){
 const drawerRef=useRef(null);
 const {money:fmt,t}=useLocaleCurrency();
 const pathname=usePathname(),[cart,setCart]=useState([]),[open,setOpen]=useState(false),[checkout,setCheckout]=useState(false),[busy,setBusy]=useState(false),[done,setDone]=useState(null),[error,setError]=useState(''),[quote,setQuote]=useState(null),[promoInput,setPromoInput]=useState(''),[promoCode,setPromoCode]=useState(''),[promoBusy,setPromoBusy]=useState(false),[quoteError,setQuoteError]=useState('');
 const[form,setForm]=useState({name:'',email:'',phone:'',address:'',country:'TR',state_region:'',city:'',district:'',postal:'',notes:''});
 const[invoice,setInvoice]=useState({type:'individual',company:'',tax_office:'',tax_number:'',same_as_shipping:true,address:''});
 const[gift,setGift]=useState({enabled:false,message:'',hide_prices:true});
 const[storeValue,setStoreValue]=useState({gift_code:'',gift_valid:false,gift_available:0,use_credit:false,credit_available:0,checking:false,message:''});
 const[accountProfile,setAccountProfile]=useState(null);
 const[savedAddresses,setSavedAddresses]=useState([]),[selectedAddressId,setSelectedAddressId]=useState('');
 const[cartUser,setCartUser]=useState(null),[cartSyncReady,setCartSyncReady]=useState(false);
 async function loadStoreValue(){
  if(!supabase)return;
  const {data:s}=await supabase.auth.getSession();
  const user=s.session?.user;
  if(!user){setStoreValue(v=>({...v,use_credit:false,credit_available:0}));return}
  const {data}=await supabase.rpc('get_my_store_credit');
  const row=Array.isArray(data)?data[0]:data;
  setStoreValue(v=>({...v,credit_available:Number(row?.balance||0)}));
 }
 async function checkGiftCard(){
  const code=storeValue.gift_code.trim();
  if(!code){setStoreValue(v=>({...v,gift_valid:false,gift_available:0,message:''}));return}
  setStoreValue(v=>({...v,checking:true,message:''}));
  const {data,error}=await supabase.rpc('check_gift_card',{p_code:code});
  const row=Array.isArray(data)?data[0]:data;
  if(error||!row?.valid){setStoreValue(v=>({...v,checking:false,gift_valid:false,gift_available:0,message:'Gift card unavailable.'}));return}
  setStoreValue(v=>({...v,checking:false,gift_valid:true,gift_available:Number(row.available_value||0),message:'Gift card ready.'}));
 }
 async function loadSavedAddresses(){
  if(!supabase)return;
  const {data:s}=await supabase.auth.getSession();
  const user=s.session?.user;
  if(!user){setSavedAddresses([]);setSelectedAddressId('');return}
  const {data}=await supabase.from('customer_addresses').select('id,label,full_name,phone,address_line,country_code,state_region,city,district,postal_code,is_default').eq('user_id',user.id).order('is_default',{ascending:false}).order('created_at',{ascending:true});
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
   country:a.country_code||v.country||'TR',
   state_region:a.state_region||'',
   city:a.city||v.city,
   district:a.district||'',
   postal:a.postal_code||v.postal
  }));
 }
 useEffect(()=>{loadSavedAddresses();loadStoreValue()},[]);

 useEffect(()=>{const sync=e=>setCart(e?.detail||readCart());const openBag=()=>setOpen(true);const account=e=>{setAccountProfile(e?.detail||null);loadSavedAddresses()};const address=e=>{const a=e?.detail;if(!a)return;setForm(v=>({...v,name:a.full_name||v.name,phone:a.phone||v.phone,address:a.address_line||v.address,country:a.country_code||v.country||'TR',state_region:a.state_region||'',city:a.city||v.city,district:a.district||'',postal:a.postal_code||v.postal}));setOpen(true);setCheckout(true)};sync();window.addEventListener('sideii-cart',sync);window.addEventListener('sideii-open-bag',openBag);window.addEventListener('sideii-account-profile',account);window.addEventListener('sideii-checkout-address',address);return()=>{window.removeEventListener('sideii-cart',sync);window.removeEventListener('sideii-open-bag',openBag);window.removeEventListener('sideii-account-profile',account);window.removeEventListener('sideii-checkout-address',address)}},[]);

 useEffect(()=>{
  if(!supabase)return;
  let live=true;
  const clampSavedQty=item=>{
   const globalMax=MAX_CART_LINE_QTY;
   const productMax=Number(item?.productMaxQty)>0?Number(item.productMaxQty):globalMax;
   const preorderMax=item?.preorderEnabled&&Number(item?.preorderLimit)>0?Number(item.preorderLimit):globalMax;
   const stockMax=item?.digital||item?.preorderEnabled||item?.stock==null?globalMax:Math.max(0,Number(item.stock||0));
   const max=Math.max(1,Math.min(globalMax,productMax,preorderMax,stockMax||1));
   return {...item,qty:Math.max(1,Math.min(Number(item?.qty||1),max))};
  };
  const mergeCarts=(local,remote)=>{
   const map=new Map();
   for(const raw of [...(remote||[]),...(local||[])]){
    const item=clampSavedQty(raw);
    const key=String(item.key||item.variantId||item.sku||'');
    if(!key)continue;
    const prev=map.get(key);
    if(!prev)map.set(key,item);
    else map.set(key,clampSavedQty({...prev,...item,qty:Math.max(Number(prev.qty||1),Number(item.qty||1))}));
   }
   return [...map.values()];
  };
  const load=async()=>{
   const {data:s}=await supabase.auth.getSession();
   if(!live)return;
   const user=s.session?.user||null;
   setCartUser(user);
   if(user)loadStoreValue();
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
    setStoreValue(v=>({...v,use_credit:false,credit_available:0}));
    const local=readCart();
    setCart(local);
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
 const localSubtotal=useMemo(()=>cart.reduce((s,x)=>s+x.price*x.qty,0),[cart]),localSupport=useMemo(()=>cart.reduce((s,x)=>s+(x.wwysSupportEligible?Number(x.supportAmount||0):0),0),[cart]),physical=cart.some(x=>!x.digital),digital=cart.some(x=>x.digital),subtotal=quote?Number(quote.subtotal):localSubtotal,discount=quote?Number(quote.discount_total||0):0,shipping=quote?Number(quote.shipping_total):0,supportTotal=quote?Number(quote.support_total||0):localSupport,total=quote?Number(quote.total):subtotal-discount+shipping+supportTotal,orderType=physical&&digital?'MIXED ORDER':physical?'PHYSICAL ORDER':'DIGITAL ORDER',update=n=>{setCart(n);writeCart(n)};
 function cartItemId(x){return String(x?.key||x?.variantId||x?.sku||'')}
 function supportEligible(item){
  if(item?.wwysSupportEligible)return true;
  const qItem=Array.isArray(quote?.items)?quote.items.find(x=>String(x.variant_id)===String(item?.variantId)):null;
  return !!qItem?.support_eligible;
 }
 function rpcItems(){return cart.map(x=>({variant_id:x.variantId,quantity:x.qty,support_amount:supportEligible(x)?Math.max(0,Math.min(100000,Number(x.supportAmount||0))):0}))}
 function setSupportAmount(item,value){
  const amount=Math.max(0,Math.min(100000,Number(value||0)));
  update(cart.map(x=>cartItemId(x)===cartItemId(item)?{...x,supportAmount:Math.round(amount*100)/100}:x));
 }
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
 useEffect(()=>{let live=true;if(!supabase||cart.length===0){setQuote(null);return()=>{live=false}};const timer=setTimeout(async()=>{const items=rpcItems();const {data,error}=await supabase.rpc('quote_store_order_v4',{p_items:items,p_promo_code:promoCode||null,p_email:form.email.trim()||null});if(!live)return;if(error){const msg=promoErrorMessage(error.message);if(promoCode&&/requires customer email/i.test(String(error.message||''))){const base=await supabase.rpc('quote_store_order_v4',{p_items:items,p_promo_code:null,p_email:form.email.trim()||null});if(!live)return;if(!base.error)setQuote(base.data);setQuoteError(msg);return}setQuote(null);setQuoteError(msg);return}setQuote(data);setQuoteError('')},120);return()=>{live=false;clearTimeout(timer)}},[cart,promoCode,form.email]);
 async function applyPromo(){
  const code=promoInput.trim().toUpperCase();
  if(!code){setPromoCode('');setPromoInput('');setQuoteError('');return}
  setPromoBusy(true);setQuoteError('');
  const items=rpcItems();
  const {data,error}=await supabase.rpc('quote_store_order_v4',{p_items:items,p_promo_code:code,p_email:form.email.trim()||null});
  setPromoBusy(false);
  if(error){
    const msg=promoErrorMessage(error.message);
    if(/requires customer email/i.test(String(error.message||''))){
      const base=await supabase.rpc('quote_store_order_v4',{p_items:items,p_promo_code:null,p_email:form.email.trim()||null});
      if(!base.error)setQuote(base.data);
      setPromoCode(code);setPromoInput(code);setQuoteError(msg);return;
    }
    setPromoCode('');
    setQuoteError(msg);
    const base=await supabase.rpc('quote_store_order_v4',{p_items:items,p_promo_code:null,p_email:form.email.trim()||null});
    if(!base.error)setQuote(base.data);else setQuote(null);
    return;
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
    country:accountProfile.country_code||v.country||'TR',
    state_region:accountProfile.state_region||'',
    city:accountProfile.city||v.city,
    district:accountProfile.district||'',
    postal:accountProfile.postal_code||v.postal
   }:v;
   return chosen?{...base,
    name:chosen.full_name||base.name,
    phone:chosen.phone||base.phone,
    address:chosen.address_line||base.address,
    country:chosen.country_code||base.country||'TR',
    state_region:chosen.state_region||'',
    city:chosen.city||base.city,
    district:chosen.district||'',
    postal:chosen.postal_code||base.postal
   }:base;
  });
  if(chosen)setSelectedAddressId(chosen.id);
  setCheckout(true);
 }
 async function placeOrder(e){e.preventDefault();if(busy)return;setError('');const email=form.email.trim(),phone=form.phone.replace(/\s|\(|\)|-/g,'');if(form.name.trim().length<2)return setError('Enter your full name.');if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return setError('Enter a valid email address.');if(physical&&form.country==='TR'&&!/^(?:\+90|0)?5\d{9}$/.test(phone))return setError('Enter a valid Turkish mobile number.');if(physical&&form.country!=='TR'&&!/^\+?[0-9]{7,15}$/.test(phone))return setError('Enter a valid international phone number including country code.');if(physical&&form.address.trim().length<10)return setError('Enter a complete delivery address.');if(physical&&!form.city)return setError('Enter a city.');if(physical&&form.country==='TR'&&!form.district)return setError('Select a district.');if(invoice.type==='company'&&invoice.company.trim().length<2)return setError('Enter the company name for the invoice.');if(invoice.type==='company'&&!invoice.tax_office.trim())return setError('Enter the tax office for the invoice.');if(invoice.type==='company'&&invoice.tax_number.trim().length<5)return setError('Enter a valid tax number for the invoice.');if(!invoice.same_as_shipping&&invoice.address.trim().length<10)return setError('Enter a complete invoice address.');if(!supabase)return setError('Store connection unavailable.');setBusy(true);const address=physical?{line1:form.address,city:form.city,district:form.district||null,state_region:form.state_region||null,postal_code:form.postal,country:form.country||'TR'}:null;const items=rpcItems();const invoicePayload={type:invoice.type,company:invoice.type==='company'?invoice.company.trim():null,tax_office:invoice.type==='company'?invoice.tax_office.trim():null,tax_number:invoice.type==='company'?invoice.tax_number.trim():null,address:invoice.same_as_shipping?address:(invoice.address.trim()?{line1:invoice.address.trim()}:null)};let data=null;try{const created=await supabase.rpc('create_store_order_v5',{p_email:email,p_full_name:form.name.trim(),p_phone:physical?phone:null,p_address:address,p_notes:form.notes||null,p_items:items,p_promo_code:promoCode||null,p_invoice:invoicePayload});if(created.error){setError(created.error.message);return}data=created.data;let finalData=data;if(data?.order_id&&(storeValue.gift_valid||storeValue.use_credit)){const {data:valueData,error:valueError}=await supabase.rpc('reserve_order_value',{p_order_id:data.order_id,p_email:email,p_gift_code:storeValue.gift_valid?storeValue.gift_code.trim():null,p_use_store_credit:!!storeValue.use_credit,p_guest_access_token:data.guest_access_token||null});if(valueError){finalData={...finalData,store_value_error:'Order created, but gift card / store credit could not be applied. Do not place the order again.'}}else if(valueData)finalData={...finalData,...valueData}}if(gift.enabled&&data?.order_id){const {error:giftError}=await supabase.rpc('set_order_gift_details',{p_order_id:data.order_id,p_email:email,p_is_gift:true,p_gift_message:gift.message||null,p_hide_prices:!!gift.hide_prices,p_guest_access_token:data.guest_access_token||null});if(giftError)finalData={...finalData,gift_update_error:'Order created, but gift options could not be saved. Do not place the order again.'}}setDone(finalData);setStoreValue(v=>({...v,gift_code:'',gift_valid:false,gift_available:0,use_credit:false,message:''}));update([]);setCheckout(false);try{fetch('/api/orders/notify-v2',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({order_id:data?.order_id,notification_token:data?.notification_token,type:'received'})})}catch{}}finally{setBusy(false)}}
 const close=()=>{setOpen(false);setCheckout(false);setError('')};
 useEffect(()=>{if(!open)return;
  const previousOverflow=document.body.style.overflow;
  const previousFocus=document.activeElement;
  document.body.style.overflow='hidden';
  const node=drawerRef.current;
  const focusables=()=>node?[...node.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')]:[];
  requestAnimationFrame(()=>focusables()[0]?.focus());
  const onKey=e=>{
   if(e.key==='Escape'){close();return}
   if(e.key!=='Tab')return;
   const items=focusables();if(!items.length)return;
   const first=items[0],last=items[items.length-1];
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
  };
  window.addEventListener('keydown',onKey);
  return()=>{document.body.style.overflow=previousOverflow;window.removeEventListener('keydown',onKey);requestAnimationFrame(()=>previousFocus?.focus?.())}
 },[open]);
 return <>{!open&&<button className="globalBagTrigger" aria-haspopup="dialog" aria-expanded={open} aria-label={`${t('BAG')} · ${cart.reduce((s,x)=>s+x.qty,0)}`} onClick={()=>{setDone(null);setOpen(true)}}>{t('BAG')} · {cart.reduce((s,x)=>s+x.qty,0)}</button>}<aside ref={drawerRef} className={'globalBagDrawer '+(open?'open':'')} role="dialog" aria-modal="true" aria-label={t('SHOPPING BAG')} aria-hidden={!open}><button className="globalBagClose" onClick={close}>{t('CLOSE')} ×</button><span>{t('SHOPPING BAG')}</span>
 {done?<div className="orderDone"><b>{t('ORDER RECEIVED')}</b><strong>#SII-{String(done.order_no).padStart(4,'0')}</strong><p>{fmt(done.total)}</p><small>Payment is not collected yet.</small>{Number(done.support_total||0)>0&&<em className="orderDoneSupport">EXTRA SUPPORT · +{fmt(done.support_total)}</em>}{done.store_value_total>0&&<em className="orderDoneStoreValue">{t('STORE VALUE APPLIED')} · {fmt(done.store_value_total)}</em>}{done.store_value_error&&<em className="orderDoneStoreValue error">{done.store_value_error}</em>}{done.gift_update_error&&<em className="orderDoneStoreValue error">{done.gift_update_error}</em>}</div>
 :checkout?<form className="checkoutForm globalCheckout" onSubmit={placeOrder}><h3>{t('Checkout')}</h3>{physical&&savedAddresses.length>0&&<div className="checkoutSavedAddresses">
  <div className="checkoutSavedAddressHead"><span>{t('SAVED ADDRESS')}</span><small>{savedAddresses.length}</small></div>
  <select className="checkoutSavedAddressSelect" value={selectedAddressId} onChange={e=>{const a=savedAddresses.find(x=>x.id===e.target.value);if(a)applySavedAddress(a)}}>
    {savedAddresses.map(a=><option key={a.id} value={a.id}>{a.label||'ADDRESS'}{a.is_default?' · DEFAULT':''} · {[a.district||a.state_region,a.city,a.country_code&&a.country_code!=='TR'?a.country_code:null].filter(Boolean).join(' / ')}</option>)}
  </select>
  {(()=>{const a=savedAddresses.find(x=>x.id===selectedAddressId)||savedAddresses[0];return a?<div className="checkoutSavedAddressPreview"><b>{a.label||'ADDRESS'}</b><small>{a.full_name||''}{a.phone?' · '+a.phone:''}</small><p>{a.address_line}</p><p>{[a.district||a.state_region,a.city,a.postal_code,a.country_code&&a.country_code!=='TR'?a.country_code:null].filter(Boolean).join(' · ')}</p></div>:null})()}
 </div>}<label>{t('EMAIL')}<input type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label><label>{t('FULL NAME')}<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label>{t('PHONE')}<input required={physical} value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label>{physical&&<><label>{t('ADDRESS')}<textarea required value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/></label><GlobalAddressFields form={form} setForm={setForm}/><label>{t('POSTAL CODE')}<input value={form.postal} onChange={e=>setForm({...form,postal:e.target.value})}/></label></>}<section className="checkoutInvoice"><div className="checkoutSavedAddressHead"><span>{t('INVOICE / TAX INFO')}</span><small>{invoice.type==='company'?'COMPANY':'INDIVIDUAL'}</small></div><div className="checkoutInvoiceType"><button type="button" className={invoice.type==='individual'?'active':''} onClick={()=>setInvoice({...invoice,type:'individual'})}>{t('INDIVIDUAL')}</button><button type="button" className={invoice.type==='company'?'active':''} onClick={()=>setInvoice({...invoice,type:'company'})}>{t('COMPANY')}</button></div>{invoice.type==='company'&&<><label>{t('COMPANY NAME')}<input required value={invoice.company} onChange={e=>setInvoice({...invoice,company:e.target.value})}/></label><div className="checkoutSplit"><label>{t('TAX OFFICE')}<input required value={invoice.tax_office} onChange={e=>setInvoice({...invoice,tax_office:e.target.value})}/></label><label>{t('TAX NUMBER')}<input required value={invoice.tax_number} onChange={e=>setInvoice({...invoice,tax_number:e.target.value})}/></label></div></>}<label className="checkoutInvoiceCheck"><input type="checkbox" checked={invoice.same_as_shipping} onChange={e=>setInvoice({...invoice,same_as_shipping:e.target.checked})}/><span>{t('USE DELIVERY ADDRESS FOR INVOICE')}</span></label>{!invoice.same_as_shipping&&<label>{t('INVOICE ADDRESS')}<textarea required value={invoice.address} onChange={e=>setInvoice({...invoice,address:e.target.value})}/></label>}</section>{cart.some(x=>supportEligible(x))&&<section className="checkoutSupport"><div className="checkoutSavedAddressHead"><span>WWYS SUPPORT</span><small>{supportTotal>0?fmt(supportTotal):'OPTIONAL'}</small></div><p>Add any extra amount you want to support alongside the object price.</p><div className="checkoutSupportList">{cart.filter(x=>supportEligible(x)).map(x=><div className="checkoutSupportRow" key={'support-'+x.key}><div><b>{x.title}</b><small>{x.format} · QTY {x.qty}</small></div><label><span>₺</span><input type="number" min="0" max="100000" step="1" inputMode="decimal" value={x.supportAmount||''} placeholder="0" aria-label={'Extra support for '+x.title} onChange={e=>setSupportAmount(x,e.target.value)}/></label></div>)}</div></section>}<section className="checkoutGift"><div className="checkoutSavedAddressHead"><span>{t('GIFT MODE')}</span><small>{gift.enabled?'ON':'OFF'}</small></div><label className="checkoutInvoiceCheck"><input type="checkbox" checked={gift.enabled} onChange={e=>setGift({...gift,enabled:e.target.checked})}/><span>{t('THIS ORDER IS A GIFT')}</span></label>{gift.enabled&&<><label>{t('GIFT MESSAGE')}<textarea value={gift.message} onChange={e=>setGift({...gift,message:e.target.value})} placeholder="Optional message for the recipient"/></label><label className="checkoutInvoiceCheck"><input type="checkbox" checked={gift.hide_prices} onChange={e=>setGift({...gift,hide_prices:e.target.checked})}/><span>{t('HIDE PRICES IN GIFT PACKING')}</span></label></>}</section><section className="checkoutStoreValue"><div className="checkoutSavedAddressHead"><span>{t('STORE VALUE')}</span><small>{t('GIFT CARD / CREDIT')}</small></div><div className="storeValueGift"><label>{t('GIFT CARD')}<input value={storeValue.gift_code} onChange={e=>setStoreValue({...storeValue,gift_code:e.target.value.toUpperCase(),gift_valid:false,gift_available:0,message:''})} placeholder="ENTER CODE"/></label><button type="button" disabled={storeValue.checking||!storeValue.gift_code.trim()} onClick={checkGiftCard}>{storeValue.checking?t('CHECKING…'):t('CHECK')}</button></div>{storeValue.gift_valid&&<small className="storeValueReady">{t('AVAILABLE')} · {fmt(storeValue.gift_available)}</small>}{storeValue.credit_available>0&&<label className="checkoutInvoiceCheck"><input type="checkbox" checked={storeValue.use_credit} onChange={e=>setStoreValue({...storeValue,use_credit:e.target.checked})}/><span>{t('USE STORE CREDIT')} · {fmt(storeValue.credit_available)}</span></label>}{storeValue.message&&<small className="storeValueMessage">{storeValue.message}</small>}</section><label>{t('ORDER NOTE')}<textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label>{error&&<p className="checkoutError" role="alert" aria-live="assertive">{error}</p>}{physical&&quote?.free_shipping_threshold&&Number(quote.free_shipping_threshold)>0&&<div className="freeShippingProgress checkoutProgress"><div><span>{Number(quote.free_shipping_remaining||0)>0?fmt(quote.free_shipping_remaining)+' TO FREE SHIPPING':'FREE SHIPPING UNLOCKED'}</span><small>{fmt(quote.free_shipping_threshold)}</small></div><i><b style={{width:Math.min(100,Math.max(0,(Number(quote.subtotal||0)/Number(quote.free_shipping_threshold))*100))+'%'}}/></i></div>}<div className="checkoutSummary"><div className="checkoutSummaryHead"><span>{t('ORDER SUMMARY')}</span><small>{orderType}</small></div>{cart.map(x=><div className="checkoutSummaryItem" key={x.key}><span>{x.title}<small>{x.format} · QTY {x.qty}{Number(x.supportAmount||0)>0?' · SUPPORT +'+fmt(Number(x.supportAmount||0)):''}</small></span><strong>{fmt(x.price*x.qty)}</strong></div>)}<div className="checkoutSummaryRow"><span>{t('SUBTOTAL')}</span><strong>{fmt(subtotal)}</strong></div>{supportTotal>0&&<div className="checkoutSummaryRow checkoutSummarySupport"><span>EXTRA SUPPORT</span><strong>+{fmt(supportTotal)}</strong></div>}{quote?.bundle_name&&Number(quote?.bundle_discount_total||0)>0&&<div className="checkoutSummaryRow checkoutSummaryDiscount"><span>BUNDLE · {quote.bundle_name}</span><strong>−{fmt(quote.bundle_discount_total)}</strong></div>}{quote?.campaign_name&&<div className="checkoutSummaryRow checkoutSummaryDiscount"><span>CAMPAIGN · {quote.campaign_name}</span><strong>{Number(quote?.campaign_discount_total||0)>0?'−'+fmt(quote.campaign_discount_total):shipping===0&&physical?'FREE SHIPPING':'APPLIED'}</strong></div>}{Number(quote?.promo_discount_total||0)>0&&<div className="checkoutSummaryRow checkoutSummaryDiscount"><span>DISCOUNT · {promoCode}</span><strong>−{fmt(quote.promo_discount_total)}</strong></div>}<div className="checkoutSummaryRow"><span>{t('SHIPPING')}</span><strong>{physical?(quote?(shipping>0?fmt(shipping):'FREE'):'CALCULATING…'):'NOT REQUIRED'}</strong></div>{(storeValue.gift_valid||storeValue.use_credit)&&<div className="checkoutSummaryRow checkoutSummaryDiscount"><span>{t('STORE VALUE')}</span><strong>−{fmt(Math.min(total,(storeValue.gift_valid?storeValue.gift_available:0)+(storeValue.use_credit?storeValue.credit_available:0)))}</strong></div>}<div className="checkoutSummaryRow checkoutSummaryTotal"><span>{t('TOTAL')}</span><strong>{fmt(Math.max(0,total-Math.min(total,(storeValue.gift_valid?storeValue.gift_available:0)+(storeValue.use_credit?storeValue.credit_available:0))))}</strong></div></div><button className="globalBagCheckout" disabled={busy}>{busy?t('CREATING ORDER…'):t('PLACE ORDER')}</button><p className="checkoutPolicyNote">By placing the order, you acknowledge the <a href="/policies">store policies</a> and the conditions shown in this checkout.</p><button type="button" className="checkoutBack" onClick={()=>setCheckout(false)}>{t('← BACK TO BAG')}</button></form>
 :cart.length===0?<p className="globalBagEmpty">{t('Your bag is empty.')}</p>:<><div className="globalBagItems">{cart.map(x=><article key={x.key}>{x.cover&&<img src={x.cover} alt=""/>}<div><b>{x.title}</b><small>{x.format}{x.digital?' · DOWNLOAD':''}{x.preorderEnabled&&Number(x.stock||0)<=0?' · PRE-ORDER':''}{x.editionNumberingEnabled&&x.editionTotal?' · LIMITED '+x.editionTotal:''}</small>{supportEligible(x)&&<div className="wwysCartSupport"><div><span>EXTRA SUPPORT</span><small>Optional · goes on top of the object price</small></div><label><span>₺</span><input type="number" min="0" max="100000" step="1" inputMode="decimal" value={x.supportAmount||''} placeholder="0" aria-label={'Extra support for '+x.title} onChange={e=>setSupportAmount(x,e.target.value)}/></label></div>}<div className="globalBagActions"><div className="globalBagQty"><button type="button" aria-label="Decrease quantity" onClick={()=>update(cart.map(y=>cartItemId(y)===cartItemId(x)?{...y,qty:Math.max(1,y.qty-1)}:y))}>−</button><span>{x.qty}</span><button type="button" aria-label="Increase quantity" disabled={x.qty>=MAX_CART_LINE_QTY||(Number(x.productMaxQty)>0&&x.qty>=Number(x.productMaxQty))||(x.preorderEnabled&&Number(x.preorderLimit)>0&&x.qty>=Number(x.preorderLimit))||(!x.preorderEnabled&&x.stock!=null&&x.qty>=x.stock)} onClick={()=>update(cart.map(y=>cartItemId(y)===cartItemId(x)?{...y,qty:Math.min(y.qty+1,MAX_CART_LINE_QTY,Number(y.productMaxQty)>0?Number(y.productMaxQty):MAX_CART_LINE_QTY,y.preorderEnabled&&Number(y.preorderLimit)>0?Number(y.preorderLimit):(y.stock==null||y.preorderEnabled?MAX_CART_LINE_QTY:y.stock))}:y))}>＋</button></div><button className="globalBagRemove" type="button" onClick={e=>{e.preventDefault();e.stopPropagation();removeItem(x)}}>REMOVE</button></div></div><strong>{fmt(x.price*x.qty)}</strong></article>)}</div><div className="promoBox"><div className="promoLabel"><span>GIFT / PROMO CODE</span>{promoCode&&<button type="button" onClick={removePromo}>REMOVE</button>}</div><div className="promoEntry"><input value={promoInput} placeholder="ENTER CODE" onChange={e=>setPromoInput(e.target.value.toUpperCase())}/><button type="button" disabled={promoBusy||!promoInput.trim()} onClick={applyPromo}>{promoBusy?'CHECKING…':promoCode?'UPDATE':'APPLY'}</button></div>{promoCode&&quote&&!quoteError&&<small>CODE {promoCode} APPLIED</small>}</div>{physical&&quote?.free_shipping_threshold&&Number(quote.free_shipping_threshold)>0&&<div className="freeShippingProgress"><div><span>{Number(quote.free_shipping_remaining||0)>0?fmt(quote.free_shipping_remaining)+' TO FREE SHIPPING':'FREE SHIPPING UNLOCKED'}</span><small>{fmt(quote.free_shipping_threshold)}</small></div><i><b style={{width:Math.min(100,Math.max(0,(Number(quote.subtotal||0)/Number(quote.free_shipping_threshold))*100))+'%'}}/></i></div>}<div className="globalBagTotal"><span>{t('SUBTOTAL')}</span><strong>{fmt(localSubtotal)}</strong></div>{supportTotal>0&&<div className="cartSupportTotal"><span>EXTRA SUPPORT</span><strong>+{fmt(supportTotal)}</strong></div>}{quote?.bundle_name&&Number(quote?.bundle_discount_total||0)>0&&<div className="cartDiscount"><span>BUNDLE · {quote.bundle_name}</span><strong>−{fmt(quote.bundle_discount_total)}</strong></div>}{quote?.campaign_name&&<div className="cartDiscount"><span>CAMPAIGN · {quote.campaign_name}</span><strong>{Number(quote?.campaign_discount_total||0)>0?'−'+fmt(quote.campaign_discount_total):shipping===0&&physical?'FREE SHIPPING':'APPLIED'}</strong></div>}{Number(quote?.promo_discount_total||0)>0&&<div className="cartDiscount"><span>DISCOUNT · {promoCode}</span><strong>−{fmt(quote.promo_discount_total)}</strong></div>}{physical&&quote&&<div className="cartShipping"><span>{t('SHIPPING')}</span><strong>{shipping>0?fmt(shipping):'FREE'}</strong></div>}{quoteError&&<p className="checkoutError" role="alert" aria-live="polite">{quoteError}</p>}<button className="globalBagCheckout" disabled={!!quoteError&&!/Enter your email at checkout/i.test(quoteError)} onClick={openCheckout}>{quoteError&&/Enter your email at checkout/i.test(quoteError)?'CONTINUE TO CHECKOUT →':quoteError?'UNAVAILABLE':'CHECKOUT →'}</button></>}</aside>{open&&<button className="globalBagShade" aria-label="Close bag" onClick={close}/>}</>
}