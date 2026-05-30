'use client';

import { useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';

export default function AdminSettingsPage() {
  const [enableMarketplaceSearchLinks, setEnableMarketplaceSearchLinks] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((response) => response.json())
      .then((body) => setEnableMarketplaceSearchLinks(body.data?.enableMarketplaceSearchLinks !== false))
      .catch(() => setMessage('Не удалось загрузить настройки. Используется значение по умолчанию.'));
  }, []);

  async function updateMarketplaceSearchLinks(enabled: boolean) {
    setEnableMarketplaceSearchLinks(enabled);
    setMessage('Сохраняем...');
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enableMarketplaceSearchLinks: enabled }),
      });
      const body = await response.json();
      if (!response.ok || !body.success) {
        setEnableMarketplaceSearchLinks(!enabled);
        setMessage(body.error || 'Не удалось сохранить настройку');
        return;
      }
      setMessage('Настройка сохранена');
    } catch {
      setEnableMarketplaceSearchLinks(!enabled);
      setMessage('Не удалось сохранить настройку');
    }
  }

  return (
    <AdminShell title="Настройки">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
        <h2 className="text-2xl font-semibold text-white">Настройки проекта</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
          Основные настройки пока хранятся в ENV и Supabase. Раздел подготовлен для управления источниками, расписаниями и витриной из админки.
        </p>
        <label className="mt-6 flex max-w-3xl cursor-pointer items-start justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
          <span>
            <span className="block font-semibold text-white">Поисковые ссылки на маркетплейсы</span>
            <span className="mt-1 block text-sm leading-6 text-slate-400">
              Показывать на странице сравнения быстрые ссылки на Ozon, Wildberries, Яндекс Маркет, DNS, М.Видео, AliExpress и Ситилинк.
            </span>
          </span>
          <input
            type="checkbox"
            checked={enableMarketplaceSearchLinks}
            onChange={(event) => updateMarketplaceSearchLinks(event.target.checked)}
            className="mt-1 h-5 w-5 shrink-0 accent-purple-500"
          />
        </label>
        {message ? <p className="mt-3 text-sm text-slate-400">{message}</p> : null}
      </section>
    </AdminShell>
  );
}
