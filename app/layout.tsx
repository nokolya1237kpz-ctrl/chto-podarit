import type { Metadata } from "next";
import "./globals.css";
import Analytics from '../components/Analytics';
import { Analytics as VercelAnalytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: 'ЧтоПодарить — подбор подарка за 30 секунд',
  description: 'Быстрый подбор подарков по бюджету, интересам и поводу.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Analytics />
        {children}
        <VercelAnalytics />
      </body>
    </html>
  );
}
