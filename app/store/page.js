import {getStoreCatalogue} from '../lib/catalogue';
import StoreClient from './StoreClient';
import './store.css';
import './storefront-polish.css';
export const revalidate=0;
export const metadata={title:'Store — Vinyl, CD, Cassette & Digital Editions',description:'Explore independent vinyl records, CDs, cassettes, digital releases and artist-led merch from SIDE:II and its associated imprints.'};
export default async function Store(){const catalogue=await getStoreCatalogue();return <StoreClient releases={catalogue.releases} unavailable={catalogue.unavailable}/>}
