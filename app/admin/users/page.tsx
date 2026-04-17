'use client';

import { ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AdminStats } from '@/components/admin/admin-stats';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { UserRolesDialog } from '@/components/admin/user-roles-dialog';
import { UsersTable } from '@/components/admin/users-table';
import { AlertMessage } from '@/components/common/alert-message';
import { EmptyState } from '@/components/common/empty-state';
import {
  ActionState,
  LoadingState,
} from '@/components/common/loading-state';
import { AppShell } from '@/components/layout/app-shell';
import { Badge } from '@/components/ui/badge';
import { useAdminData } from '@/hooks/use-admin-data';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useMyPermissions } from '@/hooks/use-my-permissions';
import { apiRequest } from '@/lib/fetcher';
import {
  getAccessibleAdminSections,
  getAuthenticatedNavItems,
  isSuperAdmin,
} from '@/lib/guards';
import { destroySession, hasSession } from '@/lib/session';
import type { RoleListItem, UserDetail, UserListItem } from '@/lib/types';

export default function AdminUsersPage() {
  const router = useRouter();
  const authenticated = hasSession();
  const {
    roles: currentRoles,
    permissions,
    loading: permissionLoading,
    error: permissionError,
    reload: reloadPermissions,
  } = useMyPermissions(authenticated);
  const adminItems = getAccessibleAdminSections(permissions, currentRoles);
  const navItems = getAuthenticatedNavItems(permissions, currentRoles);
  const canAccess = adminItems.some((item) => item.href === '/admin/users');
  const { user: currentUser } = useCurrentUser(authenticated);
  const { users, roles: availableRoles, loading, error, reload } = useAdminData(
    authenticated && canAccess && !permissionLoading,
    { users: true, roles: true },
  );
  const [selectedDeleteUser, setSelectedDeleteUser] =
    useState<UserListItem | null>(null);
  const [selectedRoleUser, setSelectedRoleUser] = useState<UserListItem | null>(null);
  const [selectedRoleUserDetail, setSelectedRoleUserDetail] =
    useState<UserDetail | null>(null);
  const [pendingUserId, setPendingUserId] = useState<number | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [userDetailLoading, setUserDetailLoading] = useState(false);
  const [userRolesSubmitPending, setUserRolesSubmitPending] = useState(false);

  useEffect(() => {
    if (!authenticated) {
      router.replace('/login');
    }
  }, [authenticated, router]);

  useEffect(() => {
    if (!permissionLoading && authenticated && !permissionError && !canAccess) {
      if (adminItems.length > 0) {
        router.replace(adminItems[0].href);
        return;
      }

      router.replace('/dashboard');
    }
  }, [
    adminItems,
    authenticated,
    canAccess,
    permissionError,
    permissionLoading,
    router,
  ]);

  const currentPage = users?.page || 1;
  const currentLimit = users?.limit || 10;
  const totals = useMemo(
    () => ({
      totalUsers: users?.total || 0,
      totalRoles: 0,
      totalPermissions: 0,
    }),
    [users?.total],
  );

  async function handleToggleUserStatus(user: UserListItem) {
    if (pendingUserId !== null) {
      return;
    }

    const nextStatus = user.status === 'active' ? 'frozen' : 'active';
    setPendingUserId(user.id);
    try {
      await apiRequest<{ message: string }>(`/api/users/${user.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      toast.success('用户状态更新成功');
      await reload(currentPage, currentLimit);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败');
    } finally {
      setPendingUserId(null);
    }
  }

  async function handleUserRolesEdit(user: UserListItem) {
    if (pendingUserId !== null || userDetailLoading || deletePending) {
      return;
    }

    setPendingUserId(user.id);
    setUserDetailLoading(true);
    setSelectedRoleUser(user);
    setSelectedRoleUserDetail(null);
    try {
      const result = await apiRequest<UserDetail>(`/api/users/${user.id}`);
      setSelectedRoleUserDetail(result.data);
    } catch (err) {
      setSelectedRoleUser(null);
      setSelectedRoleUserDetail(null);
      toast.error(err instanceof Error ? err.message : '加载用户详情失败');
    } finally {
      setUserDetailLoading(false);
      setPendingUserId(null);
    }
  }

  async function handleUserRolesSubmit(roleIds: number[]) {
    if (!selectedRoleUser || userRolesSubmitPending) {
      return;
    }

    const superAdminRole = availableRoles?.items.find(
      (role) => role.name === 'SuperAdmin',
    );
    const editingSelf = currentUser?.id === selectedRoleUser.id;
    const currentUserIsSuperAdmin = isSuperAdmin(currentRoles);
    const keepsSuperAdminRole =
      !superAdminRole || roleIds.includes(superAdminRole.id);

    if (editingSelf && currentUserIsSuperAdmin && !keepsSuperAdminRole) {
      toast.error('超级管理员不能移除自己的超管角色');
      return;
    }

    setUserRolesSubmitPending(true);
    setPendingUserId(selectedRoleUser.id);
    try {
      await apiRequest(`/api/users/${selectedRoleUser.id}/roles`, {
        method: 'PUT',
        body: JSON.stringify({ roleIds }),
      });
      toast.success('用户角色更新成功');
      setSelectedRoleUser(null);
      setSelectedRoleUserDetail(null);
      await reload(currentPage, currentLimit);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '更新失败');
    } finally {
      setUserRolesSubmitPending(false);
      setPendingUserId(null);
    }
  }

  async function handleDeleteConfirmed() {
    if (!selectedDeleteUser || deletePending) {
      return;
    }

    setDeletePending(true);
    setPendingUserId(selectedDeleteUser.id);

    try {
      await apiRequest<{ message: string }>(`/api/users/${selectedDeleteUser.id}`, {
        method: 'DELETE',
      });
      toast.success('用户删除成功');
      setSelectedDeleteUser(null);
      await reload(currentPage, currentLimit);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '删除失败');
    } finally {
      setDeletePending(false);
      setPendingUserId(null);
    }
  }

  if (!authenticated) {
    return (
      <AppShell navItems={[]}>
        <LoadingState label="正在跳转到登录页..." />
      </AppShell>
    );
  }

  if (permissionLoading) {
    return (
      <AppShell navItems={navItems}>
        <LoadingState label="正在确认管理权限..." />
      </AppShell>
    );
  }

  if (permissionError) {
    return (
      <AppShell navItems={[]}>
        <ActionState
          label="无法确认当前权限"
          detail={permissionError}
          actionLabel="重试"
          onAction={() => {
            void reloadPermissions();
          }}
        />
      </AppShell>
    );
  }

  if (!canAccess) {
    return (
      <AppShell navItems={[]}>
        <ActionState
          label="当前账号没有用户管理权限"
          detail="系统将返回可访问的管理页面。"
          actionLabel="返回登录"
          onAction={() => {
            destroySession();
            router.replace('/login');
          }}
        />
      </AppShell>
    );
  }

  if (loading) {
    return (
      <AppShell navItems={navItems}>
        <LoadingState label="正在加载用户数据..." />
      </AppShell>
    );
  }

  return (
    <AppShell navItems={navItems}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="page-title">用户管理</h1>
            <p className="mt-2 text-xs uppercase tracking-[0.05em] text-muted-foreground">
              管理系统用户、状态与分页列表
            </p>
          </div>
          <Badge variant="outline" className="gap-1.5 px-3 py-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            {totals.totalUsers} 用户
          </Badge>
        </div>

        {error ? (
          <AlertMessage
            type="error"
            message="加载用户管理数据失败"
            detail={error}
            actionLabel="重试"
            onAction={() => {
              void reload(currentPage, currentLimit);
            }}
          />
        ) : null}

        <AdminStats {...totals} />

        {users?.items.length ? (
          <UsersTable
            users={users.items}
            page={users.page}
            total={users.total}
            limit={users.limit}
            pendingUserId={pendingUserId}
            onPageChange={(page) => {
              void reload(page, currentLimit);
            }}
            onToggleStatus={(user) => {
              void handleToggleUserStatus(user);
            }}
            onAssignRoles={(user) => {
              void handleUserRolesEdit(user);
            }}
            onDelete={(user) => {
              if (pendingUserId !== null || selectedRoleUser) {
                return;
              }
              setSelectedDeleteUser(user);
            }}
          />
        ) : (
          <EmptyState label="暂无用户" />
        )}

        <ConfirmDialog
          open={Boolean(selectedDeleteUser)}
          pending={deletePending}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedDeleteUser(null);
            }
          }}
          title="确认操作"
          description={
            selectedDeleteUser
              ? `确定要删除用户 “${selectedDeleteUser.email}” 吗？此操作不可恢复。`
              : '确定要继续吗？'
          }
          confirmLabel="确认"
          onConfirm={() => {
            void handleDeleteConfirmed();
          }}
        />

        <UserRolesDialog
          user={selectedRoleUser}
          userDetail={selectedRoleUserDetail}
          roles={(availableRoles?.items || []) as RoleListItem[]}
          open={Boolean(selectedRoleUser)}
          detailLoading={userDetailLoading}
          pending={userRolesSubmitPending}
          currentUserIsSuperAdmin={isSuperAdmin(currentRoles)}
          editingSelf={currentUser?.id === selectedRoleUser?.id}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedRoleUser(null);
              setSelectedRoleUserDetail(null);
            }
          }}
          onSubmit={(roleIds) => {
            void handleUserRolesSubmit(roleIds);
          }}
        />
      </div>
    </AppShell>
  );
}
