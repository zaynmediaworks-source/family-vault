import "./globals.css";
import "./refined-dashboard.css";
import "./investment.css";
import "./period-experience.css";
import "./wealth.css";
import "./feedback.css";
import "./brand-nav.css";
import "./brand-experience.css";
import "./login-experience.css";
import "./dashboard-clock.css";
import "./confirmation-dialog.css";
import "./music.css";
import "./compact-ui.css";
import MusicPlayer from './components/MusicPlayer';

export const metadata = {
  title: "Family Vault",
  description: "Shared family finance dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}<MusicPlayer/></body>
    </html>
  );
}

