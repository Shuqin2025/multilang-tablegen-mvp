// backend/services/crawler.js

// 模拟抓取数据的函数
async function fetchData(url) {
  console.log(`模拟抓取：${url}`);
  // 这里暂时返回 mock 数据
  return [
    { name: 'Product A', value: 100 },
    { name: 'Product B', value: 200 },
    { name: 'Product C', value: 300 }
  ];
}

export default { fetchData };
