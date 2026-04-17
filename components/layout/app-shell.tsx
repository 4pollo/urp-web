'use client';

import Link from 'next/link';
import {
  Gauge,
  KeyRound,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
  Sun,
  Users,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

const SIDEBAR_COLLAPSED_STORAGE_KEY = 'app-shell:sidebar-collapsed';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { destroySession } from '@/lib/session';
import type { AuthNavItem } from '@/lib/types';
import { cn } from '@/lib/utils';

export function AppShell({
  children,
  navItems = [],
}: {
  children: ReactNode;
  navItems?: AuthNavItem[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedValue = window.localStorage.getItem(
      SIDEBAR_COLLAPSED_STORAGE_KEY,
    );
    setSidebarCollapsed(storedValue === 'true');
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    window.localStorage.setItem(
      SIDEBAR_COLLAPSED_STORAGE_KEY,
      String(sidebarCollapsed),
    );
  }, [mounted, sidebarCollapsed]);

  const activeTheme = mounted ? resolvedTheme || theme || 'light' : 'light';

  const navIcons: Record<AuthNavItem['href'], ReactNode> = {
    '/dashboard': <Gauge className="h-4 w-4 shrink-0" />,
    '/admin/users': <Users className="h-4 w-4 shrink-0" />,
    '/admin/roles': <Shield className="h-4 w-4 shrink-0" />,
    '/admin/permissions': <KeyRound className="h-4 w-4 shrink-0" />,
  };

  function renderNavItems(collapsed = false, closeOnNavigate = false) {
    return navItems.map((item) => {
      const active =
        pathname === item.href || pathname.startsWith(`${item.href}/`);

      return (
        <Button
          key={item.href}
          asChild
          variant={active ? 'default' : 'ghost'}
          className={cn(
            'rounded-none',
            collapsed ? 'w-full px-0' : 'w-full justify-start',
            !active && 'text-muted-foreground',
          )}
        >
          <Link
            href={item.href}
            aria-label={item.label}
            className={cn(
              'flex w-full items-center',
              collapsed ? 'justify-center' : 'justify-start gap-3',
            )}
            onClick={() => {
              if (closeOnNavigate) {
                setMobileSidebarOpen(false);
              }
            }}
          >
            {navIcons[item.href]}
            {collapsed ? null : <span className="truncate text-xs">{item.label}</span>}
          </Link>
        </Button>
      );
    });
  }

  return (
    <div
      className={cn(
        'flex min-h-screen flex-col bg-background text-foreground transition-[grid-template-columns] duration-200 ease-out lg:h-screen lg:overflow-hidden lg:grid',
        sidebarCollapsed
          ? 'lg:grid-cols-[77px_minmax(0,1fr)]'
          : 'lg:grid-cols-[220px_minmax(0,1fr)]',
      )}
    >
      <aside className="hidden shrink-0 flex-col overflow-hidden border-r border-border bg-card transition-[width] duration-200 ease-out lg:flex lg:h-screen">
        <div
          className={cn(
            'flex h-[77px] shrink-0 items-center border-b border-border py-5 transition-[padding] duration-200 ease-out',
            sidebarCollapsed ? 'justify-center px-3' : 'justify-between px-6',
          )}
        >
          {sidebarCollapsed ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="展开侧边栏"
              onClick={() => {
                setSidebarCollapsed(false);
              }}
            >
              <PanelLeftOpen className="h-4 w-4" />
            </Button>
          ) : (
            <>
              <div className="font-['Syne'] text-2xl font-extrabold uppercase tracking-[-0.02em] text-foreground">
                URP
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="折叠侧边栏"
                onClick={() => {
                  setSidebarCollapsed(true);
                }}
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
        <ScrollArea className="flex-1">
          <nav className="flex flex-col gap-1 p-3">
            {renderNavItems(sidebarCollapsed)}
          </nav>
        </ScrollArea>
      </aside>
      <Dialog open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <DialogContent className="left-0 top-0 h-screen w-[280px] max-w-[80vw] translate-x-0 translate-y-0 gap-0 border-r p-0 data-[state=closed]:slide-out-to-left-1 data-[state=open]:slide-in-from-left-1 sm:max-w-[80vw] lg:hidden">
          <DialogTitle className="sr-only">导航菜单</DialogTitle>
          <DialogDescription className="sr-only">
            选择要进入的后台页面。
          </DialogDescription>
          <div className="flex h-full flex-col bg-card">
            <div className="flex h-[77px] shrink-0 items-center border-b border-border px-6 py-5">
              <div className="font-['Syne'] text-2xl font-extrabold uppercase tracking-[-0.02em] text-foreground">
                URP
              </div>
            </div>
            <ScrollArea className="flex-1">
              <nav className="flex flex-col gap-1 p-3">
                {renderNavItems(false, true)}
              </nav>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:h-screen">
        <header className="flex h-[77px] shrink-0 items-center justify-between border-b border-border bg-background/95 px-6 py-5 backdrop-blur-sm lg:justify-end lg:px-8">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="lg:hidden"
            aria-label="打开导航菜单"
            onClick={() => {
              setMobileSidebarOpen(true);
            }}
          >
            <PanelLeftOpen className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              aria-label={
                activeTheme === 'dark' ? '切换到浅色模式' : '切换到深色模式'
              }
              onClick={() => {
                setTheme(activeTheme === 'dark' ? 'light' : 'dark');
              }}
            >
              {activeTheme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                destroySession();
                router.replace('/login');
              }}
            >
              退出登录
            </Button>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="px-6 py-8 lg:px-8 lg:py-10">{children}</div>
        </main>
      </div>
    </div>
  );
}
