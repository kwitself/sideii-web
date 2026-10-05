import Link from 'next/link';
import T from '../components/T';
import WholesaleForm from './WholesaleForm';
import './wholesale.css';

export const metadata={title:'Wholesale',description:'Wholesale and distribution enquiries for SIDE:II catalogue editions.'};

export default function WholesalePage(){
 return <main className="wholesalePage">
  <header className="nav shell"><Link className="brand" href="/"><img src="/brand/sideii-logo-flat.png" alt="SIDE:II"/></Link><nav><Link href="/store"><T k="Store"/></Link><Link href="/archive"><T k="Archive"/></Link><Link href="/wholesale"><T k="Wholesale"/></Link></nav></header>
  <section className="wholesaleHero shell"><span><T k="B2B / WHOLESALE"/></span><h1><T k="Catalogue,"/><br/><i><T k="for shelves."/></i></h1><p>Retailers, distributors and selected stockists can register interest in SIDE:II physical editions and objects.</p></section>
  <section className="wholesaleBody shell"><div><span><T k="TRADE / APPLICATION"/></span><h2><T k="Tell us where"/><br/><T k="you sell music."/></h2><p>Submitting this form does not create a trade account automatically. Applications remain pending until reviewed in Control Room.</p></div><WholesaleForm/></section>
 </main>
}
