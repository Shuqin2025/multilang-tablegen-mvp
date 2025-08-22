// frontend/apiBase.js

// 兜底：如果没有设置环境变量，就用线上后端
const FALLBACK = 'https://multilang-backend-bl2m.onrender.com';

// 兼容：Vite 的 import.meta.env、在页面注入的 window.__env，最后兜底
export const API_BASE =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE) ||
  (typeof window !== 'undefined' && window.__env?.VITE_API_BASE) ||
  FALLBACK;

// 一个简单的 POST JSON 封装（可选）
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

// 同时提供默认导出，兼容 `import api from './apiBase'`
export default API_BASE;
