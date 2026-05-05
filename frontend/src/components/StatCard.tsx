export default function StatCard({
  label,
  value,
  color = 'bg-white',
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className={`${color} rounded-lg shadow p-4 flex flex-col items-center`}>
      <span className="text-3xl font-bold text-gray-800">{value}</span>
      <span className="text-sm text-gray-500 mt-1">{label}</span>
    </div>
  );
}
