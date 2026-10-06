import Link from 'next/link';
import T from '../components/T';
import WholesaleForm from './WholesaleForm';
import './wholesale.css';
import GlobalHeader from '../components/GlobalHeader';

export const metadata={title:'Wholesale',description:'Wholesale and distribution enquiries for SIDE:II catalogue editions.'};

export default function WholesalePage(){
 return <main className="wholesalePage">
  <GlobalHeader/>
  <section className="wholesaleHero shell"><span><T k="B2B / WHOLESALE"/></span><h1><T k="Catalogue,"/><br/><i><T k="for shelves."/></i></h1><p>Retailers, distributors and selected stockists can register interest in SIDE:II physical editions and objects.</p></section>
  <section className="wholesaleBody shell"><div><span><T k="TRADE / APPLICATION"/></span><h2><T k="Tell us where"/><br/><T k="you sell music."/></h2><p>Submitting this form does not create a trade account automatically. Applications remain pending until reviewed in Control Room.</p></div><WholesaleForm/></section>
 </main>
}
