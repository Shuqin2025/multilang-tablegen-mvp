// frontend/apiBase.js
// 最简单&稳妥：直连线上后端
export const API_BASE = "https://multilang-backend-bl2m.onrender.com";

// 统一的 POST JSON 封装
export async function postJSON(path, body, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    // 一定不要加 mode:"no-cors"，否则会导致“Failed to fetch”
    ...opts,
  });
  return res;
}

// 健康检查（可选）
export function health() {
  return fetch(`${API_BASE}/health`);
}

export default API_BASE;
