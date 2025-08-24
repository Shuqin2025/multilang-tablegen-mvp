import React, { useMemo, useState } from "react";

/**
 * MultiLangTableMVP.jsx
 * - 以 blob 方式下载 Excel / PDF（由后端返回二进制）
 * - 需要前端环境变量：VITE_API_BASE = https://multilang-backend-bl2m.onrender.com
 */

export default function MultiLangTableMVP() {
  // ------ 状态 ------
  const [rawUrls, setRawUrls] = useState("https://example.com/product/123");
  const [fields, setFields] = useState({
    name: true,
    imageUrl: false,
    price: true,
    moq_value: false,
    description: false,
  });
  const [lang, setLang] = useState("zh"); // zh / en / de
  const [exportFormat, setExportFormat] = useState("EXCEL"); // 或 "PDF"
  const [loading, setLoading] = useState(false);

  const selectedFields = useMemo(
    () => Object.entries(fields).filter(([, v]) => v).map(([k]) => k),
    [fields]
  );

  // ------ 工具：下载 blob ------
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

  // ------ 提交：向后端请求文件并下载 ------
  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setLoading(true);

      const urls = rawUrls
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);

      if (!urls.length) {
        alert("请先在文本框中粘贴至少 1 条产品 URL（每行一个）");
        return;
      }
      if (!selectedFields.length) {
        alert("请至少勾选 1 个要抓取的字段");
        return;
      }

      const payload = {
        urls,
        fields: selectedFields,
        languages: [lang],                      // ["zh"] / ["en"] / ["de"]
        format: exportFormat.toLowerCase(),     // "excel" | "pdf"
      };

      // 注意：不要加 mode: "no-cors"
      const base = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");
      if (!base) {
        throw new Error(
          "缺少环境变量 VITE_API_BASE。请在 Render → Environment 中设置，如：https://multilang-backend-bl2m.onrender.com"
        );
      }

      const res = await fetch(`${base}/api/tablegen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // 后端出错时尝试读文本，便于提示
        const txt = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}: ${txt || res.statusText}`);
      }

      // ✅ 核心：拿二进制
      const blob = await res.blob();

      // 从响应头推断文件名（后端有设置的话）
      const cd = res.headers.get("content-disposition") || "";
      let filename =
        (cd.match(/filename\*?=(?:UTF-8''|")?([^;"']+)/i)?.[1] || "").trim();

      if (!filename) {
        filename = `table_${Date.now()}.${
          exportFormat === "PDF" ? "pdf" : "xlsx"
        }`;
      } else {
        try {
          filename = decodeURIComponent(filename);
        } catch {}
      }

      downloadBlob(blob, filename);
      alert("✅ 文件已开始下载");
    } catch (err) {
      console.error(err);
      alert(`生成表格失败：${String(err.message || err)}`);
    } finally {
      setLoading(false);
    }
  }

  // ------ UI 辅助 ------
  function toggleField(key) {
    setFields((old) => ({ ...old, [key]: !old[key] }));
  }

  function clearAll() {
    setRawUrls("");
    setFields({
      name: false,
      imageUrl: false,
      price: false,
      moq_value: false,
      description: false,
    });
  }

  // ------ 渲染 ------
  return (
    <div style={{ padding: 20, maxWidth: 820, margin: "0 auto", lineHeight: 1.6 }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>
        多语言表格制作 MVP
      </h2>

      <form onSubmit={handleSubmit}>
        {/* URL 列表 */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 8 }}>
            产品页面 URL 列表（每行一个）
          </label>
          <textarea
            value={rawUrls}
            onChange={(e) => setRawUrls(e.target.value)}
            rows={6}
            style={{ width: "100%", fontFamily: "monospace" }}
            placeholder="https://example.com/prod1&#10;https://example.com/prod2"
          />
        </div>

        {/* 选择字段 */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ marginBottom: 6 }}>选择需抓取字段：</div>
          <label style={{ marginRight: 16 }}>
            <input
              type="checkbox"
              checked={fields.name}
              onChange={() => toggleField("name")}
            />{" "}
            name
          </label>
          <label style={{ marginRight: 16 }}>
            <input
              type="checkbox"
              checked={fields.imageUrl}
              onChange={() => toggleField("imageUrl")}
            />{" "}
            imageUrl
          </label>
          <label style={{ marginRight: 16 }}>
            <input
              type="checkbox"
              checked={fields.price}
              onChange={() => toggleField("price")}
            />{" "}
            price
          </label>
          <label style={{ marginRight: 16 }}>
            <input
              type="checkbox"
              checked={fields.moq_value}
              onChange={() => toggleField("moq_value")}
            />{" "}
            moq_value
          </label>
          <label style={{ marginRight: 16 }}>
            <input
              type="checkbox"
              checked={fields.description}
              onChange={() => toggleField("description")}
            />{" "}
            description
          </label>
        </div>

        {/* 语言 */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ marginBottom: 6 }}>选择语言：</div>
          <label style={{ marginRight: 16 }}>
            <input
              type="radio"
              name="lang"
              value="zh"
              checked={lang === "zh"}
              onChange={() => setLang("zh")}
            />{" "}
            中文
          </label>
          <label style={{ marginRight: 16 }}>
            <input
              type="radio"
              name="lang"
              value="en"
              checked={lang === "en"}
              onChange={() => setLang("en")}
            />{" "}
            English
          </label>
          <label style={{ marginRight: 16 }}>
            <input
              type="radio"
              name="lang"
              value="de"
              checked={lang === "de"}
              onChange={() => setLang("de")}
            />{" "}
            Deutsch
          </label>
        </div>

        {/* 导出格式 */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ marginBottom: 6 }}>导出格式：</div>
          <label style={{ marginRight: 16 }}>
            <input
              type="radio"
              name="fmt"
              value="EXCEL"
              checked={exportFormat === "EXCEL"}
              onChange={() => setExportFormat("EXCEL")}
            />{" "}
            EXCEL
          </label>
          <label style={{ marginRight: 16 }}>
            <input
              type="radio"
              name="fmt"
              value="PDF"
              checked={exportFormat === "PDF"}
              onChange={() => setExportFormat("PDF")}
            />{" "}
            PDF
          </label>
        </div>

        {/* 按钮区 */}
        <div style={{ display: "flex", gap: 12 }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "8px 14px",
              background: "#4f46e5",
              color: "#fff",
              border: 0,
              borderRadius: 6,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "生成中，请稍候…" : "生成表格"}
          </button>

          <button
            type="button"
            onClick={clearAll}
            disabled={loading}
            style={{
              padding: "8px 14px",
              background: "#f3f4f6",
              color: "#111827",
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            清空
          </button>
        </div>
      </form>

      {/* 友情提示 */}
      <div style={{ marginTop: 16, color: "#6b7280", fontSize: 13 }}>
        <div>
          环境变量 <code>VITE_API_BASE</code> 指向：{" "}
          <code>https://multilang-backend-bl2m.onrender.com</code>
        </div>
        <div>Excel 已经按二进制下载；PDF 目前会返回 501（待接入 pdfmake 后再启用）。</div>
      </div>
    </div>
  );
}
