import GlobalHeader from '../../components/GlobalHeader';
import GiftPortalClient from './GiftPortalClient';
import './gift.css';
export const metadata={title:'A SIDE:II Gift'};
export default async function GiftPage({params}){const {token}=await params;return <main><GlobalHeader/><GiftPortalClient token={token}/></main>}
