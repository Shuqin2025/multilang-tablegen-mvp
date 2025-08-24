// frontend/TablegenPage.jsx
import React, { useMemo, useState } from "react";
import { API } from "./apiBase"; // ✅ 与你的 apiBase.js 对应（命名导出）

/**
 * - 调后端 POST ${API.tablegen}
 * - Excel/PDF 响应用 blob 下载，JSON 响应才 res.json()
 */
export default function TablegenPage() {
  const [urlText, setUrlText] = useState("https://example.com/product/123");
  const [fields, setFields] = useState({
    name: true,
    imageUrl: false,
    price: true,
    moq_value: false,
    description: false,
  });
  const [lang, setLang] = useState("zh");
  const [format, setFormat] = useState("excel"); // "excel" | "pdf"
  const [loading, setLoading] = useState(false);

  const urls = useMemo(
    () =>
      urlText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    [urlText]
  );

  const selectedFields = useMemo(
    () => Object.keys(fields).filter((k) => fields[k]),
    [fields]
  );

  function toggleField(key) {
    setFields((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function getFilenameFromDisposition(disp, fallback) {
    if (!disp) return fallback;
    const star = /filename\*\s*=\s*[^']*''([^;]+)/i.exec(disp);
    if (star) return decodeURIComponent(star[1]).replace(/["']/g, "");
    const simple = /filename\s*=\s*("?)([^";]+)\1/i.exec(disp);
    if (simple) return simple[2].replace(/["']/g, "");
    return fallback;
  }

  async function handleGenerate() {
    if (!urls.length) return alert("请先填写至少一个商品URL（每行一个）");
    if (!selectedFields.length) return alert("请至少勾选一个字段");

    setLoading(true);
    try {
      const payload = {
        urls,
        fields: selectedFields,
        languages: [lang],
        format, // "excel" 或 "pdf"
      };

      const res = await fetch(API.tablegen, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}: ${txt || "请求失败"}`);
      }

      const ct = (res.headers.get("content-type") || "").toLowerCase();
      const isExcel = ct.includes(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      const isPdf = ct.includes("application/pdf");

      if (isExcel || isPdf) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const disp = res.headers.get("content-disposition") || "";
        const fallback = isPdf ? "result.pdf" : "result.xlsx";
        const filename = getFilenameFromDisposition(disp, fallback);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        return;
      }

      // 非文件：JSON 占位
      const data = await res.json().catch(() => null);
      if (data) {
        console.log("后端JSON响应:", data);
        alert("后端返回 JSON（非文件下载）。请在控制台查看详情。");
      } else {
        alert("已完成，但响应既不是文件也不是 JSON。");
      }
    } catch (err) {
      console.error(err);
      alert(`生成表格失败：${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 980, padding: 24, lineHeight: 1.6 }}>
      <h2>多语言表格制作 MVP</h2>

      <div style={{ marginBottom: 12 }}>
        <div>产品页面 URL 列表（每行一个）</div>
        <textarea
          value={urlText}
          onChange={(e) => setUrlText(e.target.value)}
          rows={6}
          style={{ width: "100%", fontFamily: "monospace" }}
          placeholder={"https://example.com/prod1\nhttps://example.com/prod2"}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <div>选择需抓取字段：</div>
        {[
          ["name", "name"],
          ["imageUrl", "imageUrl"],
          ["price", "price"],
          ["moq_value", "moq_value"],
          ["description", "description"],
        ].map(([key, label]) => (
          <label key={key} style={{ marginRight: 16 }}>
            <input
              type="checkbox"
              checked={!!fields[key]}
              onChange={() => toggleField(key)}
            />{" "}
            {label}
          </label>
        ))}
      </div>

      <div style={{ marginBottom: 12 }}>
        <div>选择语言：</div>
        {[
          ["zh", "中文"],
          ["en", "English"],
          ["de", "Deutsch"],
        ].map(([v, label]) => (
          <label key={v} style={{ marginRight: 16 }}>
            <input
              type="radio"
              name="lang"
              checked={lang === v}
              onChange={() => setLang(v)}
            />{" "}
            {label}
          </label>
        ))}
      </div>

      <div style={{ marginBottom: 16 }}>
        <div>导出格式：</div>
        {[
          ["excel", "EXCEL"],
          ["pdf", "PDF"],
        ].map(([v, label]) => (
          <label key={v} style={{ marginRight: 16 }}>
            <input
              type="radio"
              name="format"
              checked={format === v}
              onChange={() => setFormat(v)}
            />{" "}
            {label}
          </label>
        ))}
      </div>

      <button onClick={handleGenerate} disabled={loading}>
        {loading ? "生成中..." : "生成表格"}
      </button>
    </div>
  );
}
