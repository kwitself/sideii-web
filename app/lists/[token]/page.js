import GlobalHeader from '../../components/GlobalHeader';
import SharedListClient from './SharedListClient';
import './shared-list.css';
export const metadata={title:'Shared List'};
export default async function SharedListPage({params}){const {token}=await params;return <main><GlobalHeader/><SharedListClient token={token}/></main>}
