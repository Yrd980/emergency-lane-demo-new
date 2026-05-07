import { CheckCircle2, Copy, MonitorSmartphone, Router, Server, TestTube2 } from 'lucide-react';
import { api } from '../api/client';
import { ActionPanel, PageHeader, PrimaryButton, StateBlock } from '../components/ProductPrimitives';
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
    <div>
      <PageHeader
        eyebrow="ONBOARDING"
        title="接入向导"
        description="把空系统带到可运行状态。每一步都对应一个可以观察到的结果，避免现场靠猜。"
        action={<PrimaryButton href="/devices">查看设备状态</PrimaryButton>}
      />

      <ActionPanel
        title="Android 后端地址"
        description={backendUrl}
        action={<PrimaryButton icon={Copy} onClick={copy}>复制地址</PrimaryButton>}
      />

      <div className="mt-5 grid gap-4 lg:grid-cols-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const done = data ? (index === 0 || (index >= 2 && data.devices.total > 0)) : false;
          return (
            <div key={step.title} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                  <Icon className="h-5 w-5 text-slate-700" />
                </div>
                {done ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <span className="text-xs font-semibold text-slate-400">STEP {index + 1}</span>}
              </div>
              <h2 className="mt-4 font-semibold text-slate-950">{step.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{step.body}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-5">
        {loading ? (
          <StateBlock tone="loading" title="正在检查接入状态" description="系统会自动刷新设备注册和心跳状态。" />
        ) : error ? (
          <StateBlock tone="error" title="后端状态检查失败" description={error} action={<PrimaryButton onClick={refetch}>重试</PrimaryButton>} />
        ) : !data || data.devices.total === 0 ? (
          <StateBlock
            title="等待第一台设备注册"
            description="下一步：把上面的后端地址填入 Android App，确认手机和 HP 在同一局域网。"
            action={<PrimaryButton icon={Copy} onClick={copy}>复制后端地址</PrimaryButton>}
          />
        ) : (
          <ActionPanel
            tone="success"
            title="设备已接入"
            description={`已注册 ${data.devices.total} 台设备，其中 ${data.devices.online} 台在线。下一步生成测试事件，进入复核工作台。`}
            action={<PrimaryButton href="/review">进入复核工作台</PrimaryButton>}
          />
        )}
      </div>

      <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 font-semibold text-slate-950">当前接入状态</div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={data?.backend.status === 'ok' ? 'online' : 'offline'} label="后端" />
          <StatusBadge status={(data?.devices.total ?? 0) > 0 ? 'online' : 'offline'} label="设备注册" />
          <StatusBadge status={(data?.devices.online ?? 0) > 0 ? 'online' : 'offline'} label="设备在线" />
          <StatusBadge status={(data?.events.pending_review_count ?? 0) > 0 ? 'pending' : 'normal'} label="事件队列" />
        </div>
      </div>
    </div>
  );
}
