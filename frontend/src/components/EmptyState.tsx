interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: { label: string; href?: string; onClick?: () => void };
}

export default function EmptyState({ icon = "📋", title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-soft)] py-16 text-[var(--muted)]">
      <span className="mb-4 text-4xl opacity-40">{icon}</span>
      <p className="text-base font-semibold text-[var(--text)]">{title}</p>
      {description && <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>}
      {action && (
        action.href ? (
          <a href={action.href} className="mt-4 inline-flex items-center justify-center rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-[var(--on-brand)] hover:bg-[var(--brand-strong)] transition-all active:scale-95">
            {action.label}
          </a>
        ) : (
          <button onClick={action.onClick} className="mt-4 inline-flex items-center justify-center rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-[var(--on-brand)] hover:bg-[var(--brand-strong)] transition-all active:scale-95">
            {action.label}
          </button>
        )
      )}
    </div>
  );
}
