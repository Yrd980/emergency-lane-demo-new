export default function StatCard({
  label,
  value,
  color = 'bg-[var(--surface-raised)]',
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className={`${color} flex flex-col items-center rounded-xl border border-[var(--line)] p-4 shadow-[0_1px_0_rgba(32,32,29,0.04)]`}>
      <span className="font-mono text-3xl font-bold text-[var(--text)]">{value}</span>
      <span className="mt-1 text-sm text-[var(--muted)]">{label}</span>
    </div>
  );
}
