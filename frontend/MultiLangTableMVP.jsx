import React, { useState } from "react";

/**
 * 读取后端基础地址（Render 面板里设置的 VITE_API_BASE）
 * 一定要是类似：https://multilang-backend-xxxx.onrender.com
 */
const API_BASE =
  (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");

/** 统一的后端接口 */
const ENDPOINTS = {
  tablegen: `${API_BASE}/api/tablegen`,
};

/** 小工具：把 Blob 触发浏览器下载 */
function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export default function MultiLangTableMVP() {
  // 文本框里的 URL 列表（每行一个）
  const [urlsText, setUrlsText] = useState(
    "https://example.com/product/123"
  );

  // 抓取字段
  const [fields, setFields] = useState({
    name: true,
    imageUrl: false,
    price: true,
    moq_value: false,
    description: false,
  });

  // 语言（zh/en/de）
  const [lang, setLang] = useState("zh");

  // 导出格式（excel/pdf）
  const [format, setFormat] = useState("excel");

  // Loading
  const [loading, setLoading] = useState(false);

  /** 勾选字段切换 */
  const toggleField = (key) =>
    setFields((s) => ({ ...s, [key]: !s[key] }));

  /** 一键清空 */
  const handleClear = () => {
    setUrlsText("");
  };

  /** 一键复制（把结果或提示复制） */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(urlsText || "");
      alert("已复制输入框内容");
    } catch {
      alert("复制失败，请手动选择并复制。");
    }
  };

  /**
   * 核心：提交并下载文件（Excel 或 PDF）
   * 🚫 只解析成 Blob，不要在同一响应上 .json()
   */
  const handleGenerate = async () => {
    const urls = urlsText.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    const pickedFields = Object.entries(fields)
      .filter(([, v]) => v)
      .map(([k]) => k);

    if (!urls.length) {
      alert("请至少输入 1 个商品 URL");
      return;
    }
    if (!pickedFields.length) {
      alert("请至少选择 1 个字段");
      return;
    }
    if (!["zh", "en", "de"].includes(lang)) {
      alert("请选择语言");
      return;
    }
    if (!["excel", "pdf"].includes(format)) {
      alert("请选择导出格式");
      return;
    }
    if (!API_BASE) {
      alert("前端未配置 VITE_API_BASE（Render → Environment）。");
      return;
    }

    const payload = {
      urls,
      fields: pickedFields,
      languages: [lang],   // ["zh"] / ["en"] / ["de"]
      export: format,      // "excel" | "pdf"
    };

    setLoading(true);
    try {
      const res = await fetch(ENDPOINTS.tablegen, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}: ${txt || res.statusText}`);
      }

      // ✅ 只做一次解析：拿 Blob 就下载
      const blob = await res.blob();

      // 从响应头拿文件名（后端应已设置 Content-Disposition）
      const cd = res.headers.get("content-disposition") || "";
      let filename = (cd.match(/filename\*?=(?:UTF-8''|")?([^;"']+)/i)?.[1] || "").trim();
      if (!filename) {
        filename = `table_${Date.now()}.${format === "pdf" ? "pdf" : "xlsx"}`;
      } else {
        try { filename = decodeURIComponent(filename); } catch {}
      }

      downloadBlob(blob, filename);
      alert("✅ 文件已开始下载");
    } catch (err) {
      console.error(err);
      alert(`生成表格失败：${String(err.message || err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 16, maxWidth: 760, margin: "0 auto", lineHeight: 1.6 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
        多语言表格制作 MVP
      </h2>

      <div style={{ marginBottom: 12 }}>
        <div style={{ marginBottom: 6 }}>产品页面 URL 列表（每行一个）</div>
        <textarea
          rows={6}
          style={{ width: "100%", fontFamily: "monospace", padding: 8 }}
          placeholder="https://example.com/product/123"
          value={urlsText}
          onChange={(e) => setUrlsText(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ marginBottom: 6 }}>选择需抓取字段：</div>

        <label style={{ marginRight: 12 }}>
          <input
            type="checkbox"
            checked={fields.name}
            onChange={() => toggleField("name")}
          />{" "}
          name
        </label>

        <label style={{ marginRight: 12 }}>
          <input
            type="checkbox"
            checked={fields.imageUrl}
            onChange={() => toggleField("imageUrl")}
          />{" "}
          imageUrl
        </label>

        <label style={{ marginRight: 12 }}>
          <input
            type="checkbox"
            checked={fields.price}
            onChange={() => toggleField("price")}
          />{" "}
          price
        </label>

        <label style={{ marginRight: 12 }}>
          <input
            type="checkbox"
            checked={fields.moq_value}
            onChange={() => toggleField("moq_value")}
          />{" "}
          moq_value
        </label>

        <label style={{ marginRight: 12 }}>
          <input
            type="checkbox"
            checked={fields.description}
            onChange={() => toggleField("description")}
          />{" "}
          description
        </label>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ marginBottom: 6 }}>选择语言：</div>
        <label style={{ marginRight: 12 }}>
          <input
            type="radio"
            name="lang"
            checked={lang === "zh"}
            onChange={() => setLang("zh")}
          />{" "}
          中文
        </label>
        <label style={{ marginRight: 12 }}>
          <input
            type="radio"
            name="lang"
            checked={lang === "en"}
            onChange={() => setLang("en")}
          />{" "}
          English
        </label>
        <label style={{ marginRight: 12 }}>
          <input
            type="radio"
            name="lang"
            checked={lang === "de"}
            onChange={() => setLang("de")}
          />{" "}
          Deutsch
        </label>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ marginBottom: 6 }}>导出格式：</div>
        <label style={{ marginRight: 12 }}>
          <input
            type="radio"
            name="format"
            checked={format === "excel"}
            onChange={() => setFormat("excel")}
          />{" "}
          EXCEL
        </label>
        <label style={{ marginRight: 12 }}>
          <input
            type="radio"
            name="format"
            checked={format === "pdf"}
            onChange={() => setFormat("pdf")}
          />{" "}
          PDF
        </label>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{
            padding: "6px 12px",
            background: "#2563eb",
            color: "#fff",
            border: 0,
            borderRadius: 4,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "生成中，请稍候…" : "生成表格"}
        </button>

        <button
          onClick={handleCopy}
          style={{ padding: "6px 12px", borderRadius: 4 }}
        >
          复制输入
        </button>

        <button
          onClick={handleClear}
          style={{ padding: "6px 12px", borderRadius: 4 }}
        >
          清空
        </button>
      </div>
    </div>
  );
}
