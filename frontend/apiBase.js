// frontend/apiBase.js

// 固定指向你部署好的后端地址
const API_BASE = "https://multilang-backend-bl2m.onrender.com";

// 简单的 POST JSON 封装
export async function postJSON(path, body, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    ...opts,
  });
  return res;
}

// 健康检查（可选）
export function health() {
  return fetch(`${API_BASE}/health`);
}

export default API_BASE;
