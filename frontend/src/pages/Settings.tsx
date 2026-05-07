import { useEffect, useState } from 'react';
import { useAuth } from '../access/useRole';
import { api } from '../api/client';
import { ActionPanel, PageHeader, PrimaryButton, StateBlock, SurfacePanel } from '../components/ProductPrimitives';
import { inputClassName } from '../components/styles';
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
      showToast('Settings saved to local backend, persisted across page reloads.', 'success');
    } catch (e: unknown) {
      const message = (e as Error).message;
      setError(message);
      showToast(`Settings save failed: ${message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <StateBlock tone="loading" title="Loading runtime settings" description="Syncing review, online detection, and evidence retention policies." />;
  if (error && !settings) {
    return (
      <StateBlock
        tone="error"
        title="Settings load failed"
        description={error}
        action={<PrimaryButton icon="refresh" onClick={load}>Retry Load</PrimaryButton>}
      />
    );
  }
  if (!settings) return null;
  const editable = Boolean(user?.permissions.includes('settings:write'));

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="SETTINGS"
        title="Runtime Settings"
        description="Surface the configs that most affect trust during long-running use: review mode, online window, evidence retention, and device access."
        action={
          editable ? (
            <PrimaryButton icon="save" onClick={save} disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </PrimaryButton>
          ) : (
            <PrimaryButton href="/health">View System Health</PrimaryButton>
          )
        }
      />

      {!editable && (
        <ActionPanel
          tone="warning"
          title="Current role can only view settings"
          description="Only accounts with settings:write can modify runtime parameters. Current account is limited to operational viewing."
          action={<PrimaryButton href="/health">Go to System Health</PrimaryButton>}
        />
      )}

      <ActionPanel
        tone={error ? 'danger' : 'success'}
        title={error ? 'Last save failed' : 'Settings backed by backend persistence'}
        description={error ? `${error}. Confirm local backend is available and retry.` : `Last saved: ${updatedAt ? formatDateTime(updatedAt) : 'Awaiting first save'}. Next: check system health to confirm runtime state.`}
        action={error ? <PrimaryButton icon="refresh" onClick={save}>Re-save</PrimaryButton> : <PrimaryButton href="/health">View System Health</PrimaryButton>}
      />

      <div className="mt-lg grid gap-4 lg:grid-cols-2">
        <SettingCard icon="shield" title="Review Policy" description="All suspected events must be manually reviewed before confirmation.">
          <select
            className={inputClassName('mt-3 w-full')}
            value={settings.review_mode}
            onChange={(e) => editable && update('review_mode', e.target.value as RuntimeSettingsUpdate['review_mode'])}
            disabled={!editable}
          >
            <option value="manual">Manual Review Priority</option>
            <option value="strict">Complete Evidence Required</option>
          </select>
          <label className="mt-3 flex items-start gap-3 rounded-lg border border-outline-variant/10 bg-surface-container p-3 text-body-sm text-on-surface-variant transition-all hover:border-primary/20">
            <input
              type="checkbox"
              checked={settings.require_complete_evidence}
              onChange={(e) => editable && update('require_complete_evidence', e.target.checked)}
              disabled={!editable}
              className="mt-0.5 h-4 w-4 rounded border-outline-variant bg-background text-primary focus:ring-primary focus:ring-offset-0"
            />
            <span>Require before / peak / after evidence completeness before confirming</span>
          </label>
        </SettingCard>
        <SettingCard icon="wifi" title="Online Detection Window" description="Devices are shown as offline after exceeding this number of seconds without a heartbeat.">
          <NumberInput
            value={settings.online_window_seconds}
            min={10}
            max={3600}
            onChange={(value) => editable && update('online_window_seconds', value)}
            disabled={!editable}
          />
        </SettingCard>
        <SettingCard icon="delete" title="Evidence Retention" description="Control evidence directory growth during long-running use.">
          <NumberInput
            value={settings.evidence_retention_days}
            min={1}
            max={3650}
            onChange={(value) => editable && update('evidence_retention_days', value)}
            disabled={!editable}
          />
        </SettingCard>
        <SettingCard icon="shield" title="Device Access" description="Current LAN demo defaults to open; production should integrate device tokens.">
          <select
            className={inputClassName('mt-3 w-full')}
            value={settings.device_access_mode}
            onChange={(e) => editable && update('device_access_mode', e.target.value as RuntimeSettingsUpdate['device_access_mode'])}
            disabled={!editable}
          >
            <option value="open">LAN Open Access</option>
            <option value="token">Require Device Token (future Android integration)</option>
          </select>
          <div className="mt-3 rounded-lg border border-outline-variant/10 bg-surface-container p-3 text-body-sm text-on-surface-variant">Next: enforce token check after Android upload carries tokens.</div>
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
