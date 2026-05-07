import { Save, Shield, Trash2, Wifi } from 'lucide-react';
import { useState } from 'react';
import { ActionPanel, PageHeader, PrimaryButton } from '../components/ProductPrimitives';
import { useToast } from '../hooks/useToast';

export default function Settings() {
  const { showToast } = useToast();
  const [reviewMode, setReviewMode] = useState('manual');
  const [retentionDays, setRetentionDays] = useState('30');
  const [onlineWindow, setOnlineWindow] = useState('60');

  const save = () => {
    showToast('设置已保存到当前前端会话。后端持久化将在下一阶段接入。', 'success');
  };

  return (
    <div>
      <PageHeader
        eyebrow="SETTINGS"
        title="运行设置"
        description="先把长期使用时最容易影响信任的配置显性化：复核方式、在线窗口、证据保留和设备访问。"
        action={<PrimaryButton icon={Save} onClick={save}>保存设置</PrimaryButton>}
      />

      <ActionPanel
        tone="warning"
        title="设置页当前是产品化占位"
        description="下一步：把这些配置接入后端持久化。现在先让用户知道系统有哪些长期运行开关。"
        action={<PrimaryButton href="/health">查看系统健康</PrimaryButton>}
      />

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <SettingCard icon={Shield} title="复核策略" description="所有疑似事件必须人工复核后才进入已确认。">
          <select className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={reviewMode} onChange={(e) => setReviewMode(e.target.value)}>
            <option value="manual">人工复核优先</option>
            <option value="strict">证据完整才允许确认</option>
          </select>
        </SettingCard>
        <SettingCard icon={Wifi} title="在线判定窗口" description="超过该秒数没有心跳，设备会显示为离线。">
          <input className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={onlineWindow} onChange={(e) => setOnlineWindow(e.target.value)} />
        </SettingCard>
        <SettingCard icon={Trash2} title="证据保留" description="长期运行时需要控制证据目录增长。">
          <input className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={retentionDays} onChange={(e) => setRetentionDays(e.target.value)} />
        </SettingCard>
        <SettingCard icon={Shield} title="设备访问" description="当前局域网演示默认开放，产品化应接入设备 token。">
          <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">下一步：新增设备 token 并要求 Android 上传携带。</div>
        </SettingCard>
      </div>
    </div>
  );
}

function SettingCard({ icon: Icon, title, description, children }: { icon: React.ElementType; title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
          <Icon className="h-5 w-5 text-slate-700" />
        </div>
        <div>
          <div className="font-semibold text-slate-950">{title}</div>
          <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
