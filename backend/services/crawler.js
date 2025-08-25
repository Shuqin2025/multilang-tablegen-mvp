// backend/services/crawler.js
import axios from "axios";
import * as cheerio from "cheerio";
import { URL as NodeURL } from "url";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";

/** 解析价格：兼容 12,34 € / 12.34 / €12,34 等 */
function parsePrice(str = "") {
  const m = String(str)
    .replace(/\s+/g, " ")
    .match(/(\d{1,3}(?:[.\s]\d{3})*|\d+)([,.]\d{2})?\s*€?/);
  if (!m) return "";
  const intPart = m[1].replace(/[.\s]/g, "");
  const frac = (m[2] || "").replace(",", "."); // 逗号换点
  return frac ? `${intPart}${frac}` : intPart;
}

/** 清理空白 */
const clean = (s = "") => s.replace(/\s+/g, " ").trim();

/** 绝对地址 */
function absUrl(href, base) {
  try {
    return new NodeURL(href, base).toString();
  } catch {
    return href || "";
  }
}

/** 请求 HTML */
async function fetchHTML(url) {
  const res = await axios.get(url, {
    timeout: 20000,
    headers: { "User-Agent": UA, Accept: "text/html,*/*" },
    // 某些站需要 Accept-Language；需要时再打开
    // headers: { ...headers, "Accept-Language": "de-DE,de;q=0.9,en;q=0.8" },
    validateStatus: (s) => s >= 200 && s < 400,
  });
  return res.data;
}

/** 抓“单个商品详情页” */
function extractFromProductPage($, baseUrl) {
  const name =
    clean($("h1").first().text()) ||
    clean($('meta[property="og:title"]').attr("content") || "");

  const price =
    parsePrice(
      $(
        '[itemprop="price"], .price, .product-price, .price--content, [data-price]'
      )
        .first()
        .text()
    ) ||
    parsePrice(
      $(
        "body"
      ).text()
    );

  const imageUrlRaw =
    $('meta[property="og:image"]').attr("content") ||
    $("img[itemprop='image'], .product-image img, .product__image img")
      .first()
      .attr("src") ||
    $("img").first().attr("src");

  const imageUrl = absUrl(imageUrlRaw, baseUrl);

  const description =
    clean($("[itemprop='description'], .product-description").text()) ||
    clean($('meta[name="description"]').attr("content") || "");

  return {
    url: baseUrl,
    name,
    price,
    imageUrl,
    description,
  };
}

/** 抓“列表/分类页”里多个商品卡片 */
function extractFromListPage($, baseUrl) {
  // 尽量匹配常见列表容器/卡片
  const items =
    $(".product, .productbox, .product-item, .product-list .item, li.product")
      .toArray();
  const linksSeen = new Set();
  const rows = [];

  const pickPriceNear = (ctx) => {
    const priceText =
      $(ctx).find(".price, .product-price, [itemprop='price']").first().text() ||
      $(ctx).text();
    return parsePrice(priceText);
  };

  const getTitle = (ctx) =>
    clean(
      $(ctx).find("h2, h3, .title, .product-title, a").first().text() ||
        $(ctx).find("a").first().attr("title") ||
        ""
    );

  const getImg = (ctx) =>
    $(ctx).find("img").first().attr("data-src") ||
    $(ctx).find("img").first().attr("src") ||
    $('meta[property="og:image"]').attr("content") ||
    "";

  // 先尝试结构化卡片
  for (const el of items) {
    const a = $(el).find("a[href$='.html'], a[href*='.html']").first();
    const href = a.attr("href");
    if (!href) continue;
    const abs = absUrl(href, baseUrl);
    if (linksSeen.has(abs)) continue;
    linksSeen.add(abs);

    rows.push({
      url: abs,
      name: getTitle(el),
      price: pickPriceNear(el),
      imageUrl: absUrl(getImg(el), baseUrl),
      description: "",
    });
  }

  // 如果上面没抓到，再兜底：页面所有指向 .html 的链接（去重）
  if (rows.length === 0) {
    $("a[href$='.html']").each((_, a) => {
      const href = $(a).attr("href");
      const abs = absUrl(href, baseUrl);
      if (linksSeen.has(abs)) return;
      linksSeen.add(abs);
      rows.push({
        url: abs,
        name: clean($(a).text() || $(a).attr("title") || ""),
        price: "", // 列表兜底不强求价格
        imageUrl: "",
        description: "",
      });
    });
  }

  return rows;
}

/** 兼容 auto-schmuck 的抓取：列表页→多条；详情页→单条 */
export async function crawl(url) {
  const html = await fetchHTML(url);
  const $ = cheerio.load(html);

  // 简单判断：出现多个商品卡片就是列表页，否则按详情页处理
  const looksLikeList =
    $(".product, .productbox, .product-item, .product-list .item, li.product")
      .length >= 2;

  if (looksLikeList) {
    const rows = extractFromListPage($, url);
    if (rows.length) return rows;
    // 兜底：即使判断为列表，若结构不符合，回退抓单条（取 meta 信息）
    return [extractFromProductPage($, url)];
  }
  // 详情页
  return [extractFromProductPage($, url)];
}

/** 单 URL → 多条（列表）/一条（详情）并包上错误 */
export async function crawlSafe(url) {
  try {
    return await crawl(url);
  } catch (err) {
    return [{ url, error: (err && err.message) || String(err) }];
  }
}

