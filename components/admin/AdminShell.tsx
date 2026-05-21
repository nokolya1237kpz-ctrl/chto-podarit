'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ADMIN_PROVIDERS } from '@/lib/adminProviders';

interface AdminShellProps {
  title: string;
  children: React.ReactNode;
}

export default function AdminShell({ title, children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin');
  }

  const menu = [
    { href: '/admin/products', label: 'Товары' },
    { href: '/admin/bulk-import', label: 'Bulk import' },
    { href: '/admin/price-sources', label: 'Price sources' },
    { href: '/admin/drafts', label: 'Черновики' },
    { href: '/admin/sources', label: 'Источники товаров' },
    { href: '/admin/sync', label: 'Синхронизация' },
    { href: '/admin/epn', label: 'ePN API' },
    { href: '/admin/quick-add-epn', label: 'Быстро добавить ePN' },
    { href: '/admin/admitad', label: 'Admitad API' },
    { href: '/admin/admitad-import', label: '🌐 Импорт из Admitad' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 backdrop-blur-xl shadow-2xl shadow-slate-950/20">
            <div className="mb-8">
              <p className="text-sm uppercase tracking-[0.3em] text-white/50">Админка</p>
              <h2 className="mt-3 text-3xl font-bold">Панель управления</h2>
              <p className="mt-3 text-sm text-white/60">Тёмный премиум интерфейс для управления товарами и провайдерами.</p>
            </div>

            <nav className="space-y-2">
              {menu.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                      active
                        ? 'bg-purple-500/15 text-purple-200 border border-purple-500/20'
                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-8 border-t border-white/10 pt-5">
              <div className="space-y-4">
                <div className="rounded-2xl bg-slate-950/70 p-4 border border-white/10">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">Провайдеры</p>
                  <div className="mt-4 grid gap-3">
                    {ADMIN_PROVIDERS.slice(0, 5).map((provider) => (
                      <div key={provider.id} className="flex items-center gap-3 text-sm text-white/70">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-white/5 text-lg">{provider.icon}</span>
                        <span>{provider.label}</span>
                      </div>
                    ))}
                    <div className="text-xs text-white/40">и ещё {Math.max(0, ADMIN_PROVIDERS.length - 5)} поставщиков</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full rounded-2xl bg-purple-500/15 px-4 py-3 text-sm font-semibold text-purple-100 hover:bg-purple-500/20 transition"
                >
                  Выйти из админки
                </button>
              </div>
            </div>
          </aside>

          <main>
            <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-white/50">Админ</p>
                  <h1 className="text-4xl font-bold text-white">{title}</h1>
                </div>
              </div>
            </div>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
