import AdminShell from '@/components/admin/AdminShell';

export default function AdminSettingsPage() {
  return (
    <AdminShell title="Настройки">
      <section className="empty-state rounded-3xl p-8">
        <h2 className="text-2xl font-semibold text-white">Настройки проекта</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
          Основные настройки пока хранятся в ENV и Supabase. Раздел подготовлен для управления источниками, расписаниями и витриной из админки.
        </p>
      </section>
    </AdminShell>
  );
}
