import { useEffect, useState } from 'react';
import { useAuth } from '../access/useRole';
import { api } from '../api/client';
import { ActionPanel, PageHeader, PrimaryButton, StateBlock, SurfacePanel } from '../components/ProductPrimitives';
import { inputClassName, selectClassName } from '../components/styles';
import { useToast } from '../hooks/useToast';
import type { RuntimeSettingsUpdate } from '../types';
import { formatDateTime } from '../utils/format';

export default function Settings() {
  const { user } = useAuth();
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
    return () => { cancelled = true; };
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

  if (loading) return <StateBlock tone="loading" title="正在加载运行设置" description="正在同步复核、在线判定和证据留存策略。" />;
  if (error && !settings) {
    return (
      <StateBlock
        tone="error"
        title="设置加载失败"
        description={error}
        action={<PrimaryButton icon="refresh" onClick={load}>重新加载</PrimaryButton>}
      />
    );
  }
  if (!settings) return null;
  const editable = Boolean(user?.permissions.includes('settings:write'));

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="设置"
        title="运行设置"
        description="集中管理持续运行中最影响可信度的配置：复核模式、在线窗口、证据留存和设备接入。"
        action={
          editable ? (
            <PrimaryButton icon="save" onClick={save} disabled={saving}>
              {saving ? '保存中...' : '保存设置'}
            </PrimaryButton>
          ) : (
            <PrimaryButton href="/health">查看系统健康</PrimaryButton>
          )
        }
      />

      {!editable && (
        <ActionPanel
          tone="warning"
          title="当前角色只能查看设置"
          description="只有具备 settings:write 权限的账号可以修改运行参数。当前账号仅限运维查看。"
          action={<PrimaryButton href="/health">前往系统健康</PrimaryButton>}
        />
      )}

      <ActionPanel
        tone={error ? 'danger' : 'success'}
        title={error ? '上次保存失败' : '设置由后端持久化'}
        description={error ? `${error}。请确认本地后端可用后重试。` : `最近保存：${updatedAt ? formatDateTime(updatedAt) : '等待首次保存'}。下一步：检查系统健康以确认运行状态。`}
        action={error ? <PrimaryButton icon="refresh" onClick={save}>重新保存</PrimaryButton> : <PrimaryButton href="/health">查看系统健康</PrimaryButton>}
      />

      <div className="mt-lg grid gap-4 lg:grid-cols-2">
        <SettingCard icon="shield" title="复核策略" description="所有疑似事件必须经过人工复核后才能确认。">
          <select
            className={selectClassName('mt-3 w-full')}
            value={settings.review_mode}
            onChange={(e) => editable && update('review_mode', e.target.value as RuntimeSettingsUpdate['review_mode'])}
            disabled={!editable}
          >
            <option value="manual">人工复核优先</option>
            <option value="strict">要求完整证据链</option>
          </select>
          <label className="mt-3 flex items-start gap-3 rounded-lg border border-outline-variant/10 bg-surface-container p-3 text-body-sm text-on-surface-variant transition-all hover:border-primary/20">
            <input
              type="checkbox"
              checked={settings.require_complete_evidence}
              onChange={(e) => editable && update('require_complete_evidence', e.target.checked)}
              disabled={!editable}
              className="mt-0.5 h-4 w-4 rounded border-outline-variant bg-background text-primary focus:ring-primary focus:ring-offset-0"
            />
            <span>确认前要求具备进入前、峰值、离开后三段证据</span>
          </label>
        </SettingCard>
        <SettingCard icon="wifi" title="在线判定窗口" description="设备超过该秒数未上报心跳后，将显示为离线。">
          <NumberInput
            value={settings.online_window_seconds}
            min={10}
            max={3600}
            onChange={(value) => editable && update('online_window_seconds', value)}
            disabled={!editable}
          />
        </SettingCard>
        <SettingCard icon="delete" title="证据留存" description="控制持续运行期间证据目录的增长。">
          <NumberInput
            value={settings.evidence_retention_days}
            min={1}
            max={3650}
            onChange={(value) => editable && update('evidence_retention_days', value)}
            disabled={!editable}
          />
        </SettingCard>
        <SettingCard icon="shield" title="设备接入" description="当前局域网演示默认开放；生产环境应接入设备令牌。">
          <select
            className={selectClassName('mt-3 w-full')}
            value={settings.device_access_mode}
            onChange={(e) => editable && update('device_access_mode', e.target.value as RuntimeSettingsUpdate['device_access_mode'])}
            disabled={!editable}
          >
            <option value="open">局域网开放接入</option>
            <option value="token">要求设备令牌（后续 Android 集成）</option>
          </select>
          <div className="mt-3 rounded-lg border border-outline-variant/10 bg-surface-container p-3 text-body-sm text-on-surface-variant">下一步：Android 上传携带令牌后启用令牌校验。</div>
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

function SettingCard({ icon, title, description, children }: { icon: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <SurfacePanel className="p-4 transition-all hover:border-primary/20 group">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-outline-variant/10 bg-surface-container">
          <span className="material-symbols-outlined text-primary text-xl">{icon}</span>
        </div>
        <div className="flex-1">
          <div className="font-semibold text-on-surface">{title}</div>
          <p className="mt-1 text-body-sm leading-6 text-on-surface-variant">{description}</p>
        </div>
      </div>
      {children}
    </SurfacePanel>
  );
}
