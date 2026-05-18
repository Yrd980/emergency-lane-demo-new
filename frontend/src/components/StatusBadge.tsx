import { cn } from '../utils/format';

type BadgeStatus = 'online' | 'offline' | 'pending' | 'validated' | 'false_alarm' | 'assigned' | 'accepted' | 'completed' | 'closed' | 'high' | 'normal' | 'critical' | 'active';

const statusConfig: Record<BadgeStatus, { label: string; cls: string; dot?: boolean }> = {
  online: { label: '在线', cls: 'bg-primary-container/20 text-primary border-primary/30', dot: true },
  offline: { label: '离线', cls: 'bg-surface-container-high text-on-surface-variant border-outline-variant/30' },
  pending: { label: '待审核', cls: 'bg-secondary-container/10 text-secondary border-secondary/30', dot: true },
  validated: { label: '已确认', cls: 'bg-primary-container/20 text-primary border-primary/30', dot: true },
  false_alarm: { label: '误报', cls: 'bg-error-container/20 text-error border-error/30' },
  assigned: { label: '已派发', cls: 'bg-primary/10 text-primary border-primary/30', dot: true },
  accepted: { label: '已接单', cls: 'bg-primary-container/20 text-primary border-primary/30', dot: true },
  completed: { label: '已完成', cls: 'bg-primary-container text-on-primary-container border-primary-container' },
  closed: { label: '已关闭', cls: 'bg-surface-container-high text-on-surface-variant border-outline-variant/30' },
  high: { label: '高优先级', cls: 'bg-secondary-container text-on-secondary-container border-secondary-container', dot: true },
  normal: { label: '普通优先级', cls: 'bg-surface-container-high text-on-surface-variant border-outline-variant/30' },
  critical: { label: '严重', cls: 'bg-secondary-container text-on-secondary-container border-secondary-container', dot: true },
  active: { label: '活跃', cls: 'bg-primary-container text-on-primary-container border-primary-container' },
};

export default function StatusBadge({ status, label }: { status: string; label?: string }) {
  const config = statusConfig[status as BadgeStatus] ?? statusConfig.normal;
  return (
    <span className={cn(
      'inline-flex items-center gap-xs px-sm py-xs rounded-full text-label-xs font-label-xs border',
      config.cls,
    )}>
      {config.dot && (
        <span className={cn(
          'w-2 h-2 rounded-full',
          status === 'critical' || status === 'high' ? 'bg-secondary animate-pulse' :
          status === 'pending' ? 'bg-secondary' : 'bg-primary',
        )} />
      )}
      {label ?? config.label}
    </span>
  );
}
