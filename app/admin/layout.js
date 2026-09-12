import '../admin.css';
import AdminSecurityGate from './AdminSecurityGate';
import AdminPageV2 from './AdminPageV2';
import AdminFeedbackPanel from './AdminFeedbackPanel';
import AdminBrandExperiencePanel from './AdminBrandExperiencePanel';
export default function Layout(){return <AdminSecurityGate><><AdminPageV2/><AdminBrandExperiencePanel/><AdminFeedbackPanel/></></AdminSecurityGate>}
