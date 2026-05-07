import { CheckCircle2, Copy, MonitorSmartphone, Router, Server, TestTube2 } from 'lucide-react';
import { api } from '../api/client';
import { ActionPanel, PageHeader, PrimaryButton, StateBlock, SurfacePanel } from '../components/ProductPrimitives';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../hooks/useToast';
import { usePolling } from '../hooks/usePolling';
import type { SystemStatus } from '../types';

const steps = [
  { icon: Server, title: '启动 HP 后端', body: '运行 uvicorn，确保手机能访问 HP 的局域网 IP 和 8000 端口。' },
  { icon: Router, title: '配置 Android 地址', body: '在手机端填写 http://<hp-ip>:8000，不能使用 localhost。' },
  { icon: MonitorSmartphone, title: '注册设备和心跳', body: '连接成功后设备会出现在设备页，在线状态应变为绿色。' },
  { icon: TestTube2, title: '生成测试事件', body: '完成 ROI 标定后，用手动事件验证上传、证据、复核闭环。' },
];

export default function Setup() {
  const { showToast } = useToast();
  const { data, loading, error, refetch } = usePolling<SystemStatus>(() => api.getSystemStatus(), 5000);
  const host = window.location.hostname || '<hp-ip>';
  const backendUrl = `http://${host}:8000`;

  const copy = async () => {
    await navigator.clipboard.writeText(backendUrl);
    showToast('后端地址已复制，可粘贴到 Android 端', 'success');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="ONBOARDING"
        title="接入向导"
        description="把空系统带到可运行状态。每一步都对应一个可以观察到的结果，避免现场靠猜。"
        action={<PrimaryButton href="/devices">查看设备状态</PrimaryButton>}
      />

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <SurfacePanel className="p-4">
          <div className="mb-2">
            <span className="text-[11px] uppercase tracking-wider text-[var(--muted)]">Android 后端地址</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-[var(--line)]/20 bg-[var(--surface-base)] p-3 font-mono">
            <span className="text-[var(--faint)] text-sm">$</span>
            <code className="flex-1 text-sm text-[var(--brand)]">{backendUrl}</code>
            <button
              onClick={copy}
              className="flex items-center gap-1.5 rounded-md bg-[var(--brand)]/10 px-2.5 py-1.5 text-xs font-semibold text-[var(--brand)] transition-all hover:bg-[var(--brand)]/20 active:scale-95"
            >
              <Copy className="h-3.5 w-3.5" />
              复制
            </button>
          </div>
        </SurfacePanel>
        <SurfacePanel className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-[var(--text)]">接入进度</div>
              <p className="mt-1 text-sm text-[var(--muted)]">先把连通性做实，再看设备注册和事件进入。</p>
            </div>
            <StatusBadge status={data?.backend.status === 'ok' ? 'online' : 'offline'} label={data?.backend.status === 'ok' ? '后端可用' : '等待后端'} />
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <ProgressChip label="设备注册" ok={(data?.devices.total ?? 0) > 0} />
            <ProgressChip label="设备在线" ok={(data?.devices.online ?? 0) > 0} />
            <ProgressChip label="事件队列" ok={(data?.events.pending_review_count ?? 0) > 0} />
            <ProgressChip label="可生成测试事件" ok={(data?.devices.total ?? 0) > 0} />
          </div>
        </SurfacePanel>
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const done = data ? (index === 0 || (index >= 2 && data.devices.total > 0)) : false;
          return (
            <SurfacePanel
              key={step.title}
              className={`p-4 transition-all hover:border-[var(--brand)]/20 ${done ? 'border-[var(--brand)]/20' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    done ? 'bg-[var(--success)]/10' : 'border border-[var(--line)]/10 bg-[var(--surface)]'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${done ? 'text-[var(--success)]' : 'text-[var(--faint)]'}`} />
                </div>
                {done ? (
                  <span className="flex items-center gap-1 rounded-full bg-[var(--success)]/10 px-2 py-0.5 text-[11px] font-semibold text-[var(--success)]">
                    <CheckCircle2 className="h-3 w-3" />
                    DONE
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-[var(--faint)]">STEP {index + 1}</span>
                )}
              </div>
              <h2 className={`mt-4 font-semibold ${done ? 'text-[var(--success)]' : 'text-[var(--text)]'}`}>{step.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{step.body}</p>
            </SurfacePanel>
          );
        })}
      </section>

      <section>
        {loading ? (
          <StateBlock tone="loading" title="正在检查接入状态" description="系统会自动刷新设备注册和心跳状态。" />
        ) : error ? (
          <StateBlock tone="error" title="后端状态检查失败" description={error} action={<PrimaryButton onClick={refetch}>重试</PrimaryButton>} />
        ) : !data || data.devices.total === 0 ? (
          <StateBlock
            title="等待第一台设备注册"
            description="下一步：把上面的后端地址填入 Android App，确认手机和 HP 在同一局域网。"
            action={<PrimaryButton icon="copy" onClick={copy}>复制后端地址</PrimaryButton>}
          />
        ) : (
          <ActionPanel
            tone="success"
            title="设备已接入"
            description={`已注册 ${data.devices.total} 台设备，其中 ${data.devices.online} 台在线。下一步生成测试事件，进入复核工作台。`}
            action={<PrimaryButton href="/review">进入复核工作台</PrimaryButton>}
          />
        )}
      </section>
    </div>
  );
}

function ProgressChip({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div
      className={`rounded-lg border px-3 py-2.5 text-sm transition-all ${
        ok ? 'border-[var(--success)]/20 bg-[var(--success)]/5' : 'border-[var(--line)]/10 bg-[var(--surface)]'
      }`}
    >
      <div className="text-[11px] uppercase tracking-wider text-[var(--muted)]">{label}</div>
      <div className={`mt-1 font-semibold ${ok ? 'text-[var(--success)]' : 'text-[var(--text)]'}`}>
        {ok ? '已就绪' : '未就绪'}
      </div>
    </div>
  );
}
