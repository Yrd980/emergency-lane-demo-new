import { api } from '../api/client';
import { ActionPanel, MetricTile, PageHeader, PrimaryButton, StateBlock, SurfacePanel } from '../components/ProductPrimitives';
import { usePolling } from '../hooks/usePolling';
import type { SystemStatus } from '../types';
import { formatBytes, formatDateTime } from '../utils/format';

export default function Health() {
  const { data, loading, error, refetch } = usePolling<SystemStatus>(() => api.getSystemStatus(), 5000);

  if (loading) return <StateBlock tone="loading" title="正在检查系统健康" description="正在同步后端、数据库、证据目录和设备心跳。" />;
  if (error) return <StateBlock tone="error" title="健康检查失败" description={error} action={<PrimaryButton icon="refresh" onClick={refetch}>重新检查</PrimaryButton>} />;
  if (!data) return null;

  const topIssue = data.issues[0];
  const nextStepHref =
    topIssue?.code === 'pending_reviews' ? '/review' :
    topIssue?.code === 'pending_uploads' && data.devices.backlog_device_id ? `/devices/${data.devices.backlog_device_id}` :
    topIssue?.code === 'pending_uploads' ? '/devices' :
    topIssue?.code === 'all_devices_offline' ? '/devices' :
    topIssue?.code === 'no_devices' ? '/setup' :
    '/';

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="系统健康"
        title="系统健康状态"
        description="进入持续运行前，先确认系统可稳定运行，再处理疑似事件复核。"
        action={<PrimaryButton icon="refresh" onClick={refetch}>立即刷新</PrimaryButton>}
      />

      <ActionPanel
        tone={topIssue ? (topIssue.severity === 'critical' ? 'danger' : 'warning') : 'success'}
        title={topIssue ? topIssue.message : '暂无阻塞问题'}
        description={topIssue ? topIssue.next_action : '下一步：返回工作台，或继续处理待复核疑似事件。'}
        action={<PrimaryButton href={nextStepHref}>{topIssue ? '处理下一步' : '返回工作台'}</PrimaryButton>}
      />

      <div className="mt-lg grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile label="后端" value={data.backend.status === 'ok' ? '正常' : data.backend.status} tone="success" helper={formatDateTime(data.server_time)} />
        <MetricTile label="在线设备" value={`${data.devices.online}/${data.devices.total}`} tone={data.devices.online > 0 ? 'success' : 'warning'} helper="按心跳窗口统计" />
        <MetricTile label="待复核" value={data.suspected_incidents.pending_review_count} tone={data.suspected_incidents.pending_review_count > 0 ? 'warning' : 'neutral'} helper="复核工作台队列" />
        <MetricTile label="证据占用" value={formatBytes(data.evidence.usage_bytes)} helper={`${data.evidence.file_count} 个文件`} />
      </div>

      <div className="mt-lg grid gap-4 lg:grid-cols-2">
        <HealthCard icon="dns" title="FastAPI 后端" status={data.backend.status} body="负责疑似事件接入、复核状态和 Web 查询。" next="异常时检查 uvicorn stderr 输出。" />
        <HealthCard icon="database" title="SQLite 数据库" status={data.database.status} body={data.database.path} next="异常时检查 DB_PATH 与写入权限。" />
        <HealthCard icon="folder" title="证据目录" status={data.evidence.status} body={data.evidence.dir} next="持续运行前配置清理策略。" />
        <HealthCard
          icon="smartphone"
          title="Android 设备"
          status={data.devices.online > 0 && data.devices.pending_upload_count === 0 ? 'ok' : 'warning'}
          body={`${data.devices.pending_upload_count} 条上传积压`}
          next={data.devices.backlog_device_id ? `打开 ${data.devices.backlog_device_id} 检查队列。` : '进入设备详情排查积压。'}
          href={data.devices.backlog_device_id ? `/devices/${data.devices.backlog_device_id}` : '/devices'}
        />
      </div>
    </div>
  );
}

function HealthCard({ icon, title, status, body, next, href }: { icon: string; title: string; status: string; body: string; next: string; href?: string }) {
  const ok = status === 'ok';
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-outline-variant/10 bg-surface-container">
            <span className="material-symbols-outlined text-primary text-xl">{icon}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-on-surface">{title}</span>
              {ok ? (
                <span className="inline-block h-2 w-2 rounded-full bg-primary shadow-[0_0_6px_rgba(194,193,255,0.5)] status-dot-healthy" />
              ) : (
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-error shadow-[0_0_6px_rgba(255,180,171,0.5)] status-dot-critical" />
              )}
            </div>
            <div className="mt-1 text-body-sm text-on-surface-variant">{body}</div>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-label-xs font-label-xs uppercase tracking-wider ${
            ok ? 'bg-primary/10 text-primary' : 'bg-error-container/10 text-error'
          }`}
        >
          {status}
        </span>
      </div>
      <div className="mt-4 rounded-lg border border-outline-variant/10 bg-surface-container p-3 text-body-sm text-on-surface-variant">
        <span className="text-label-xs font-label-xs uppercase tracking-wider text-on-surface-variant">下一步：</span>
        {next}
      </div>
    </>
  );

  if (href) {
    return (
      <a href={href} className="block">
        <SurfacePanel className="p-4 transition-all hover:border-primary/20 group">{content}</SurfacePanel>
      </a>
    );
  }

  return (
    <SurfacePanel className="p-4 transition-all hover:border-primary/20 group">
      {content}
    </SurfacePanel>
  );
}
