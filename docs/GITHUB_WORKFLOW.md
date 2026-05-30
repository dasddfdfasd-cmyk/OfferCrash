# OfferCrash GitHub Collaboration Workflow

## 分支规则

- `main`：稳定可运行版本
- `frontend`：前端同学开发页面和组件
- `backend`：我开发 API、Prompt、类型、Mock 数据和文档

## 文件责任

前端负责：

- `app/page.tsx`
- `app/upload/**`
- `app/profile/**`
- `app/config/**`
- `app/meeting/**`
- `app/report/**`
- `components/**`
- `public/**`
- `app/globals.css`
- `app/layout.tsx`

我负责：

- `app/api/**`
- `lib/**`
- `types/**`
- `docs/**`
- `README.md`
- `.env.example`

## 合并规则

- 不直接向 `main` push
- 每次开发完从自己的分支提 Pull Request 到 `main`
- 合并前必须 `npm run build` 通过
- 不要覆盖对方负责的目录
