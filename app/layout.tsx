import "./globals.css";
import "./refined-dashboard.css";
import "./investment.css";
import "./period-experience.css";

export const metadata = {
  title: "Family Vault",
  description: "Shared family finance dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
