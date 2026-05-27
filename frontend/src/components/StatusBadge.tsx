import { cn } from '../utils/format';
import type { ReviewPriority, ReviewStatus, TaskItem } from '../types';

export type IncidentReviewState = ReviewStatus;
export type ResponseTaskState = TaskItem['status'];
export type DeviceStatus = 'online' | 'offline';
export type DeviceHealth = 'critical' | 'active' | 'normal';

type BadgeStatus = IncidentReviewState | ReviewPriority | ResponseTaskState | DeviceStatus | DeviceHealth;

type BadgeConfig = { label: string; cls: string; dot?: boolean };

const incidentReviewStateConfig: Record<IncidentReviewState, BadgeConfig> = {
  pending: { label: '待审核', cls: 'bg-secondary-container/10 text-secondary border-secondary/30', dot: true },
  validated: { label: '已确认', cls: 'bg-primary-container/20 text-primary border-primary/30', dot: true },
  false_alarm: { label: '误报', cls: 'bg-error-container/20 text-error border-error/30' },
  closed: { label: '已关闭', cls: 'bg-surface-container-high text-on-surface-variant border-outline-variant/30' },
};

const reviewPriorityConfig: Record<ReviewPriority, BadgeConfig> = {
  high: { label: '高优先级', cls: 'bg-secondary-container text-on-secondary-container border-secondary-container', dot: true },
  normal: { label: '普通优先级', cls: 'bg-surface-container-high text-on-surface-variant border-outline-variant/30' },
};

const responseTaskStateConfig: Record<ResponseTaskState, BadgeConfig> = {
  assigned: { label: '已派发', cls: 'bg-primary/10 text-primary border-primary/30', dot: true },
  accepted: { label: '已接单', cls: 'bg-primary-container/20 text-primary border-primary/30', dot: true },
  completed: { label: '已完成', cls: 'bg-primary-container text-on-primary-container border-primary-container' },
  cancelled: { label: '已取消', cls: 'bg-surface-container-high text-on-surface-variant border-outline-variant/30' },
};

const deviceStatusConfig: Record<DeviceStatus, BadgeConfig> = {
  online: { label: '在线', cls: 'bg-primary-container/20 text-primary border-primary/30', dot: true },
  offline: { label: '离线', cls: 'bg-surface-container-high text-on-surface-variant border-outline-variant/30' },
};

const deviceHealthConfig: Record<DeviceHealth, BadgeConfig> = {
  critical: { label: '严重', cls: 'bg-secondary-container text-on-secondary-container border-secondary-container', dot: true },
  active: { label: '活跃', cls: 'bg-primary-container text-on-primary-container border-primary-container' },
  normal: { label: '普通优先级', cls: 'bg-surface-container-high text-on-surface-variant border-outline-variant/30' },
};

function BaseStatusBadge({ status, config, label }: { status: BadgeStatus; config: BadgeConfig; label?: string }) {
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

export function IncidentReviewStateBadge({ state, label }: { state: IncidentReviewState; label?: string }) {
  return <BaseStatusBadge status={state} config={incidentReviewStateConfig[state]} label={label} />;
}

export function ReviewPriorityBadge({ priority, label }: { priority: ReviewPriority; label?: string }) {
  return <BaseStatusBadge status={priority} config={reviewPriorityConfig[priority]} label={label} />;
}

export function ResponseTaskStateBadge({ state, label }: { state: ResponseTaskState; label?: string }) {
  return <BaseStatusBadge status={state} config={responseTaskStateConfig[state]} label={label} />;
}

export function DeviceStatusBadge({ status, label }: { status: DeviceStatus; label?: string }) {
  return <BaseStatusBadge status={status} config={deviceStatusConfig[status]} label={label} />;
}

export function DeviceHealthBadge({ health, label }: { health: DeviceHealth; label?: string }) {
  return <BaseStatusBadge status={health} config={deviceHealthConfig[health]} label={label} />;
}
