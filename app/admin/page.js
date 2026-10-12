import AdminGate from './AdminGate';
import AdminDashboard from './AdminDashboard';
import AdminRail from './AdminRail';
import './admin.css';
import './admin-polish.css';

export default function AdminPage(){
 return <AdminGate><main className="adminApp"><AdminRail/><AdminDashboard/></main></AdminGate>;
}
