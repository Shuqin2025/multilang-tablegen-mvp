// frontend/apiBase.js
// 解析后端 API 基址的终极稳妥版（优先级：Vite 环境变量 -> window.__env -> process.env -> fallback）

const FALLBACK = 'https://multilang-backend-bl2m.onrender.com';

function pickEnvBase() {
  // 1) Vite 环境变量（构建时注入）
  try {
    if (typeof import !== 'undefined' && typeof import.meta !== 'undefined') {
      const v = import.meta?.env?.VITE_API_BASE;
      if (v && typeof v === 'string') return v;
    }
  } catch (_) {}

  // 2) 运行时注入（可选，在 index.html 里注入 <script>window.__env={VITE_API_BASE:'...'}</script>）
  try {
    if (typeof window !== 'undefined' && window.__env?.VITE_API_BASE) {
      return window.__env.VITE_API_BASE;
    }
  } catch (_) {}

  // 3) process.env（极少用到，主要给 SSR/Node 侧兜底）
  try {
    if (typeof process !== 'undefined' && process.env?.VITE_API_BASE) {
      return process.env.VITE_API_BASE;
    }
  } catch (_) {}

  // 4) 兜底：硬编码后端域名
  return FALLBACK;
}

function normalizeBase(u) {
  // 去掉多余的尾部斜杠，避免拼接路径出现双斜杠
  return String(u || '').replace(/\/+$/, '');
}

export const API_BASE = normalizeBase(pickEnvBase());

// —— 简单的 POST JSON 封装 ——
// 用法：postJSON('/api/tablegen', { urls: [...], fields: [...], languages: [...], format: 'excel' })
export async function postJSON(path, body, fetchInit = {}) {
  const url = API_BASE + (String(path).startsWith('/') ? path : '/' + path);
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(fetchInit.headers || {}),
    },
    body: JSON.stringify(body || {}),
    ...fetchInit,
  });
  return res;
}

// 后端健康检查（GET /health）
export async function health() {
  const res = await fetch(API_BASE + '/health');
  return res.ok ? res.json() : { ok: false, status: res.status };
}

// 默认导出基址字符串（部分代码直接 import API_BASE 也能用）
export default API_BASE;

// 可选：开发期打印一下解析结果，方便排查
if (typeof console !== 'undefined') {
  console.debug('[apiBase] Resolved API_BASE =', API_BASE);
}
