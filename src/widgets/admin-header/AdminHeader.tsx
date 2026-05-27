interface AdminHeaderProps {
  title: string;
}

export function AdminHeader({ title }: AdminHeaderProps) {
  return (
    <div className="premium-surface mb-6 flex flex-col gap-4 rounded-3xl p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="premium-kicker">Админ</p>
          <h1 className="text-4xl font-bold text-white">{title}</h1>
        </div>
      </div>
    </div>
  );
}
