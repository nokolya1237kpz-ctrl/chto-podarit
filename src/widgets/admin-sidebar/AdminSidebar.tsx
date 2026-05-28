'use client';

import Link from 'next/link';
import { ADMIN_PROVIDERS } from '@/lib/adminProviders';

export const adminMenu = [
  { href: '/admin/products', label: 'Товары' },
  { href: '/admin/drafts', label: 'Черновики' },
  { href: '/admin/url-import', label: 'Импорт по ссылкам' },
  { href: '/admin/import-file', label: 'Импорт CSV/XLSX' },
  { href: '/admin/feeds', label: 'Фиды' },
  { href: '/admin/bulk-import', label: 'Массовый импорт' },
  { href: '/admin/price-sources', label: 'Источники цен' },
  { href: '/admin/epn', label: 'ePN API' },
  { href: '/admin/admitad', label: 'Admitad API' },
  { href: '/admin/ozon', label: 'Ozon Seller' },
  { href: '/admin/sources', label: 'Источники' },
  { href: '/admin/sync', label: 'Синхронизация' },
  { href: '/admin/analytics', label: 'Аналитика' },
  { href: '/admin/settings', label: 'Настройки' },
  { href: '/admin/quick-add-epn', label: 'Быстро добавить ePN' },
  { href: '/admin/admitad-import', label: 'Импорт из Admitad' },
];

interface AdminSidebarProps {
  pathname: string;
  onLogout: () => void;
}

export function AdminSidebar({ pathname, onLogout }: AdminSidebarProps) {
  return (
    <aside className="premium-surface overflow-hidden rounded-3xl p-5 lg:sticky lg:top-6 lg:self-start">
      <div className="mb-8">
        <p className="premium-kicker">Админка</p>
        <h2 className="mt-3 text-3xl font-bold">Панель управления</h2>
        <p className="mt-3 text-sm text-white/60">Тёмный премиум интерфейс для управления товарами и провайдерами.</p>
      </div>

      <nav className="space-y-2">
        {adminMenu.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                active
                  ? 'border border-purple-400/28 bg-gradient-to-r from-purple-500/18 to-pink-500/12 text-purple-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                  : 'text-white/70 hover:bg-white/7 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 border-t border-white/10 pt-5">
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
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
            onClick={onLogout}
            className="w-full rounded-2xl border border-purple-300/16 bg-purple-500/15 px-4 py-3 text-sm font-semibold text-purple-100 transition hover:bg-purple-500/22"
          >
            Выйти из админки
          </button>
        </div>
      </div>
    </aside>
  );
}
