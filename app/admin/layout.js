import '../admin.css';
import AdminSecurityGate from './AdminSecurityGate';
import AdminPageV2 from './AdminPageV2';
import AdminFeedbackPanel from './AdminFeedbackPanel';
import AdminBrandExperiencePanel from './AdminBrandExperiencePanel';
import MusicAdmin from './MusicAdmin';
import AddAdminPanel from './AddAdminPanel';
export default function Layout(){return <AdminSecurityGate><><nav className="admin-card" aria-label="Pengaturan admin"><a className="btn" href="#admin-music">Kelola Musik</a></nav><div id="admin-music" className="admin-shell"><MusicAdmin/><AddAdminPanel/></div><AdminPageV2/><AdminBrandExperiencePanel/><AdminFeedbackPanel/></></AdminSecurityGate>}

