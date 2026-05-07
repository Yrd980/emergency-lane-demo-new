import { useAuth } from '../access/useRole';
import { canAccess, type Permission } from '../access/permissions';
import { ActionPanel, PrimaryButton } from './ProductPrimitives';

export default function AccessGate({ allowed, children }: { allowed: readonly Permission[]; children: React.ReactNode }) {
  const { user } = useAuth();

  if (!user || !canAccess(user.permissions, allowed)) {
    return (
      <div className="space-y-5">
        <ActionPanel
          tone="warning"
          title="当前账号没有权限访问该页面"
          description={`当前账号是 ${user?.display_name ?? '未登录'}，此页面需要 ${allowed.join(', ')} 权限。`}
          action={<PrimaryButton href="/" >返回工作台</PrimaryButton>}
        />
      </div>
    );
  }

  return children;
}
