import type { OperationsStats } from '../types';

export type OperationsMetrics = {
  summary: {
    totalSuspectedIncidents: number;
    pendingReview: number;
    validatedIncidents: number;
    falseAlarms: number;
    activeResponseTasks: number;
    completedResponseTasks: number;
    avgResponseMinutes: number;
    periodLabel?: string;
  };
  insight: {
    title: string;
    message: string;
    action: string;
  };
};

export function toOperationsMetrics(stats: OperationsStats): OperationsMetrics {
  return {
    summary: {
      totalSuspectedIncidents: stats.summary.total_suspected_incidents,
      pendingReview: stats.summary.pending_review,
      validatedIncidents: stats.summary.validated,
      falseAlarms: stats.summary.false_alarms,
      activeResponseTasks: stats.summary.assigned_tasks,
      completedResponseTasks: stats.summary.completed_tasks,
      avgResponseMinutes: stats.summary.avg_response_minutes,
      periodLabel: stats.summary.period_label,
    },
    insight: stats.insight,
  };
}
