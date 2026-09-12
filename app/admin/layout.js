import '../admin.css';
import AdminSecurityGate from './AdminSecurityGate';
import AdminPageV2 from './AdminPageV2';
import AdminFeedbackPanel from './AdminFeedbackPanel';
export default function Layout(){return <AdminSecurityGate><><AdminPageV2/><AdminFeedbackPanel/></></AdminSecurityGate>}
