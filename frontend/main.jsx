// frontend/main.jsx
import './patchFetch.js';          // ⚠️ 一定要在最前面引入，让全局 fetch 补丁生效

import React from 'react';
import { createRoot } from 'react-dom/client';

// 你的根组件路径（和现在保持一致）
import App from './MultiLangTableMVP.jsx';

createRoot(document.getElementById('root')).render(<App />);

