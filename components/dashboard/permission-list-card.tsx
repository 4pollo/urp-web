import { EmptyState } from '../common/empty-state';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export function PermissionListCard({ permissions }: { permissions: string[] }) {
  return (
    <Card>
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between gap-3">
          <CardTitle>我的权限</CardTitle>
          <Badge variant="outline">{permissions.length} 项权限</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {permissions.length === 0 ? (
          <EmptyState label="暂无权限" />
        ) : (
          <div className="flex flex-wrap gap-2">
            {permissions.map((permission) => (
              <Badge
                key={permission}
                variant="secondary"
                className="px-3 py-2 normal-case tracking-normal"
              >
                {permission}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
