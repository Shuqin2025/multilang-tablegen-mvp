process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err);
});

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});
// backend/services/crawler.js
import axios from 'axios';
import * as cheerio from 'cheerio';
import { URL } from 'url';

/** 统一字段 */
function normalizeRecord(rec = {}) {
  return {
    url: rec.url || '',
    name: rec.name || '',
    price: rec.price ?? '',
    imageUrl: rec.imageUrl || '',
    moq_value: rec.moq_value ?? '',
    description: rec.description || '',
  };
}

/** 抽取价格数字 */
function extractPrice(text = '') {
  if (!text) return '';
  const m = String(text).replace(/,/g, '').match(/(\d+(?:\.\d+)?)/);
  return m ? m[1] : '';
}

/** 绝对化图片链接 */
function absolutize(base, maybeRelative) {
  try {
    if (!maybeRelative) return '';
    return new URL(maybeRelative, base).href;
  } catch {
    return maybeRelative || '';
  }
}

function tryParseJSON(text) {
  try { return JSON.parse(text); } catch { return null; }
}

/** 抓单个商品页 */
export async function fetchProduct(url) {
  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  };

  const res = await axios.get(url, {
    headers,
    timeout: 15000,
    maxRedirects: 5,
    responseType: 'text',
    validateStatus: s => s >= 200 && s < 400, // 3xx 也接受
  });

  // JSON 接口
  const contentType = String(res.headers['content-type'] || '').toLowerCase();
  if (contentType.includes('application/json')) {
    const data = typeof res.data === 'string' ? tryParseJSON(res.data) : res.data;
    if (data && typeof data === 'object') {
      const cand = normalizeRecord({
        url,
        name: data.name || data.title,
        price: extractPrice(data.price ?? data.current_price ?? ''),
        imageUrl: data.image || data.imageUrl || (Array.isArray(data.images) ? data.images[0] : ''),
        description: data.description || '',
        moq_value: data.moq ?? data.moq_value ?? '',
      });
      cand.imageUrl = absolutize(url, cand.imageUrl);
      return cand;
    }
  }

  // HTML 解析
  const $ = cheerio.load(res.data);
  const og = (prop) => $(`meta[property="og:${prop}"]`).attr('content');
  const meta = (name) => $(`meta[name="${name}"]`).attr('content');
  const itemprop = (p) => $(`meta[itemprop="${p}"]`).attr('content');

  let name =
    og('title') ||
    $('h1').first().text().trim() ||
    $('title').first().text().trim() ||
    $('[itemprop="name"]').first().text().trim() ||
    $('[class*="product"] h1').first().text().trim();

  let price =
    itemprop('price') ||
    og('price:amount') ||
    $('[itemprop="price"]').attr('content') ||
    $('[class*="price"]').first().text().trim();

  let imageUrl =
    og('image') ||
    itemprop('image') ||
    $('img[alt*="product"], img[class*="product"], img').first().attr('src');

  let description =
    og('description') ||
    meta('description') ||
    $('[itemprop="description"]').text().trim() ||
    $('p').first().text().trim();

  // 兜底价格
  if (!price) {
    const bodyText = $('body').text().replace(/\s+/g, ' ');
    price = extractPrice(bodyText);
  } else {
    price = extractPrice(price);
  }

  imageUrl = absolutize(url, imageUrl);

  return normalizeRecord({ url, name, price, imageUrl, description, moq_value: '' });
}

/** 批量抓取（失败不断整） */
export async function fetchProducts(urls = []) {
  const jobs = urls.map(async (u) => {
    try {
      return await fetchProduct(u);
    } catch (e) {
      return normalizeRecord({
        url: u,
        name: '[抓取失败]',
        description: String(e?.message || e),
      });
    }
  });
  return Promise.all(jobs);
}

