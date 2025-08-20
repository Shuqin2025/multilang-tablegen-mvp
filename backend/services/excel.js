// backend/services/excel.js
// 极简占位：把数据转成 CSV 文本，再返回 Buffer，先保证服务能启动
export async function generateExcel(data = []) {
  // data 应该是对象数组；这里先简单转 CSV
  const rows = Array.isArray(data) ? data : [];
  const headers = rows.length ? Object.keys(rows[0]) : [];
  const csvLines = [
    headers.join(','),                             // 表头
    ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(',')),
  ];
  const csv = csvLines.join('\n');
  return Buffer.from(csv, 'utf8');                 // 返回 Buffer，路由里会直接 res.send(buffer)
}

export default { generateExcel };
