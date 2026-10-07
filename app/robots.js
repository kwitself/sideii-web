export default function robots(){
 const base=(process.env.NEXT_PUBLIC_SITE_URL||'https://sideii-web.vercel.app').replace(/\/$/,'');
 return {
  rules:[
   {userAgent:'*',allow:'/',disallow:['/admin','/api/']},
  ],
  sitemap:base+'/sitemap.xml',
 };
}
