import { Database, FolderArchive, RefreshCw, Server, Smartphone } from 'lucide-react';
import { api } from '../api/client';
import { ActionPanel, MetricTile, PageHeader, PrimaryButton, StateBlock } from '../components/ProductPrimitives';
import StatusBadge from '../components/StatusBadge';
import { usePolling } from '../hooks/usePolling';
import type { SystemStatus } from '../types';
import { formatBytes, formatDateTime } from '../utils/format';

export default function Health() {
  const { data, loading, error, refetch } = usePolling<SystemStatus>(() => api.getSystemStatus(), 5000);

  if (loading) return <StateBlock tone="loading" title="正在检查系统健康" description="同步后端、数据库、证据目录和设备心跳。" />;
  if (error) return <StateBlock tone="error" title="健康检查失败" description={error} action={<PrimaryButton icon={RefreshCw} onClick={refetch}>重试检查</PrimaryButton>} />;
  if (!data) return null;

  const topIssue = data.issues[0];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="SYSTEM HEALTH"
        title="系统健康"
        description="长期使用要先知道系统能不能持续运行，再进入事件复核。"
        action={<PrimaryButton icon={RefreshCw} onClick={refetch}>立即刷新</PrimaryButton>}
      />

      <ActionPanel
        tone={topIssue ? (topIssue.severity === 'critical' ? 'danger' : 'warning') : 'success'}
        title={topIssue ? topIssue.message : '系统没有阻断项'}
        description={topIssue ? topIssue.next_action : '下一步：返回工作台，或继续处理待复核事件。'}
        action={<PrimaryButton href={topIssue?.code === 'pending_reviews' ? '/review' : '/'}>{topIssue ? '处理下一步' : '返回工作台'}</PrimaryButton>}
      />

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile label="后端" value={data.backend.status} tone="success" helper={formatDateTime(data.server_time)} />
        <MetricTile label="在线设备" value={`${data.devices.online}/${data.devices.total}`} tone={data.devices.online > 0 ? 'success' : 'warning'} helper="按心跳窗口判断" />
        <MetricTile label="待复核" value={data.events.pending_review_count} tone={data.events.pending_review_count > 0 ? 'warning' : 'neutral'} helper="复核工作台队列" />
        <MetricTile label="证据占用" value={formatBytes(data.evidence.usage_bytes)} helper={`${data.evidence.file_count} 个文件`} />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <HealthCard icon={Server} title="FastAPI 后端" status={data.backend.status} body="负责事件接收、复核状态和 Web 查询。" next="异常时先看 uvicorn stderr。" />
        <HealthCard icon={Database} title="SQLite 数据库" status={data.database.status} body={data.database.path} next="异常时检查 DB_PATH 和写入权限。" />
        <HealthCard icon={FolderArchive} title="证据目录" status={data.evidence.status} body={data.evidence.dir} next="长期运行需配置清理策略。" />
        <HealthCard icon={Smartphone} title="Android 设备" status={data.devices.online > 0 ? 'ok' : 'warning'} body={`${data.devices.pending_upload_count} 条上传积压`} next="积压时进入设备详情排查。" />
      </div>
    </div>
  );
}

function HealthCard({ icon: Icon, title, status, body, next }: { icon: React.ElementType; title: string; status: string; body: string; next: string }) {
  const ok = status === 'ok';
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100">
            <Icon className="h-5 w-5 text-slate-700" />
          </div>
          <div>
            <div className="font-semibold text-slate-950">{title}</div>
            <div className="mt-1 text-sm text-slate-500">{body}</div>
          </div>
        </div>
        <StatusBadge status={ok ? 'online' : 'pending'} label={status} />
      </div>
      <div className="mt-4 rounded-md bg-slate-50 p-3 text-sm text-slate-600">下一步：{next}</div>
    </div>
  );
}
