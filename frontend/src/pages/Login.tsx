import { useState } from 'react';
import { useAuth } from '../access/useRole';
import { inputClassName } from '../components/styles';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const ok = await login(username, password);
    if (!ok) setError('登录失败，请检查用户名和密码。');
    setSubmitting(false);
  };

  return (
    <div className="grid min-h-screen bg-background text-on-surface lg:grid-cols-[1fr_27rem]">
      <section className="hidden min-h-screen flex-col justify-between border-r border-outline-variant/10 bg-surface-container-lowest p-xl lg:flex">
        <div>
          <div className="inline-flex items-center gap-sm text-primary">
            <span className="material-symbols-outlined text-[28px]">shield</span>
            <span className="text-[24px] font-semibold leading-tight">Aegis Traffic</span>
          </div>
          <h1 className="mt-xl max-w-xl text-[32px] font-semibold leading-tight text-on-surface">
            本地应急车道运维控制台。
          </h1>
          <p className="mt-md max-w-lg text-[15px] leading-6 text-on-surface-variant">
            登录后可审核证据、检查设备健康状态，并将已确认疑似事件流转到下一环节。
          </p>
        </div>
        <div className="grid grid-cols-3 gap-sm text-label-xs text-on-surface-variant">
          {['证据', '审核', '派发'].map((item) => (
            <div key={item} className="rounded-lg border border-outline-variant/10 bg-surface-container-low p-3">
              <span className="font-semibold text-primary">{item}</span>
            </div>
          ))}
        </div>
      </section>
      <div className="flex min-h-screen items-center justify-center px-md py-xl">
      <form
        onSubmit={submit}
        className="w-full rounded-lg border border-outline-variant/10 bg-surface-container-low p-lg"
        style={{ width: 'min(24rem, calc(100vw - 48px))' }}
      >
        <div className="mb-lg">
          <div className="flex items-center gap-sm text-primary">
            <span className="material-symbols-outlined">shield</span>
            <h1 className="text-headline-md font-headline-md">Aegis Traffic</h1>
          </div>
          <p className="mt-sm text-body-sm text-on-surface-variant">请使用本地运维账号登录。</p>
        </div>
        {error && <div className="mb-md rounded-lg border border-error/30 bg-error-container/10 p-3 text-body-sm text-error">{error}</div>}
        <label className="block text-label-xs font-label-xs uppercase tracking-wider text-on-surface-variant">
          用户名
          <input
            className={inputClassName('mt-sm w-full')}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </label>
        <label className="mt-md block text-label-xs font-label-xs uppercase tracking-wider text-on-surface-variant">
          密码
          <input
            className={inputClassName('mt-sm w-full')}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button
          className="mt-lg flex min-h-11 w-full items-center justify-center rounded-lg bg-primary-container px-md py-sm text-body-sm font-semibold text-on-primary-container transition-all hover:brightness-110 disabled:opacity-60"
          disabled={submitting}
        >
          {submitting ? '正在登录...' : '登录'}
        </button>
        <div className="mt-md rounded-lg bg-surface-container p-3 text-label-xs leading-5 text-on-surface-variant">
          内置账号：admin/admin123，reviewer/review123，dispatcher/dispatch123，patrol/patrol123。
        </div>
      </form>
      </div>
    </div>
  );
}
