import AdminShell from '@/components/admin/AdminShell';

export default function OzonSellerPage() {
  return (
    <AdminShell title="Ozon Seller">
      <section className="empty-state rounded-3xl p-8">
        <h2 className="text-2xl font-semibold text-white">Интеграция Ozon Seller в разработке</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
          Пока используйте импорт по ссылкам, CSV/XLSX или фиды. Этот раздел оставлен как место для будущей официальной интеграции.
        </p>
      </section>
    </AdminShell>
  );
}
