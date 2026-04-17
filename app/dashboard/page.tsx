'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EmptyState } from '@/components/common/empty-state';
import { LoadingState } from '@/components/common/loading-state';
import { AppShell } from '@/components/layout/app-shell';
import { useMyPermissions } from '@/hooks/use-my-permissions';
import { getAuthenticatedNavItems } from '@/lib/guards';
import { hasSession } from '@/lib/session';

export default function DashboardPage() {
  const router = useRouter();
  const authenticated = hasSession();
  const { roles, permissions } = useMyPermissions(authenticated);
  const navItems = getAuthenticatedNavItems(permissions, roles);

  useEffect(() => {
    if (!authenticated) {
      router.replace('/login');
    }
  }, [authenticated, router]);

  if (!authenticated) {
    return (
      <AppShell navItems={[]}>
        <LoadingState label="正在跳转到登录页..." />
      </AppShell>
    );
  }

  return (
    <AppShell navItems={navItems}>
      <div className="mb-12 space-y-2">
        <h1 className="page-title">控制台</h1>
        <p className="text-xs uppercase tracking-[0.05em] text-muted-foreground">
          查看系统概览与后续扩展内容
        </p>
      </div>
      <EmptyState
        label="控制台内容建设中"
        detail="当前页面已预留为独立控制台，后续可在此承载概览、快捷入口和统计信息。"
      />
    </AppShell>
  );
}
