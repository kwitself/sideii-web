import {getPublicSiteUrl} from './lib/public-site-url';

export default function robots(){
 const base=getPublicSiteUrl();
 if(!base)return {rules:[{userAgent:'*',disallow:'/'}]};
 return {
  rules:[{userAgent:'*',allow:'/',disallow:['/admin','/api/','/order','/account','/checkout']}],
  sitemap:base+'/sitemap.xml'
 };
}
