interface MetricCardProps {
  title: string;
  value: string;
  className?: string;
}

export default function MetricCard({ title, value, className }: MetricCardProps) {
  return (
    <div
      className={`rounded-xl bg-white p-5 shadow-md ${className || ""}`}
    >
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-slate-800">{value}</p>
    </div>
  );
}
