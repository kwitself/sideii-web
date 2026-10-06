import Link from 'next/link';
import ApplicationForm from './ApplicationForm';
import './apply.css';
import GlobalHeader from '../components/GlobalHeader';

export const metadata={
 title:'Production Application',
 description:'Apply for CD pressing, merch printing and physical music production with SIDE:II.'
};

export default function ApplyPage(){
 return <main className="applyPage">
   <GlobalHeader/>
   <section className="applyHero shell">
    <span>PRODUCTION / APPLICATION</span>
    <h1>Turn the release<br/>into an <i>object.</i></h1>
    <p>CD pressing, merch printing and selected physical production for artists, labels and independent projects.</p>
   </section>
   <section className="applyIntro shell">
    <div><span>CD · MERCH · PACKAGING</span><h2>Tell us what<br/>you want to make.</h2></div>
    <p>You do not need a finished production brief. Send the project name, artist, quantities, formats and any artwork or reference links you already have. We will use this information to review the job and prepare the next step.</p>
   </section>
   <section className="applyFormWrap shell"><ApplicationForm/></section>
   <footer><div className="shell footerInner"><div className="footerLogo"><img src="/brand/sideii-logo-flat.png" alt="SIDE:II"/><small>INDEPENDENT PHYSICAL MUSIC LABEL</small></div><div className="footerNav"><Link href="/">HOME</Link><Link href="/store">STORE</Link><Link href="/apply">PRODUCTION APPLICATION</Link><Link href="/policies">STORE POLICIES</Link></div><div className="footerMeta"><span>SIDE:II · EST. MMXXVI</span><span>CD · MERCH · LIMITED</span><span>© MMXXVI SIDE:II</span></div></div></footer>
 </main>;
}
