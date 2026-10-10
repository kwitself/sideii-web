import GlobalHeader from '../../components/GlobalHeader';
import RecoveryClient from './RecoveryClient';
import './recover.css';
export const metadata={title:'Recover Bag'};
export default async function RecoverPage({params}){const {token}=await params;return <main><GlobalHeader/><RecoveryClient token={token}/></main>}
