import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CheckCircle2, MonitorSmartphone, RefreshCw, ShieldAlert } from 'lucide-react';
import { api } from '../api/client';
import EventTable from '../components/EventTable';
import { ActionPanel, MetricTile, PageHeader, PrimaryButton, SkeletonGrid, StateBlock } from '../components/ProductPrimitives';
import StatusBadge from '../components/StatusBadge';
import { usePolling } from '../hooks/usePolling';
import { formatDateTime } from '../utils/format';
import type { OverviewStats, SystemStatus } from '../types';

export default function Dashboard() {
  const navigate = useNavigate();
  const overview = usePolling<OverviewStats>(() => api.getStats(), 5000);
  const system = usePolling<SystemStatus>(() => api.getSystemStatus(), 5000);

  if (overview.loading || system.loading) {
    return (
      <>
        <PageHeader eyebrow="OPERATIONS" title="正在同步本地系统状态" description="加载后会给出当前最重要的下一步行动。" />
        <SkeletonGrid count={4} />
      </>
    );
  }

  if (overview.error || system.error) {
    return (
      <StateBlock
        tone="error"
        title="工作台暂时不可用"
        description={overview.error || system.error || '请检查 FastAPI 后端是否已启动。'}
        action={
          <PrimaryButton
            icon={RefreshCw}
            onClick={() => {
              overview.refetch();
              system.refetch();
            }}
          >
            重试检查
          </PrimaryButton>
        }
      />
    );
  }

  if (!overview.data || !system.data) return null;

  const needsSetup = system.data.devices.total === 0;
  const hasPending = overview.data.pending_review_count > 0;
  const topIssue = system.data.issues[0];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-md border border-slate-200 bg-slate-950 text-white shadow-sm">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.25fr_0.75fr] lg:p-8">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-semibold text-slate-200">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              本地工作闭环
            </div>
            <div className="max-w-2xl">
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-[2.7rem]">应急车道检测工作台</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                把接入、事件、复核和系统健康放在一个面板里，让现场人员先看到最重要的下一步。
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {needsSetup ? (
                <PrimaryButton href="/setup">开始接入设备</PrimaryButton>
              ) : hasPending ? (
                <PrimaryButton href="/review">处理下一条事件</PrimaryButton>
              ) : (
                <PrimaryButton href="/health">查看系统健康</PrimaryButton>
              )}
              <PrimaryButton tone="light" href="/events">
                查看事件
              </PrimaryButton>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <StatusPill label="系统状态" value={system.data.status === 'ready' ? '可运行' : '需处理'} />
            <StatusPill label="待复核" value={String(overview.data.pending_review_count)} />
            <StatusPill label="在线设备" value={`${system.data.devices.online}/${system.data.devices.total}`} />
            <StatusPill label="最后事件" value={formatDateTime(system.data.events.latest_event_at)} />
          </div>
        </div>
      </section>

      {needsSetup ? (
        <ActionPanel
          tone="warning"
          title="当前还没有设备接入"
          description="先完成 Android 端后端地址配置和设备注册，系统才会进入长期运行状态。"
          action={<PrimaryButton href="/setup">打开接入向导</PrimaryButton>}
        />
      ) : topIssue ? (
        <ActionPanel
          tone={topIssue.severity === 'critical' ? 'danger' : 'warning'}
          title={topIssue.message}
          description={topIssue.next_action}
          action={<PrimaryButton href={topIssue.code === 'pending_reviews' ? '/review' : '/health'}>处理</PrimaryButton>}
        />
      ) : (
        <ActionPanel
          tone="success"
          title="系统已准备好"
          description="设备在线、后端可用。下一步是等待事件进入，或查看历史事件。"
          action={<PrimaryButton href="/events">查看事件</PrimaryButton>}
        />
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricTile label="今日事件" value={overview.data.total_events_today} helper="按事件开始时间统计" />
        <MetricTile label="待复核" value={overview.data.pending_review_count} tone={hasPending ? 'warning' : 'neutral'} helper="主工作队列" />
        <MetricTile label="已确认" value={overview.data.confirmed_count} tone="success" helper="完成闭环" />
        <MetricTile label="已驳回" value={overview.data.rejected_count} tone="danger" helper="人工排除" />
        <MetricTile label="在线设备" value={`${system.data.devices.online}/${system.data.devices.total}`} helper="最近心跳窗口" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-slate-950">最近事件</h2>
              <p className="mt-1 text-sm text-slate-500">下一步：打开高优先级事件并完成复核。</p>
            </div>
            <Link className="text-sm font-semibold text-slate-700 hover:text-slate-950" to="/events">
              全部事件
            </Link>
          </div>

          {overview.data.recent_events.length === 0 ? (
            <StateBlock
              title="还没有事件进入"
              description="完成接入后，可在 Android 端手动生成测试事件，验证上传和复核链路。"
              action={<PrimaryButton href="/setup">查看接入步骤</PrimaryButton>}
            />
          ) : (
            <EventTable
              items={overview.data.recent_events.slice(0, 5)}
              total={overview.data.recent_events.length}
              offset={0}
              limit={5}
              onPage={() => navigate('/events')}
            />
          )}
        </div>

        <section className="space-y-4">
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-slate-950">系统健康</h2>
                <p className="mt-1 text-sm text-slate-500">下一步：先处理阻断项，再处理待办项。</p>
              </div>
              <StatusBadge status={system.data.status === 'ready' ? 'online' : 'high'} label={system.data.status === 'ready' ? '可运行' : '需处理'} />
            </div>
            <div className="mt-4 space-y-3">
              {system.data.issues.length === 0 ? (
                <div className="flex items-start gap-3 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
                  <CheckCircle2 className="mt-0.5 h-4 w-4" />
                  没有阻断项，继续等待事件或查看历史。
                </div>
              ) : (
                system.data.issues.map((issue) => (
                  <div key={issue.code} className="flex gap-3 rounded-md bg-slate-50 p-3 text-sm">
                    {issue.severity === 'critical' ? <ShieldAlert className="mt-0.5 h-4 w-4 text-rose-600" /> : <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />}
                    <div>
                      <div className="font-semibold text-slate-900">{issue.message}</div>
                      <div className="mt-1 text-slate-600">{issue.next_action}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-slate-950 p-4 text-white shadow-sm">
            <div className="flex items-center gap-3">
              <MonitorSmartphone className="h-5 w-5 text-cyan-300" />
              <div>
                <div className="font-semibold">长期运行检查</div>
                <div className="mt-1 text-sm text-slate-300">最后事件：{formatDateTime(system.data.events.latest_event_at)}</div>
              </div>
            </div>
            <button
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
              onClick={() => navigate('/health')}
            >
              查看健康细节 <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </section>
    </div>
  );
}

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/6 p-4 backdrop-blur-sm">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-2 text-lg font-semibold text-white">{value}</div>
    </div>
  );
}
