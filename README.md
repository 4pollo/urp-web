# URP Web

基于 Next.js 构建的 URP 前端管理台，提供登录、注册、用户面板以及用户/角色/权限管理页面。

## 技术栈

- Next.js App Router
- React 19
- Tailwind CSS
- shadcn/ui
- sonner

## 环境变量

复制 `.env.example` 为 `.env.local`：

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

## 开发命令

```bash
npm install
npm run dev
npm run build
npm run start
npm run lint
```

## 主要页面

- `/login`
- `/register`
- `/dashboard`
- `/admin/users`
- `/admin/roles`
- `/admin/permissions`

## 说明

该仓库是拆分后的正式前端仓库，不再依赖 monorepo 根级 `dev:web` / `build:web` 包装脚本。
API 地址应通过环境变量配置，而不是依赖同仓库上下文。
