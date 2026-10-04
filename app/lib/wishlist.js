const KEY='sideii-wishlist-v1';

export function readWishlist(){
 if(typeof window==='undefined')return [];
 try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return []}
}
export function writeWishlist(items){
 if(typeof window==='undefined')return;
 localStorage.setItem(KEY,JSON.stringify(items||[]));
 window.dispatchEvent(new CustomEvent('sideii-wishlist',{detail:items||[]}));
}
export function wishlistItemFromProduct(p){
 return {
  product_slug:p.slug,
  title:p.title,
  catalogue:p.catalogue||null,
  cover:p.cover||null,
  is_merch:!!p.isMerch
 };
}
