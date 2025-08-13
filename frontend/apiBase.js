// frontend/apiBase.js
// 读取后端基址（来自 Vite 环境变量），并去掉结尾的斜杠，避免出现 //api 的情况
const raw = import.meta.env.VITE_API_BASE || '';
export const API_BASE = raw.replace(/\/+$/, '');
