import Link from 'next/link';

const pathFor=p=>p?.isMerch?'/store/'+p.slug:'/releases/'+p.slug;
const discount=b=>b.discount_type==='percent'?('%'+Number(b.discount_value||0)+' SET SAVING'):(Number(b.discount_value||0).toLocaleString('tr-TR')+' TRY SET SAVING');

export default function CompleteTheSet({bundles=[]}){
 if(!Array.isArray(bundles)||!bundles.length)return null;
 return <section className="completeSet shell">
  <header><div><span>COMPLETE THE SET</span><h2>Objects that belong <i>together.</i></h2></div><small>Bundle pricing is applied automatically in the bag.</small></header>
  <div className="completeSetGrid">{bundles.map(b=><article className="completeSetCard" key={b.id}>
   <div className="completeSetMeta"><span>{discount(b)}</span><h3>{b.name}</h3>{b.description&&<p>{b.description}</p>}</div>
   <div className="completeSetItems">{b.items.map((x,i)=><Link href={pathFor(x.product)} key={x.product_id} className="completeSetItem">
    <div>{x.product.cover?<img src={x.product.cover} alt={x.product.rawTitle||x.product.title}/>:<span>{String(i+1).padStart(2,'0')}</span>}</div>
    <p><small>{x.quantity>1?x.quantity+' × ':''}{x.product.catalogue}</small><b>{x.product.rawTitle||x.product.title}</b></p>
   </Link>)}</div>
   <Link href="/bundles" className="completeSetLink">VIEW SET / BUNDLES →</Link>
  </article>)}</div>
 </section>;
}
