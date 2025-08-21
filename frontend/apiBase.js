// frontend/apiBase.js
function pickBase() {
  // 1) Vite 编译期变量（首选）
  let v = (import.meta?.env?.VITE_API_BASE || '').trim();

  // 2) 运行期注入（如果你以后在 index.html 里挂 window.__env 也能吃到）
  if (!v && typeof window !== 'undefined' && window.__env?.VITE_API_BASE) {
    v = String(window.__env.VITE_API_BASE).trim();
  }

  // 3) 兜底：直接写死线上后端（让你马上可用）
  if (!v) v = 'https://multilang-backend-bl2m.onrender.com';

  // 统一去掉尾部斜杠，避免出现 //api/tablegen
  if (v.endsWith('/')) v = v.slice(0, -1);
  return v;
}

export const API_BASE = pickBase();

export function apiUrl(p) {
  // 确保拼出来是 https://.../api/xxx 而不是 //api/xxx
  return API_BASE + (p.startsWith('/') ? p : `/${p}`);
}

