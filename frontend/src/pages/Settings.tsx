import { Shield, Trash2, Wifi } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRole } from '../access/useRole';
import { api } from '../api/client';
import { ActionPanel, PageHeader, PrimaryButton, StateBlock, SurfacePanel } from '../components/ProductPrimitives';
import { inputClassName } from '../components/styles';
import { useToast } from '../hooks/useToast';
import type { RuntimeSettingsUpdate } from '../types';
import { formatDateTime } from '../utils/format';

export default function Settings() {
  const { role } = useRole();
  const { showToast } = useToast();
  const [settings, setSettings] = useState<RuntimeSettingsUpdate | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getSettings();
      setSettings(toEditableSettings(data));
      setUpdatedAt(data.updated_at);
      setError(null);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    api.getSettings()
      .then((data) => {
        if (cancelled) return;
        setSettings(toEditableSettings(data));
        setUpdatedAt(data.updated_at);
        setError(null);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError((e as Error).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const update = <K extends keyof RuntimeSettingsUpdate>(key: K, value: RuntimeSettingsUpdate[K]) => {
    setSettings((current) => (current ? { ...current, [key]: value } : current));
  };

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const saved = await api.updateSettings(settings);
      setSettings(toEditableSettings(saved));
      setUpdatedAt(saved.updated_at);
      setError(null);
      showToast('设置已保存到本地后端，刷新页面后仍会保留。', 'success');
    } catch (e: unknown) {
      const message = (e as Error).message;
      setError(message);
      showToast(`设置保存失败：${message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <StateBlock tone="loading" title="正在读取运行设置" description="同步后端保存的复核、在线判定和证据保留策略。" />;
  if (error && !settings) {
    return (
      <StateBlock
        tone="error"
        title="设置读取失败"
        description={error}
        action={<PrimaryButton icon="refresh" onClick={load}>重试读取</PrimaryButton>}
      />
    );
  }
  if (!settings) return null;
  const editable = role === 'maintainer';

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="SETTINGS"
        title="运行设置"
        description="先把长期使用时最容易影响信任的配置显性化：复核方式、在线窗口、证据保留和设备访问。"
        action={
          editable ? (
            <PrimaryButton icon="save" onClick={save} disabled={saving}>
              {saving ? '正在保存' : '保存设置'}
            </PrimaryButton>
          ) : (
            <PrimaryButton href="/health">查看系统健康</PrimaryButton>
          )
        }
      />

      {!editable && (
        <ActionPanel
          tone="warning"
          title="当前身份只能查看设置"
          description="只有管理员可以修改运行参数。当前身份适合先看健康和设备状态。"
          action={<PrimaryButton href="/health">转到系统健康</PrimaryButton>}
        />
      )}

      <ActionPanel
        tone={error ? 'danger' : 'success'}
        title={error ? '最近一次保存失败' : '设置已接入后端持久化'}
        description={error ? `${error}。请确认本地后端可用后重试。` : `最近保存：${updatedAt ? formatDateTime(updatedAt) : '等待首次保存'}。下一步：查看系统健康确认运行状态。`}
        action={error ? <PrimaryButton icon="refresh" onClick={save}>重新保存</PrimaryButton> : <PrimaryButton href="/health">查看系统健康</PrimaryButton>}
      />

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <SettingCard icon={Shield} title="复核策略" description="所有疑似事件必须人工复核后才进入已确认。">
          <select
            className={inputClassName('mt-3 w-full')}
            value={settings.review_mode}
            onChange={(e) => editable && update('review_mode', e.target.value as RuntimeSettingsUpdate['review_mode'])}
            disabled={!editable}
          >
            <option value="manual">人工复核优先</option>
            <option value="strict">证据完整才允许确认</option>
          </select>
          <label className="mt-3 flex items-start gap-3 rounded-lg border border-[var(--line)]/10 bg-[var(--surface)] p-3 text-sm text-[var(--muted)] transition-all hover:border-[var(--brand)]/20">
            <input
              type="checkbox"
              checked={settings.require_complete_evidence}
              onChange={(e) => editable && update('require_complete_evidence', e.target.checked)}
              disabled={!editable}
              className="mt-0.5 h-4 w-4 rounded border-[var(--line)] bg-[var(--canvas)] text-[var(--brand)] focus:ring-[var(--brand-soft)] focus:ring-offset-0"
            />
            <span>确认事件前要求 before / peak / after 证据完整</span>
          </label>
        </SettingCard>
        <SettingCard icon={Wifi} title="在线判定窗口" description="超过该秒数没有心跳，设备会显示为离线。">
          <NumberInput
            value={settings.online_window_seconds}
            min={10}
            max={3600}
            onChange={(value) => editable && update('online_window_seconds', value)}
            disabled={!editable}
          />
        </SettingCard>
        <SettingCard icon={Trash2} title="证据保留" description="长期运行时需要控制证据目录增长。">
          <NumberInput
            value={settings.evidence_retention_days}
            min={1}
            max={3650}
            onChange={(value) => editable && update('evidence_retention_days', value)}
            disabled={!editable}
          />
        </SettingCard>
        <SettingCard icon={Shield} title="设备访问" description="当前局域网演示默认开放，产品化应接入设备 token。">
          <select
            className={inputClassName('mt-3 w-full')}
            value={settings.device_access_mode}
            onChange={(e) => editable && update('device_access_mode', e.target.value as RuntimeSettingsUpdate['device_access_mode'])}
            disabled={!editable}
          >
            <option value="open">局域网开放接入</option>
            <option value="token">要求设备 token（后续 Android 接入）</option>
          </select>
          <div className="mt-3 rounded-lg border border-[var(--line)]/10 bg-[var(--surface)] p-3 text-sm text-[var(--faint)]">下一步：Android 上传携带 token 后再切换到强制校验。</div>
        </SettingCard>
      </div>
    </div>
  );
}

function toEditableSettings(settings: { review_mode: RuntimeSettingsUpdate['review_mode']; online_window_seconds: number; evidence_retention_days: number; require_complete_evidence: boolean; device_access_mode: RuntimeSettingsUpdate['device_access_mode'] }): RuntimeSettingsUpdate {
  return {
    review_mode: settings.review_mode,
    online_window_seconds: settings.online_window_seconds,
    evidence_retention_days: settings.evidence_retention_days,
    require_complete_evidence: settings.require_complete_evidence,
    device_access_mode: settings.device_access_mode,
  };
}

function NumberInput({ value, min, max, onChange, disabled }: { value: number; min: number; max: number; onChange: (value: number) => void; disabled?: boolean }) {
  return (
    <input
      className={inputClassName('mt-3 w-full')}
      type="number"
      min={min}
      max={max}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}

function SettingCard({ icon: Icon, title, description, children }: { icon: React.ElementType; title: string; description: string; children: React.ReactNode }) {
  return (
    <SurfacePanel className="p-4 transition-all hover:border-[var(--brand)]/20 group">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--line)]/10 bg-[var(--surface)]">
          <Icon className="h-5 w-5 text-[var(--brand)]" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-[var(--text)]">{title}</div>
          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{description}</p>
        </div>
      </div>
      {children}
    </SurfacePanel>
  );
}
