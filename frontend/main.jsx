// frontend/main.jsx
// 入口文件：挂载 TablegenPage 到 #root

import React from 'react';
import { createRoot } from 'react-dom/client';
import TablegenPage from './TablegenPage.jsx';

// （可选）如果你项目里有 fetch 补丁（例如 patchFetch.js），保留下一行；没有就删掉：
// import './patchFetch.js';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <TablegenPage />
  </React.StrictMode>
);
