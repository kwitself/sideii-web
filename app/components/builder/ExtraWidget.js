'use client';
import {useEffect,useState} from 'react';

function Countdown({date,done}) {
  const [now,setNow]=useState(null);
  useEffect(()=>{setNow(Date.now());const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[date]);
  if(!date)return <p>Tarih seçilmedi.</p>;
  if(now===null)return <p>—</p>;
  const seconds=Math.max(0,Math.ceil((Date.parse(date)-now)/1000));
  if(!seconds)return <p role="status">{done}</p>;
  return <div className="pbCountdownDigits">
    {[[Math.floor(seconds/86400),'Gün'],[Math.floor(seconds/3600)%24,'Saat'],[Math.floor(seconds/60)%60,'Dakika'],[seconds%60,'Saniye']].map(([n,l])=>
      <span key={l}><b>{String(n).padStart(2,'0')}</b><small>{l}</small></span>)}
  </div>;
}
const dateText=date=>date?new Intl.DateTimeFormat('tr-TR',{timeZone:'Europe/Istanbul',dateStyle:'medium',timeStyle:'short'}).format(new Date(date)):'';

export default function ExtraWidget({node,products=[]}) {
  const p=node.props;
  if(node.type==='album'){
    const product=products.find(x=>x.slug===p.slug);
    if(!product)return <p className="pbEmptyCatalogue">Albüm seç veya yayımlanmış ürün ekle.</p>;
    return <a className="pbAlbum" href={(product.isMerch?'/store/':'/releases/')+product.slug}>
      <span className="pbAlbumArtwork">
        {product.cover?<img src={product.cover} alt={product.title} loading="lazy"/>:<span className="pbMediaMissing">{product.catalogue}</span>}
        <span className="pbArtworkTag" aria-hidden="true">VIEW EDITION <b>↗</b></span>
      </span>
      <span className="pbAlbumCopy">
        <small>{p.label}</small><h2>{product.title}</h2><p>{product.artist}</p>
        <span className="pbAlbumMeta">{product.catalogue} · {product.format}</span>
        <span className="pbCardAction" aria-hidden="true">EXPLORE RELEASE <b>↗</b></span>
      </span>
    </a>;
  }
  if(node.type==='artist')return <article className="pbArtist">
    <div className="pbArtistArtwork">
      {p.image?<img src={p.image} alt={p.title} loading="lazy"/>:<span className="pbMediaMissing">ARTIST / SIDE:II</span>}
      <span className="pbArtworkTag" aria-hidden="true">ARTIST PROFILE <b>↗</b></span>
    </div>
    <div className="pbArtistCopy">
      <small>ARTIST / PROFILE</small><h2>{p.title}</h2><p>{p.text}</p>
      {p.href&&<a className="pbButton" href={p.href}>Sanatçıyı keşfet ↗</a>}
    </div>
  </article>;
  if(node.type==='audio')return <div className="pbAudio">
    <div className="pbAudioIntro">
      <span className="pbAudioArtwork">{p.cover?<img src={p.cover} alt="" loading="lazy"/>:<span className="pbMediaMissing">SIDE:II</span>}</span>
      <span className="pbAudioInfo"><small>LISTENING ROOM / AUDIO</small><h2>{p.title}</h2><span className="pbAudioRule" aria-hidden="true"/></span>
    </div>
    <div className="pbAudioControls">
      {p.src?<audio controls preload="none" src={p.src} aria-label={p.title}/>:<p>Ses dosyası adresi ekle.</p>}
    </div>
  </div>;
  if(node.type==='events')return <div className="pbEvents">
    <div className="pbWidgetHeading"><small>LIVE / CALENDAR</small><h2>{p.title}</h2></div>
    <div className="pbEventsList">{p.items.map((event,i)=><article key={i}>
      <span className="pbEventIndex">{String(i+1).padStart(2,'0')}</span>
      <time dateTime={event.date}>{dateText(event.date)}</time>
      <div className="pbEventInfo"><h3>{event.title}</h3><p>{event.location}</p></div>
      {event.href&&<a href={event.href}>DETAILS / TICKETS <span aria-hidden="true">↗</span></a>}
    </article>)}</div>
    {!p.items.length&&<p className="pbWidgetEmpty">Yeni etkinlikleri buradan duyurabilirsin.</p>}
  </div>;
  if(node.type==='countdown')return <div className="pbCountdown">
    <small className="pbWidgetKicker">NEXT / RELEASE</small><h2>{p.title}</h2>
    <Countdown date={p.date} done={p.done}/>
    {p.date&&<time dateTime={p.date}>{dateText(p.date)} · İstanbul</time>}
    {p.href&&<a className="pbButton" href={p.href}>Keşfet ↗</a>}
  </div>;
  if(node.type==='gallery')return <div className="pbGalleryWidget">
    <div className="pbWidgetHeading"><small>VISUAL ARCHIVE</small><h2>{p.title}</h2></div>
    <div className={'pbGallery pbGallery-'+p.layout}>{p.items.map((item,i)=><figure key={i}>
      {item.src&&<a className="pbGalleryLink" href={item.src} target="_blank" rel="noreferrer" aria-label={item.alt||'Görseli aç'}>
        <span className="pbGalleryMedia"><img src={item.src} alt={item.alt} loading="lazy"/><span className="pbGalleryOpen" aria-hidden="true">VIEW <b>↗</b></span></span>
      </a>}
      {item.alt&&<figcaption>{item.alt}</figcaption>}
    </figure>)}</div>
    {!p.items.length&&<p className="pbWidgetEmpty">Galeriye görseller ekleyerek başlayabilirsin.</p>}
  </div>;
  return null;
}
