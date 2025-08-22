// frontend/apiBase.js

// 统一确定后端基址：优先 .env / Render 环境变量，兜底用你的线上后端
const FALLBACK = 'https://multilang-backend-bl2m.onrender.com';

export const API_BASE =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE) ||
  (typeof window !== 'undefined' && window.__env?.VITE_API_BASE) ||
  FALLBACK;

// 简单的 POST JSON 封装（可选）
export async function postJSON(path, body, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    ...opts,
  });
  return res;
}

// 健康检查（可选）
export function health() {
  return fetch(`${API_BASE}/health`);
}

// 也导出一个默认值，避免有人用 default 导入
export default API_BASE;
