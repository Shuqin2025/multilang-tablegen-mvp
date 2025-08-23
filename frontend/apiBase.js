// frontend/apiBase.js

// 兜底后端地址（按需替换为你的后端域名）
const FALLBACK_RENDER_URL = 'https://multilang-backend-bl2m.onrender.com';

// 本地开发判定
const isLocalHost = (() => {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  return h === 'localhost' || h === '127.0.0.1';
})();
const isDev = Boolean(import.meta?.env?.DEV);

// 环境变量地址
const envBase = (import.meta?.env?.VITE_API_BASE || '').trim();

// 最终 BASE
export const BASE = isLocalHost || isDev
  ? 'http://localhost:5000'
  : (envBase || FALLBACK_RENDER_URL);

// 常用 API
export const API = {
  health: `${BASE}/health`,
  tablegen: `${BASE}/api/tablegen`,
};

// ➕ 补上 TablegenPage.jsx 需要的 postJSON 助手
export async function postJSON(pathOrUrl, body) {
  const url = pathOrUrl.startsWith('http')
    ? pathOrUrl
    : `${BASE}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
}
