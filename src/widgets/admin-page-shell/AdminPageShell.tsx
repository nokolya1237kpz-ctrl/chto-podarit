'use client';

import { usePathname, useRouter } from 'next/navigation';
import { AdminHeader } from '@widgets/admin-header';
import { AdminSidebar } from '@widgets/admin-sidebar';

interface AdminPageShellProps {
  title: string;
  children: React.ReactNode;
}

export default function AdminPageShell({ title, children }: AdminPageShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin');
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.18),transparent_28%),linear-gradient(180deg,#03040b,#080b18)] text-white">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <AdminSidebar pathname={pathname} onLogout={handleLogout} />

          <main className="min-w-0">
            <AdminHeader title={title} />
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
