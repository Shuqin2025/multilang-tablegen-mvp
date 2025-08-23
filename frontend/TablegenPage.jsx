// frontend/TablegenPage.jsx
import React, { useState } from "react";
import { postJSON } from "./apiBase";

export default function TablegenPage() {
  const [urlsText, setUrlsText] = useState("https://example.com/product/123");
  const [fields, setFields] = useState(["name", "price"]);
  const [languages, setLanguages] = useState(["zh"]);
  const [format, setFormat] = useState("excel");
  const [loading, setLoading] = useState(false);

  const allFields = ["name", "imageUrl", "price", "moq_value", "description"];
  const allLangs = [
    { code: "zh", label: "中文" },
    { code: "en", label: "English" },
    { code: "de", label: "Deutsch" },
  ];

  function toggleField(f) {
    setFields((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  }

  function toggleLang(code) {
    setLanguages((prev) =>
      prev.includes(code) ? prev.filter((x) => x !== code) : [...prev, code]
    );
  }

  async function handleGenerate() {
    setLoading(true);
    try {
      const urls = urlsText
        .split("\n")
        .map((u) => u.trim())
        .filter(Boolean);

      const res = await postJSON("/api/tablegen", {
        urls,
        fields,
        languages,
        format,
      });

      if (!res.ok) {
        const t = await res.text();
        alert(`后端返回错误：${res.status} ${t}`);
        return;
      }

      if (format === "excel") {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `tablegen_${Date.now()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } else {
        const data = await res.json();
        alert("返回 JSON: " + JSON.stringify(data, null, 2));
      }
    } catch (err) {
      console.error(err);
      alert(`生成表格失败：${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>多语言表格制作 MVP</h2>

      <div>
        <label>产品页面 URL 列表（每行一个）</label>
        <br />
        <textarea
          rows={5}
          style={{ width: "500px" }}
          value={urlsText}
          onChange={(e) => setUrlsText(e.target.value)}
        />
      </div>

      <div style={{ marginTop: "10px" }}>
        <label>选择需抓取字段：</label>
        <br />
        {allFields.map((f) => (
          <label key={f} style={{ marginRight: "10px" }}>
            <input
              type="checkbox"
              checked={fields.includes(f)}
              onChange={() => toggleField(f)}
            />
            {f}
          </label>
        ))}
      </div>

      <div style={{ marginTop: "10px" }}>
        <label>选择语言：</label>
        <br />
        {allLangs.map((l) => (
          <label key={l.code} style={{ marginRight: "10px" }}>
            <input
              type="radio"
              checked={languages.includes(l.code)}
              onChange={() => setLanguages([l.code])}
            />
            {l.label}
          </label>
        ))}
      </div>

      <div style={{ marginTop: "10px" }}>
        <label>导出格式：</label>
        <br />
        <label>
          <input
            type="radio"
            checked={format === "excel"}
            onChange={() => setFormat("excel")}
          />
          EXCEL
        </label>
        <label style={{ marginLeft: "10px" }}>
          <input
            type="radio"
            checked={format === "pdf"}
            onChange={() => setFormat("pdf")}
          />
          PDF
        </label>
      </div>

      <div style={{ marginTop: "20px" }}>
        <button onClick={handleGenerate} disabled={loading}>
          {loading ? "生成中..." : "生成表格"}
        </button>
      </div>
    </div>
  );
}
