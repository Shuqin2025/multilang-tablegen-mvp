// frontend/patchFetch.js
import { API_BASE } from './apiBase';

// 兜底：如果没有配置 VITE_API_BASE，则保持原样不处理
if (API_BASE) {
  const origFetch = window.fetch.bind(window);

  window.fetch = (input, init) => {
    try {
      // 情况1：传入的是纯字符串 URL
      if (typeof input === 'string') {
        // 只处理以 /api 开头的相对地址
        if (input.startsWith('/api')) {
          return origFetch(`${API_BASE}${input}`, init);
        }
        return origFetch(input, init);
      }

      // 情况2：传入的是 Request 对象
      if (input instanceof Request) {
        // 用 URL 解析保证相对路径也能正确判断
        const u = new URL(input.url, window.location.origin);
        if (u.pathname.startsWith('/api')) {
          const newUrl = `${API_BASE}${u.pathname}${u.search}`;
          // 复制原 Request 的所有配置，构造一个新的 Request
          const newReq = new Request(newUrl, input);
          return origFetch(newReq);
        }
        return origFetch(input);
      }

      // 其他情况（极少见），原样透传
      return origFetch(input, init);
    } catch (e) {
      // 出错则不拦截，走原始 fetch
      return origFetch(input, init);
    }
  };
}
