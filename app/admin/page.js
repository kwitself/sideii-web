import Link from 'next/link';
import AdminGate from './AdminGate';
import AdminDashboard from './AdminDashboard';
import './admin.css';

export default function AdminPage(){
 return <AdminGate><main className="adminApp"><aside className="adminRail"><Link href="/" className="adminBrand"><img src="/brand/sideii-logo-flat.png" alt="Side II"/><small>CONTROL ROOM</small></Link><nav className="adminNav"><a className="active" href="#overview"><i>01</i>Overview</a><a href="#products"><i>02</i>Products</a><a href="#orders"><i>03</i>Orders</a><a href="#inventory-list"><i>04</i>Inventory</a><a href="#customers"><i>05</i>Customers</a><a href="#settings"><i>06</i>Settings</a></nav><div className="railFoot"><span>STORE STATUS</span><b><i/>DATABASE LIVE</b><small>MMXXVI / SIDE:II</small></div></aside><AdminDashboard/></main></AdminGate>;
}
