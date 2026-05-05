const statusConfig: Record<string, { label: string; cls: string }> = {
  pending: { label: '待复核', cls: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: '已确认', cls: 'bg-green-100 text-green-800' },
  rejected: { label: '已驳回', cls: 'bg-red-100 text-red-800' },
};

export default function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}
