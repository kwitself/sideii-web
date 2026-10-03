import Link from 'next/link';
import AdminGate from '../../AdminGate';
import MerchEditorPage from './MerchEditorPage';
import '../../admin.css';

export default async function MerchAdminPage({params}){
 const {id}=await params;
 return <AdminGate><main className="adminApp"><aside className="adminRail"><Link href="/admin" className="adminBrand"><span>side:II</span><small>CONTROL ROOM</small></Link><nav className="adminNav"><Link href="/admin#products" className="active"><i>02</i>Products</Link></nav></aside><MerchEditorPage id={id}/></main></AdminGate>;
}
