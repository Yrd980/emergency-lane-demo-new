import { useRole } from '../access/useRole';
import { canAccess, type Role } from '../access/permissions';
import { ActionPanel, PrimaryButton } from './ProductPrimitives';

export default function AccessGate({ allowed, children }: { allowed: readonly Role[]; children: React.ReactNode }) {
  const { role } = useRole();

  if (!canAccess(role, allowed)) {
    return (
      <div className="space-y-5">
        <ActionPanel
          tone="warning"
          title="当前身份没有权限访问该页面"
          description={`当前角色是 ${role}，这个页面只对指定身份开放。切换身份后可继续。`}
          action={<PrimaryButton href="/" >返回工作台</PrimaryButton>}
        />
      </div>
    );
  }

  return children;
}
