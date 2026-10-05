'use client';
import {createContext,useContext,useEffect,useMemo,useState} from 'react';
import {usePathname} from 'next/navigation';
import {supabase} from '../lib/supabase';

const LocaleCurrencyContext=createContext(null);
const PREF_KEY='sideii_locale_currency_v1';

const tr={
 'ACCOUNT':'HESAP','BAG':'SEPET','CLOSE':'KAPAT','SHOPPING BAG':'ALIŞVERİŞ SEPETİ','Your bag is empty.':'Sepetiniz boş.',
 'Checkout':'Ödeme','EMAIL':'E-POSTA','FULL NAME':'AD SOYAD','PHONE':'TELEFON','ADDRESS':'ADRES','POSTAL CODE':'POSTA KODU',
 'ORDER NOTE':'SİPARİŞ NOTU','PLACE ORDER':'SİPARİŞİ OLUŞTUR','CREATING ORDER…':'SİPARİŞ OLUŞTURULUYOR…','← BACK TO BAG':'← SEPETE DÖN',
 'ORDER RECEIVED':'SİPARİŞ ALINDI','Payment is not collected yet.':'Ödeme henüz alınmadı.','SAVED ADDRESS':'KAYITLI ADRES',
 'INVOICE / TAX INFO':'FATURA / VERGİ BİLGİSİ','INDIVIDUAL':'BİREYSEL','COMPANY':'KURUMSAL','COMPANY NAME':'FİRMA ÜNVANI',
 'TAX OFFICE':'VERGİ DAİRESİ','TAX NUMBER':'VERGİ NUMARASI','USE DELIVERY ADDRESS FOR INVOICE':'TESLİMAT ADRESİNİ FATURA İÇİN KULLAN',
 'INVOICE ADDRESS':'FATURA ADRESİ','GIFT MODE':'HEDİYE MODU','THIS ORDER IS A GIFT':'BU SİPARİŞ HEDİYEDİR',
 'GIFT MESSAGE':'HEDİYE MESAJI','HIDE PRICES IN GIFT PACKING':'HEDİYE PAKETİNDE FİYATLARI GİZLE','ORDER SUMMARY':'SİPARİŞ ÖZETİ',
 'SUBTOTAL':'ARA TOPLAM','SHIPPING':'KARGO','TOTAL':'TOPLAM','FREE':'ÜCRETSİZ','REMOVE':'KALDIR','APPLY':'UYGULA','UPDATE':'GÜNCELLE',
 'SIGN IN':'GİRİŞ YAP','CREATE ACCOUNT':'HESAP OLUŞTUR','PASSWORD':'PAROLA','FORGOT PASSWORD?':'PAROLAMI UNUTTUM',
 'SAVE DETAILS':'BİLGİLERİ KAYDET','SAVING…':'KAYDEDİLİYOR…','ADDRESS BOOK':'ADRES DEFTERİ','＋ ADD ADDRESS':'＋ ADRES EKLE',
 'MY COLLECTION':'KOLEKSİYONUM','COLLECTOR PROFILE':'KOLEKSİYON PROFİLİ','CATALOGUE OWNED':'SAHİP OLUNAN KATALOG',
 'OWNED UNITS':'SAHİP OLUNAN ÜRÜN','PASSPORTS':'PASAPORTLAR','OWNER CONTENT':'SAHİBE ÖZEL İÇERİK','VERIFIED IMPACT':'DOĞRULANMIŞ ETKİ',
 'STORE CREDIT':'MAĞAZA BAKİYESİ','CATALOGUE COMPLETION':'KATALOG TAMAMLAMA','ORDER HISTORY':'SİPARİŞ GEÇMİŞİ','SIGN OUT':'ÇIKIŞ YAP',
 'STORE POLICIES':'MAĞAZA POLİTİKALARI','WEAR WHAT YOU SUPPORT':'DESTEKLEDİĞİNİ GİY','COLLECTIONS':'KOLEKSİYONLAR','BUNDLES':'PAKETLER','ARCHIVE':'ARŞİV',
 'Store':'Mağaza','Releases':'Yayınlar','Artists':'Sanatçılar','Credits':'Krediler','Impact':'Etki',
 'Collections':'Koleksiyonlar','Bundles':'Paketler','Archive':'Arşiv','Timeline':'Zaman Çizgisi','Wholesale':'Toptan Satış',
 'CATALOGUE / TIMELINE':'KATALOG / ZAMAN ÇİZGİSİ','In sequence,':'Sırayla,','not in silence.':'sessiz değil.',
 'Every public SIDE:II catalogue object arranged by catalogue number.':'Tüm herkese açık SIDE:II katalog nesneleri katalog numarasına göre sıralanır.',
 'OPEN RECORD →':'KAYDI AÇ →','PRESS / MEDIA KIT':'BASIN / MEDYA KİTİ','PRESS COPY':'BASIN METNİ','ASSETS':'DOSYALAR',
 'No public assets available.':'Herkese açık medya dosyası bulunmuyor.','OPEN ↗':'AÇ ↗',
 'STORE / COLLECTIONS':'MAĞAZA / KOLEKSİYONLAR','Objects,':'Nesneler,','grouped by intent.':'amaçlarına göre bir arada.',
 'STORE / BUNDLES':'MAĞAZA / PAKETLER','More than':'Birden fazla','one object.':'nesne.',
 'CATALOGUE / ARTISTS':'KATALOG / SANATÇILAR','People behind':'Nesnelerin','the objects.':'arkasındaki insanlar.',
 'CATALOGUE / CREDITS':'KATALOG / KREDİLER','Who made':'Nesneyi','the object.':'kim yaptı.',
 'CATALOGUE / ARCHIVE':'KATALOG / ARŞİV','Past objects,':'Geçmiş nesneler,','kept in view.':'görünür kalır.',
 'B2B / WHOLESALE':'B2B / TOPTAN SATIŞ','Catalogue,':'Katalog,','for shelves.':'raflar için.',
 'TRADE / APPLICATION':'TİCARİ / BAŞVURU','Tell us where':'Müziği nerede','you sell music.':'sattığınızı anlatın.',
 'SUBMIT TRADE INTEREST →':'TİCARİ BAŞVURUYU GÖNDER →','COMPANY / STORE':'FİRMA / MAĞAZA','CONTACT NAME':'İLGİLİ KİŞİ',
 'COUNTRY CODE':'ÜLKE KODU','STORE / DISTRIBUTION NOTES':'MAĞAZA / DAĞITIM NOTLARI',
 'WEAR WHAT YOU SUPPORT / VERIFIED IMPACT':'WEAR WHAT YOU SUPPORT / DOĞRULANMIŞ ETKİ','Support,':'Destek,','accounted for.':'kayıt altına alınır.',
 'CAMPAIGNS':'KAMPANYALAR','HOW IT WORKS':'NASIL ÇALIŞIR','OPEN STORE →':'MAĞAZAYI AÇ →','SHOP MERCH →':'MERCH ALIŞVERİŞİ →',
 'SIDE:II / OBJECTS':'SIDE:II / NESNELER','Wear what':'Desteklediğini','you support.':'giy.','AVAILABLE OBJECTS':'MEVCUT NESNELER',
 'THE CATALOGUE DOES NOT END AT THE RECORD.':'KATALOG PLAKTA BİTMEZ.'
};

const dict={en:{},tr};

export function LocaleCurrencyProvider({children}){
 const pathname=usePathname();
 const [locale,setLocale]=useState('en'),[currency,setCurrency]=useState('TRY');
 const [locales,setLocales]=useState([{code:'en',native_label:'English'},{code:'tr',native_label:'Türkçe'}]);
 const [currencies,setCurrencies]=useState([{currency:'TRY',rate_from_try:1}]);

 useEffect(()=>{
  try{
   const p=JSON.parse(localStorage.getItem(PREF_KEY)||'{}');
   if(p.locale)setLocale(p.locale);
   if(p.currency)setCurrency(p.currency);
  }catch{}
  let live=true;
  supabase?.rpc('get_store_localization').then(({data})=>{
   if(!live||!data)return;
   const ls=Array.isArray(data.locales)?data.locales:[];
   const cs=Array.isArray(data.currencies)?data.currencies:[];
   if(ls.length)setLocales(ls);
   if(cs.length){
    setCurrencies(cs);
    setCurrency(v=>cs.some(x=>x.currency===v)?v:'TRY');
   }
  });
  return()=>{live=false};
 },[]);

 useEffect(()=>{
  if(typeof document!=='undefined')document.documentElement.lang=locale;
  try{localStorage.setItem(PREF_KEY,JSON.stringify({locale,currency}))}catch{}
  if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('sideii-locale-currency',{detail:{locale,currency}}));
 },[locale,currency]);

 const value=useMemo(()=>{
  const selected=currencies.find(x=>x.currency===currency)||currencies.find(x=>x.currency==='TRY')||{currency:'TRY',rate_from_try:1};
  const rate=Number(selected.rate_from_try||1);
  const language=locale==='tr'?'tr-TR':'en-GB';
  const money=(tryAmount,opts={})=>{
   const amount=Number(tryAmount||0)*rate;
   return new Intl.NumberFormat(language,{style:'currency',currency:selected.currency,maximumFractionDigits:opts.maximumFractionDigits??(selected.currency==='TRY'?0:2)}).format(amount);
  };
  const t=key=>dict[locale]?.[key]||key;
  return {locale,setLocale,currency,setCurrency,locales,currencies,money,t,rate};
 },[locale,currency,locales,currencies]);

 return <LocaleCurrencyContext.Provider value={value}>{children}{!pathname?.startsWith('/admin')&&<LocaleCurrencySwitcher/>}</LocaleCurrencyContext.Provider>;
}

function LocaleCurrencySwitcher(){
 const ctx=useContext(LocaleCurrencyContext);
 const [open,setOpen]=useState(false);
 if(!ctx)return null;
 return <div className={'localeCurrency '+(open?'open':'')}>
  <button className="localeCurrencyTrigger" type="button" onClick={()=>setOpen(v=>!v)}>{ctx.locale.toUpperCase()} · {ctx.currency}</button>
  {open&&<div className="localeCurrencyPanel">
   <label><span>LANGUAGE</span><select value={ctx.locale} onChange={e=>ctx.setLocale(e.target.value)}>{ctx.locales.map(x=><option key={x.code} value={x.code}>{x.native_label}</option>)}</select></label>
   <label><span>CURRENCY</span><select value={ctx.currency} onChange={e=>ctx.setCurrency(e.target.value)}>{ctx.currencies.map(x=><option key={x.currency} value={x.currency}>{x.currency}</option>)}</select></label>
   {ctx.currency!=='TRY'&&<small>DISPLAY CONVERSION · CHECKOUT SETTLEMENT REMAINS TRY</small>}
  </div>}
 </div>;
}

export function useLocaleCurrency(){
 return useContext(LocaleCurrencyContext)||{locale:'en',currency:'TRY',money:n=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY',maximumFractionDigits:0}).format(Number(n||0)),t:x=>x,locales:[],currencies:[]};
}
