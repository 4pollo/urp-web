'use client';

import { Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { toast } from 'sonner';
import { changePassword } from '@/lib/auth';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../ui/input-group';
import { Label } from '../ui/label';

export function ChangePasswordCard() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const currentPasswordValue = formData.get('currentPassword');
    const newPasswordValue = formData.get('newPassword');
    const confirmPasswordValue = formData.get('confirmPassword');
    const currentPassword =
      typeof currentPasswordValue === 'string' ? currentPasswordValue : '';
    const newPassword = typeof newPasswordValue === 'string' ? newPasswordValue : '';
    const confirmPassword =
      typeof confirmPasswordValue === 'string' ? confirmPasswordValue : '';

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('请完整填写密码信息');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('新密码长度至少为 6 位');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('两次输入的新密码不一致');
      return;
    }

    setIsSubmitting(true);

    try {
      await changePassword(currentPassword, newPassword);
      toast.success('密码修改成功');
      form.reset();
      setOpen(false);
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '修改密码失败');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <LockKeyhole className="mr-2 h-4 w-4" />
        修改密码
      </Button>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!isSubmitting) {
            setOpen(nextOpen);
          }
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>修改密码</DialogTitle>
            <DialogDescription>请输入当前密码并设置新的登录密码。</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-5"
            onSubmit={(event) => {
              void handleSubmit(event);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="current-password">当前密码</Label>
              <InputGroup>
                <InputGroupInput
                  id="current-password"
                  name="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  placeholder="请输入当前密码"
                  required
                  autoComplete="current-password"
                />
                <InputGroupAddon>
                  <button
                    className="inline-flex h-8 w-8 items-center justify-center rounded-none text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    type="button"
                    tabIndex={-1}
                    aria-label={showCurrentPassword ? '隐藏当前密码' : '显示当前密码'}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => setShowCurrentPassword((value) => !value)}
                  >
                    {showCurrentPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </InputGroupAddon>
              </InputGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">新密码</Label>
              <InputGroup>
                <InputGroupInput
                  id="new-password"
                  name="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="请输入新密码"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
                <InputGroupAddon>
                  <button
                    className="inline-flex h-8 w-8 items-center justify-center rounded-none text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    type="button"
                    tabIndex={-1}
                    aria-label={showNewPassword ? '隐藏新密码' : '显示新密码'}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => setShowNewPassword((value) => !value)}
                  >
                    {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </InputGroupAddon>
              </InputGroup>
              <p className="text-xs text-muted-foreground">新密码长度至少为 6 位</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">确认新密码</Label>
              <InputGroup>
                <InputGroupInput
                  id="confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="请再次输入新密码"
                  required
                  autoComplete="new-password"
                />
                <InputGroupAddon>
                  <button
                    className="inline-flex h-8 w-8 items-center justify-center rounded-none text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    type="button"
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? '隐藏确认密码' : '显示确认密码'}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => setShowConfirmPassword((value) => !value)}
                  >
                    {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </InputGroupAddon>
              </InputGroup>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => setOpen(false)}
              >
                取消
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '提交中...' : '确认修改'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
