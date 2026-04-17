'use client';

import { useEffect, useMemo, useState } from 'react';
import type { RoleListItem, UserDetail, UserListItem } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';

export function UserRolesDialog({
  user,
  userDetail,
  roles,
  open,
  detailLoading = false,
  pending = false,
  currentUserIsSuperAdmin = false,
  editingSelf = false,
  onOpenChange,
  onSubmit,
}: {
  user: UserListItem | null;
  userDetail: UserDetail | null;
  roles: RoleListItem[];
  open: boolean;
  detailLoading?: boolean;
  pending?: boolean;
  currentUserIsSuperAdmin?: boolean;
  editingSelf?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (roleIds: number[]) => void;
}) {
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);

  useEffect(() => {
    setSelectedRoleIds(userDetail?.roles.map((role) => role.id) || []);
  }, [userDetail]);

  const initialRoleIds = useMemo(
    () => (userDetail?.roles.map((role) => role.id) || []).sort((a, b) => a - b),
    [userDetail],
  );
  const currentRoleIds = useMemo(
    () => [...selectedRoleIds].sort((a, b) => a - b),
    [selectedRoleIds],
  );
  const selectionChanged = useMemo(() => {
    if (!userDetail) {
      return false;
    }

    if (initialRoleIds.length !== currentRoleIds.length) {
      return true;
    }

    return initialRoleIds.some((id, index) => id !== currentRoleIds[index]);
  }, [currentRoleIds, initialRoleIds, userDetail]);

  const disableClose = detailLoading || pending;
  const targetHasSuperAdmin = Boolean(
    userDetail?.roles.some((role) => role.name === 'SuperAdmin'),
  );

  function handleRoleToggle(roleId: number, checked: boolean) {
    if (detailLoading || pending) {
      return;
    }

    setSelectedRoleIds((current) => {
      if (checked) {
        return current.includes(roleId) ? current : [...current, roleId];
      }

      return current.filter((id) => id !== roleId);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!disableClose) {
          onOpenChange(nextOpen);
        }
      }}
    >
      <DialogContent className="max-w-3xl sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>分配角色</DialogTitle>
          <DialogDescription>
            为当前用户勾选需要分配的角色。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>用户信息</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label>邮箱</Label>
                <div className="text-sm text-foreground">{user?.email || '-'}</div>
              </div>
              <div className="space-y-1">
                <Label>状态</Label>
                <div>
                  <Badge variant={user?.status === 'active' ? 'secondary' : 'outline'}>
                    {user?.status === 'active' ? '正常' : '冻结'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <CardTitle>角色分配</CardTitle>
                <Badge variant="secondary">
                  {selectedRoleIds.length} / {roles.length}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">勾选后将覆盖当前用户已有角色。</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {targetHasSuperAdmin ? (
                <Alert>
                  <AlertTitle>超级管理员保底机制</AlertTitle>
                  <AlertDescription>
                    {editingSelf && currentUserIsSuperAdmin
                      ? '当前登录的超级管理员不能移除自己的超管角色；系统也不能移除最后一个超级管理员。'
                      : '系统不能移除最后一个超级管理员；如果后端判定触发保底机制，将拒绝本次提交。'}
                  </AlertDescription>
                </Alert>
              ) : null}

              {detailLoading ? (
                <Alert>
                  <AlertTitle>加载中</AlertTitle>
                  <AlertDescription>正在加载用户角色...</AlertDescription>
                </Alert>
              ) : !userDetail ? (
                <Alert variant="destructive">
                  <AlertTitle>加载失败</AlertTitle>
                  <AlertDescription>未获取到用户详情。</AlertDescription>
                </Alert>
              ) : roles.length === 0 ? (
                <Alert>
                  <AlertTitle>暂无角色</AlertTitle>
                  <AlertDescription>当前系统还没有可分配的角色。</AlertDescription>
                </Alert>
              ) : (
                <ScrollArea>
                  <div className="grid gap-3 md:grid-cols-2">
                    {roles.map((role) => {
                      const checked = selectedRoleIds.includes(role.id);

                      return (
                        <div key={role.id} className="border border-border bg-background">
                          <div className="flex items-start gap-3 p-3">
                            <div className="pt-0.5">
                              <Checkbox
                                id={`role-${role.id}`}
                                checked={checked}
                                disabled={detailLoading || pending}
                                onCheckedChange={(value) => {
                                  handleRoleToggle(role.id, value === true);
                                }}
                              />
                            </div>
                            <div className="min-w-0 flex-1 space-y-1">
                              <Label htmlFor={`role-${role.id}`} className="block space-y-1 text-sm">
                                <span className="block font-medium text-foreground">{role.name}</span>
                                <span className="block text-xs text-muted-foreground">
                                  {role.description || '暂无描述'}
                                </span>
                              </Label>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  disabled={disableClose}
                  onClick={() => onOpenChange(false)}
                >
                  取消
                </Button>
                <Button
                  type="button"
                  disabled={detailLoading || pending || !userDetail || !selectionChanged}
                  onClick={() => onSubmit(selectedRoleIds)}
                >
                  {pending ? '保存中...' : '保存角色'}
                </Button>
              </DialogFooter>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
