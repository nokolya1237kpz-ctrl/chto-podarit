export function ColumnMappingTable({ columns }: { columns: string[] }) {
  return (
    <div className="grid gap-2 rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/70">
      {columns.length ? columns.map((column) => <div key={column}>{column}</div>) : <div>Колонки пока не определены</div>}
    </div>
  );
}
