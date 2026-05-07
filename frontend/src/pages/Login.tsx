import { useState } from 'react';
import { useAuth } from '../access/useRole';

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
    if (!ok) setError('Login failed. Check username and password.');
    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-margin text-on-surface">
      <form
        onSubmit={submit}
        className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-lg"
        style={{ width: 'min(24rem, calc(100vw - 48px))' }}
      >
        <div className="mb-lg">
          <div className="flex items-center gap-sm text-primary">
            <span className="material-symbols-outlined">shield</span>
            <h1 className="text-headline-md font-headline-md">Aegis Traffic</h1>
          </div>
          <p className="mt-sm text-body-sm text-on-surface-variant">Sign in with a local operations account.</p>
        </div>
        {error && <div className="mb-md rounded-lg border border-error/30 bg-error-container/10 p-3 text-body-sm text-error">{error}</div>}
        <label className="block text-label-xs font-label-xs uppercase tracking-wider text-on-surface-variant">
          Username
          <input
            className="mt-sm w-full rounded-lg border border-outline-variant/20 bg-background px-md py-sm text-body-sm text-on-surface outline-none focus:border-primary"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </label>
        <label className="mt-md block text-label-xs font-label-xs uppercase tracking-wider text-on-surface-variant">
          Password
          <input
            className="mt-sm w-full rounded-lg border border-outline-variant/20 bg-background px-md py-sm text-body-sm text-on-surface outline-none focus:border-primary"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button
          className="mt-lg flex min-h-10 w-full items-center justify-center rounded-lg bg-primary-container px-md py-sm text-label-xs font-bold text-on-primary-container transition-all hover:brightness-110 disabled:opacity-60"
          disabled={submitting}
        >
          {submitting ? 'Signing in...' : 'Sign In'}
        </button>
        <div className="mt-md rounded-lg bg-surface-container p-3 text-label-xs leading-5 text-on-surface-variant">
          Built-in accounts: admin/admin123, reviewer/review123, dispatcher/dispatch123, patrol/patrol123.
        </div>
      </form>
    </div>
  );
}
