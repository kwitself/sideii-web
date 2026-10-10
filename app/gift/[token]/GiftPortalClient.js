'use client';
import {useEffect,useState} from 'react';
import {supabase} from '../../lib/supabase';

export default function GiftPortalClient({token}){
 const [gift,setGift]=useState(undefined);
 useEffect(()=>{if(!token)return;(async()=>{const {data}=await supabase.rpc('get_public_gift',{p_token:token});setGift(data||null)})()},[token]);
 if(gift===undefined)return <section className="giftPortal"><span>GIFT / SIDE:II</span><h1>Preparing<br/><em>the object.</em></h1></section>;
 if(!gift)return <section className="giftPortal"><span>GIFT / SIDE:II</span><h1>Not ready<br/><em>to reveal.</em></h1><p>This gift is unavailable, unpaid, expired, or scheduled for a later time.</p></section>;
 return <section className="giftPortal"><span>GIFT / SIDE:II</span><h1>An object<br/><em>for you.</em></h1>{gift.gift_message&&<blockquote>{gift.gift_message}</blockquote>}<div className="giftPortalItems">{(gift.items||[]).map((x,i)=><article key={i}><small>{String(x.format||'OBJECT').toUpperCase()} · QTY {x.quantity}</small><b>{x.title}</b></article>)}</div><footer><span>#SII-{String(gift.order_no).padStart(4,'0')}</span><span>{gift.gift_wrap?'GIFT WRAPPED':'SIDE:II GIFT'}</span></footer></section>;
}
