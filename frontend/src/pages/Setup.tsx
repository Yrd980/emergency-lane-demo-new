import { api } from '../api/client';
import { ActionPanel, PageHeader, PrimaryButton, StateBlock, SurfacePanel } from '../components/ProductPrimitives';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../hooks/useToast';
import { usePolling } from '../hooks/usePolling';
import type { SystemStatus } from '../types';

const steps = [
  { icon: 'dns', title: '启动 HP 后端', body: '运行 uvicorn，确保手机可访问 HP 局域网 IP 与 8000 端口。' },
  { icon: 'router', title: '配置 Android 地址', body: '在手机填写 http://<hp-ip>:8000，不要使用 localhost。' },
  { icon: 'smartphone', title: '注册设备与心跳', body: '连接成功后，设备会在“设备”页显示绿色在线状态。' },
  { icon: 'science', title: '生成测试疑似事件', body: 'ROI 标定后，使用手动上报验证上传、证据与复核闭环。' },
];

export default function Setup() {
  const { showToast } = useToast();
  const { data, loading, error, refetch } = usePolling<SystemStatus>(() => api.getSystemStatus(), 5000);
  const host = window.location.hostname || '<hp-ip>';
  const backendUrl = `http://${host}:8000`;

  const copy = async () => {
    await navigator.clipboard.writeText(backendUrl);
    showToast('后端地址已复制，请粘贴到 Android 设备', 'success');
  };

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="引导"
        title="配置向导"
        description="将空系统带到可运行状态。每一步都对应可观察结果，减少猜测。"
        action={<PrimaryButton href="/devices">查看设备状态</PrimaryButton>}
      />

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <SurfacePanel className="p-4">
          <div className="mb-2">
            <span className="text-label-xs font-label-xs uppercase tracking-wider text-on-surface-variant">Android 后端地址</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-outline-variant/20 bg-surface-container p-3 font-mono-data">
            <span className="text-on-surface-variant text-body-sm">$</span>
            <code className="flex-1 text-body-sm text-primary">{backendUrl}</code>
            <button
              onClick={copy}
              className="flex items-center gap-xs rounded-md bg-primary/10 px-sm py-xs text-label-xs font-semibold text-primary transition-all hover:bg-primary/20 active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">content_copy</span>
              复制
            </button>
          </div>
        </SurfacePanel>
        <SurfacePanel className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-body-sm font-semibold text-on-surface">接入进度</div>
              <p className="mt-1 text-body-sm text-on-surface-variant">请先建立连通，再检查设备注册与疑似事件流入。</p>
            </div>
            <StatusBadge status={data?.backend.status === 'ok' ? 'online' : 'offline'} label={data?.backend.status === 'ok' ? '后端就绪' : '等待后端'} />
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <ProgressChip label="设备已注册" ok={(data?.devices.total ?? 0) > 0} />
            <ProgressChip label="设备在线" ok={(data?.devices.online ?? 0) > 0} />
            <ProgressChip label="疑似事件队列" ok={(data?.events.pending_review_count ?? 0) > 0} />
            <ProgressChip label="可生成测试" ok={(data?.devices.total ?? 0) > 0} />
          </div>
        </SurfacePanel>
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        {steps.map((step, index) => {
          const done = data ? (index === 0 || (index >= 2 && data.devices.total > 0)) : false;
          return (
            <SurfacePanel
              key={step.title}
              className={`p-4 transition-all hover:border-primary/20 ${done ? 'border-primary/20' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    done ? 'bg-primary/10' : 'border border-outline-variant/10 bg-surface-container'
                  }`}
                >
                  <span className={`material-symbols-outlined text-xl ${done ? 'text-primary' : 'text-on-surface-variant'}`}>{step.icon}</span>
                </div>
                {done ? (
                  <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-label-xs font-label-xs text-primary">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    完成
                  </span>
                ) : (
                  <span className="text-label-xs font-label-xs text-on-surface-variant">步骤 {index + 1}</span>
                )}
              </div>
              <h2 className={`mt-4 font-semibold ${done ? 'text-primary' : 'text-on-surface'}`}>{step.title}</h2>
              <p className="mt-2 text-body-sm leading-6 text-on-surface-variant">{step.body}</p>
            </SurfacePanel>
          );
        })}
      </section>

      <section>
        {loading ? (
          <StateBlock tone="loading" title="正在检查接入状态" description="系统会自动刷新设备注册与心跳状态。" />
        ) : error ? (
          <StateBlock tone="error" title="后端状态检查失败" description={error} action={<PrimaryButton onClick={refetch}>重试</PrimaryButton>} />
        ) : !data || data.devices.total === 0 ? (
          <StateBlock
            title="等待首台设备注册"
            description="下一步：将上方后端地址填入 Android 应用，并确认手机与 HP 在同一局域网。"
            action={<PrimaryButton icon="content_copy" onClick={copy}>复制后端地址</PrimaryButton>}
          />
        ) : (
          <ActionPanel
            tone="success"
            title="设备已连接"
            description={`${data.devices.total} 台设备已注册, ${data.devices.online} 在线. 下一步：生成测试疑似事件并进入复核工作台。`}
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
      className={`rounded-lg border px-3 py-2.5 text-body-sm transition-all ${
        ok ? 'border-primary/20 bg-primary/5' : 'border-outline-variant/10 bg-surface-container'
      }`}
    >
      <div className="text-label-xs font-label-xs uppercase tracking-wider text-on-surface-variant">{label}</div>
      <div className={`mt-1 font-semibold ${ok ? 'text-primary' : 'text-on-surface'}`}>
        {ok ? '就绪' : '未就绪'}
      </div>
    </div>
  );
}
