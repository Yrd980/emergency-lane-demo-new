interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: { label: string; href?: string; onClick?: () => void };
}

export default function EmptyState({ icon = "📋", title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-slate-300 bg-white py-16 text-slate-500">
      <span className="mb-4 text-4xl">{icon}</span>
      <p className="text-base font-semibold text-slate-900">{title}</p>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      {action && (
        action.href ? (
          <a href={action.href} className="mt-4 inline-flex items-center justify-center rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
            {action.label}
          </a>
        ) : (
          <button onClick={action.onClick} className="mt-4 inline-flex items-center justify-center rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
            {action.label}
          </button>
        )
      )}
    </div>
  );
}
