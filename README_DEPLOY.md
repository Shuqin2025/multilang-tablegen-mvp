# GitHub 模板与 Render 部署说明

## 一、创建 GitHub 仓库并标记为模板
1. 在 GitHub 新建空仓库，例如 `multilang-tablegen-mvp`；
2. 上传代码（或直接把 zip 解压后用 Git 推送）；
3. 在仓库 **Settings → General → Template repository** 勾选；
4. 之后可通过 **Use this template** 一键派生新仓库。

## 二、Render 一键部署（使用 render.yaml）
1. 打开 Render → New + → **Blueprint**；
2. 选择你的 GitHub 仓库；
3. Render 会读取 `render.yaml`，创建两个服务：
   - Web: `tablegen-backend`
   - Static: `tablegen-frontend`
4. 首次部署完成后，将后端实际 URL（如 `https://xxx.onrender.com`）
   - 填入后端服务的 `BASE_URL`
   - 填入前端服务的 `VITE_API_BASE`
5. 重新部署前端，即可从前端访问后端接口。

## 三、本地快速启动（回顾）
```bash
# Backend
cd backend && cp .env.example .env && npm install && npm run dev
# Frontend
cd ../frontend && cp .env.example .env && npm install && npm run dev
```

## 四、常见问题
- 若前端 404：检查 `VITE_API_BASE` 是否为后端外网地址；
- 若文件下载失败：确认后端 `/files` 目录为静态可访问，`BASE_URL` 已正确设置；
- 若跨域：在后端 `server.js` 中启用了 `cors()`，确保前端域名已加入允许列表（如有需要可收紧）。
