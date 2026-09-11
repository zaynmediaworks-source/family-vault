import '../admin.css';
import AdminSecurityGate from './AdminSecurityGate';
import AdminPageV2 from './AdminPageV2';
export default function Layout(){return <AdminSecurityGate><AdminPageV2/></AdminSecurityGate>}
