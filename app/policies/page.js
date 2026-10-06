import Link from 'next/link';
import './policies.css';
import GlobalHeader from '../components/GlobalHeader';

export const metadata={
  title:'Store Policies',
  description:'Shipping, returns, digital delivery, privacy and store terms for SIDE:II.'
};

const sections=[
  ['shipping','Shipping','Shipping options, prices and availability are shown at checkout. Domestic shipping is enabled according to the current store configuration. International shipping is only available when explicitly enabled in the store and shown as available during checkout. Orders containing different physical formats may use the highest applicable shipping class in the bag.'],
  ['returns','Returns & cancellations','Eligible cancellation or return requests can be submitted from the customer account order view. Requests are reviewed against the order status, fulfilment state and applicable consumer law. A request is not considered accepted until its status is updated by SIDE:II.'],
  ['digital','Digital products','Paid digital editions are delivered through the customer account when a download is available. Because digital files can be accessed immediately after payment, cancellation or return rights may be limited after delivery begins, except where mandatory law provides otherwise.'],
  ['preorders','Pre-orders & limited editions','A product marked PRE-ORDER can be purchased before physical stock is ready. The product page indicates availability and any pre-order limit. Numbered editions are allocated at order creation and edition numbers are not automatically recycled after cancellation.'],
  ['privacy','Privacy','Customer information is used to operate accounts, orders, delivery, support, fraud prevention and required transaction records. SIDE:II does not needlessly expose customer account information publicly. Payment providers and delivery services may process the data necessary to complete their part of an order when those services are enabled.'],
  ['terms','Store terms','Product availability, pricing and fulfilment status may change before an order is accepted. Orders may be cancelled or refunded when fulfilment is impossible, inventory is incorrect or a transaction must be reversed. Nothing on this page limits rights that cannot legally be excluded under applicable consumer law.']
];

export default function PoliciesPage(){
 return <main className="policyPage">
   <GlobalHeader/>
   <section className="policyHero shell">
    <span>STORE / POLICIES</span>
    <h1>Before the order<br/><i>becomes an object.</i></h1>
    <p>Operational terms for SIDE:II catalogue purchases. Checkout always shows the current shipping and order conditions available for that transaction.</p>
   </section>
   <section className="policyLayout shell">
    <aside><span>INDEX</span>{sections.map(([id,title],i)=><a key={id} href={'#'+id}><b>{String(i+1).padStart(2,'0')}</b>{title}</a>)}</aside>
    <div className="policySections">{sections.map(([id,title,copy],i)=><article id={id} key={id}><span>{String(i+1).padStart(2,'0')} / POLICY</span><h2>{title}</h2><p>{copy}</p></article>)}
      <article id="contact" className="policyNote"><span>STORE SUPPORT</span><h2>Order-specific support.</h2><p>For an existing purchase, use the order request tools in your customer account so the request remains connected to the correct order record.</p><Link href="/store">RETURN TO STORE →</Link></article>
    </div>
   </section>
   <footer><div className="shell footerInner"><div className="footerLogo"><img src="/brand/sideii-logo-flat.png" alt="SIDE:II"/><small>INDEPENDENT PHYSICAL MUSIC LABEL</small></div><div className="footerNav"><Link href="/">HOME</Link><Link href="/store">STORE</Link><Link href="/apply">PRODUCTION APPLICATION</Link><Link href="/policies">STORE POLICIES</Link></div><div className="footerMeta"><span>SIDE:II · EST. MMXXVI</span><span>POLICIES / STORE OPERATIONS</span><span>© MMXXVI SIDE:II</span></div></div></footer>
 </main>;
}
