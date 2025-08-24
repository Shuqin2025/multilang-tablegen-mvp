// backend/services/crawler.js
// 100% CommonJS；Node 20 自带 fetch，这里直接用；解析用 cheerio（已加到 package.json）

const cheerio = require('cheerio');

/** 简单的抓取器：尽量从 OpenGraph / JSON-LD / 常见选择器提取，兜底用正则扫价格 */
async function crawlProduct(url, wantedFields = []) {
  const html = await fetchHTML(url);
  const data = parseFromHTML(html);

  // 仅返回前端勾选的字段
  const row = {};
  if (wantedFields.includes('name')) row.name = data.name || '';
  if (wantedFields.includes('imageUrl')) row.imageUrl = data.imageUrl || '';
  if (wantedFields.includes('price')) row.price = data.price || '';
  if (wantedFields.includes('moq_value')) row.moq_value = data.moq_value || '';
  if (wantedFields.includes('description')) row.description = data.description || '';

  return row;
}

async function fetchHTML(url) {
  const res = await fetch(url, {
    headers: {
      // 伪装正常浏览器，避免有些站点 403
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
      'accept-language': 'en,de,zh-CN;q=0.9',
    },
  });
  if (!res.ok) {
    throw new Error(`Fetch failed: ${res.status} ${res.statusText} for ${url}`);
  }
  return await res.text();
}

function parseFromHTML(html) {
  const $ = cheerio.load(html);

  // 1) OpenGraph
  let name =
    $('meta[property="og:title"]').attr('content') ||
    $('meta[name="og:title"]').attr('content') ||
    '';
  let imageUrl =
    $('meta[property="og:image"]').attr('content') ||
    $('meta[name="og:image"]').attr('content') ||
    '';

  // 2) JSON-LD（Product）
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const raw = $(el).contents().text();
      const json = JSON.parse(raw);

      const pickProduct = (node) => {
        if (!node) return null;
        if (Array.isArray(node)) return node.find((x) => pickProduct(x));
        if (node['@type'] === 'Product') return node;
        // 有些站会把 Product 放到 graph 里
        if (node['@graph']) return pickProduct(node['@graph']);
        return null;
      };

      const product = pickProduct(json);
      if (product) {
        if (!name && product.name) name = product.name;
        if (!imageUrl && product.image) {
          imageUrl = Array.isArray(product.image) ? product.image[0] : product.image;
        }
        if (!priceFromHtml.price) {
          // offers 可能是对象或数组
          const offers = product.offers;
          const offer = Array.isArray(offers) ? offers[0] : offers;
          if (offer && (offer.price || offer.priceSpecification?.price)) {
            priceFromHtml.price = String(offer.price || offer.priceSpecification.price);
          }
        }
        if (!desc && product.description) desc = String(product.description);
      }
    } catch (_) {}
  });

  // 3) 常见选择器兜底
  let price =
    $('meta[property="product:price:amount"]').attr('content') ||
    $('meta[name="price"]').attr('content') ||
    $('[itemprop="price"]').attr('content') ||
    $('[data-price]').attr('data-price') ||
    '';

  // 4) 价格用正则再兜底（€/$/¥ 等，去空格，逗号转点）
  const textOneLine = $('body').text().replace(/\s+/g, ' ');
  if (!price) {
    const m = textOneLine.match(/(?:€|\$|¥)\s?(\d+(?:[.,]\d{2})?)/);
    if (m) price = m[1].replace(',', '.');
  }

  // 可选：描述
  let desc =
    $('meta[name="description"]').attr('content') ||
    $('meta[property="og:description"]').attr('content') ||
    '';

  const priceFromHtml = { price };

  return {
    name: name || '',
    imageUrl: imageUrl || '',
    price: priceFromHtml.price || '',
    description: desc || '',
    moq_value: '', // 目前拿不到就留空
  };
}

module.exports = { crawlProduct };
