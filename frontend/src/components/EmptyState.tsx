interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: { label: string; href?: string; onClick?: () => void };
}

export default function EmptyState({ icon = 'inventory_2', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant/20 bg-surface-container-low py-16 text-on-surface-variant">
      <span className="material-symbols-outlined text-4xl mb-4 opacity-40">{icon}</span>
      <p className="text-body-sm font-semibold text-on-surface">{title}</p>
      {description && <p className="mt-1 text-body-sm text-on-surface-variant">{description}</p>}
      {action && (
        action.href ? (
          <a href={action.href} className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary text-on-primary px-4 py-sm text-label-xs font-semibold hover:brightness-110 transition-all active:scale-95">
            {action.label}
          </a>
        ) : (
          <button onClick={action.onClick} className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary text-on-primary px-4 py-sm text-label-xs font-semibold hover:brightness-110 transition-all active:scale-95">
            {action.label}
          </button>
        )
      )}
    </div>
  );
}
