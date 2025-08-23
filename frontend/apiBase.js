// frontend/apiBase.js

// ✅ 你后端在 Render 的基础 URL（备选，用作兜底）
const FALLBACK_RENDER_URL = 'https://multilang-backend-bl2m.onrender.com';

// 1) 是否本地开发：Vite 的 DEV 标记，或主机名是 localhost/127.0.0.1
const isLocalHost = (() => {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  return h === 'localhost' || h === '127.0.0.1';
})();

const isDev = Boolean(import.meta?.env?.DEV);

// 2) 允许通过环境变量显式指定 API 基址（可选）
// 在前端 .env 或 Render 的环境变量里设置：VITE_API_BASE=https://your-backend/xxx
const envBase = (import.meta?.env?.VITE_API_BASE || '').trim();

// 3) 计算最终的 BASE：
// - 本地开发 → http://localhost:5000 （若你本地后端端口不同，就改这里）
// - 否则若设置了 VITE_API_BASE → 用它
// - 否则 → 用 Render 的兜底地址
export const BASE = isLocalHost || isDev
  ? 'http://localhost:5000'
  : (envBase || FALLBACK_RENDER_URL);

// 统一导出 API 路径
export const API = {
  health: `${BASE}/health`,
  tablegen: `${BASE}/api/tablegen`,
};
