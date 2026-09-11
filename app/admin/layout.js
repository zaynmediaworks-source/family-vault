import '../admin.css';
import AdminSecurityGate from './AdminSecurityGate';
export default function Layout({children}){return <AdminSecurityGate>{children}</AdminSecurityGate>}
