import {getStoreReleases} from '../lib/catalogue';
import StoreClient from './StoreClient';
import './store.css';
export const revalidate=0;
export const metadata={title:'Store — SIDE:II'};
export default async function Store(){const releases=await getStoreReleases();return <StoreClient releases={releases}/>}
