// frontend/MultiLangTableMVP.jsx
import React, { useMemo, useState } from "react";

/**
 * MultiLangTableMVP.jsx
 * - 后端返回 Excel/PDF 的二进制；前端用 blob 下载
 * - 需要环境变量：VITE_API_BASE = https://multilang-backend-bl2m.onrender.com
 */

export default function MultiLangTableMVP() {
  // ======= state =======
  const [rawUrls, setRawUrls] = useState("https://example.com/product/123");
  const [fields, setFields] = useState({
    name: true,
    imageUrl: false,
    price: true,
    moq_value: false,
    description: false,
  });
  const [lang, setLang] = useState("zh");            // zh / en / de
  const [exportFormat, setExportFormat] = useState("EXCEL"); // EXCEL | PDF
  const [loading, setLoading] = useState(false);

  const selectedFields = useMemo(
    () => Object.entries(fields).filter(([, v]) => v).map(([k]) => k),
    [fields]
  );

  // ======= helpers =======
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

  // ======= submit =======
  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setLoading(true);

      const urls = rawUrls
        .split(/\r?\n/)
        .map(s => s.trim())
        .filter(Boolean);

      if (!urls.length) {
        alert("请先在文本框粘贴至少 1 条产品 URL（每行一个）");
        return;
      }
      if (!selectedFields.length) {
        alert("请至少勾选 1 个要抓取的字段");
        return;
      }

      const payload = {
        urls,
        fields: selectedFields,
        languages: [lang],                       // ["zh"] / ["en"] / ["de"]
        format: exportFormat.toLowerCase(),      // "excel" | "pdf" |（后端也支持 "json"）
      };

      const base = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");
      if (!base) {
        throw new Error(
          "缺少环境变量 VITE_API_BASE。请在 Render → Environment 中设置，例如：https://multilang-backend-bl2m.onrender.com"
        );
      }

      // 千万不要加 no-cors；也不要先 res.json() / res.text()！
      const res = await fetch(`${base}/api/tablegen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // 读取文本错误，帮助定位
        const txt = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}: ${txt || res.statusText}`);
      }

      // ✅ 正确：拿二进制
      const blob = await res.blob();

      // 从响应头尝试拿文件名
      const cd = res.headers.get("content-disposition") || "";
      let filename =
        (cd.match(/filename\*?=(?:UTF-8''|")?([^;"']+)/i)?.[1] || "").trim();

      if (!filename) {
        const ext = exportFormat === "PDF" ? "pdf" : "xlsx";
        filename = `table_${Date.now()}.${ext}`;
      } else {
        try {
          // 处理 filename*=UTF-8''xxx 的编码场景
          filename = decodeURIComponent(filename);
        } catch {
          // 忽略
        }
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

  // ======= UI helpers =======
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

  // ======= render =======
  return (
    <div style={{ padding: 20, maxWidth: 820, margin: "0 auto", lineHeight: 1.6 }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>
        多语言表格制作 MVP
      </h2>

      <form onSubmit={handleSubmit}>
        {/* URLs */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 8 }}>
            产品页面 URL 列表（每行一个）
          </label>
          <textarea
            value={rawUrls}
            onChange={(e) => setRawUrls(e.target.value)}
            rows={6}
            style={{ width: "100%", fontFamily: "monospace" }}
            placeholder={"https://example.com/prod1\nhttps://example.com/prod2"}
          />
        </div>

        {/* Fields */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ marginBottom: 6 }}>选择需抓取字段：</div>
          {[
            ["name", "name"],
            ["imageUrl", "imageUrl"],
            ["price", "price"],
            ["moq_value", "moq_value"],
            ["description", "description"],
          ].map(([k, label]) => (
            <label key={k} style={{ marginRight: 16 }}>
              <input
                type="checkbox"
                checked={!!fields[k]}
                onChange={() => toggleField(k)}
              />{" "}
              {label}
            </label>
          ))}
        </div>

        {/* Languages */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ marginBottom: 6 }}>选择语言：</div>
          {[
            ["zh", "中文"],
            ["en", "English"],
            ["de", "Deutsch"],
          ].map(([value, label]) => (
            <label key={value} style={{ marginRight: 16 }}>
              <input
                type="radio"
                name="lang"
                value={value}
                checked={lang === value}
                onChange={() => setLang(value)}
              />{" "}
              {label}
            </label>
          ))}
        </div>

        {/* Format */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ marginBottom: 6 }}>导出格式：</div>
          {["EXCEL", "PDF"].map((fmt) => (
            <label key={fmt} style={{ marginRight: 16 }}>
              <input
                type="radio"
                name="fmt"
                value={fmt}
                checked={exportFormat === fmt}
                onChange={() => setExportFormat(fmt)}
              />{" "}
              {fmt}
            </label>
          ))}
        </div>

        {/* Actions */}
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

      {/* Tips */}
      <div style={{ marginTop: 16, color: "#6b7280", fontSize: 13 }}>
        <div>
          环境变量 <code>VITE_API_BASE</code>：{" "}
          <code>https://multilang-backend-bl2m.onrender.com</code>
        </div>
        <div>
          说明：Excel 已能直接下载；PDF 目前后端若返回
          <code>501 pdf-not-implemented</code>，说明还未接入 pdfmake，等接入后即可下载。
        </div>
      </div>
    </div>
  );
}
