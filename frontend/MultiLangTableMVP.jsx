import React, { useMemo, useState, useEffect } from "react";

/**
 * 后端地址优先级：
 * 1) window.__env.API_BASE  (可在 index.html 里注入)
 * 2) import.meta.env.VITE_API_BASE (Vite 环境变量)
 * 3) 兜底 Render 后端地址（请按需替换为你的）
 */
const BACKEND_BASE =
  (typeof window !== "undefined" && window.__env && window.__env.API_BASE) ||
  import.meta.env?.VITE_API_BASE ||
  "https://multilang-backend-bl2m.onrender.com";

/** 小工具：把 textarea 文本拆成 URL 列表 */
function parseUrls(text) {
  return (text || "")
    .split(/\r?\n|,|\s+/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** 工具：下载 Blob 文件 */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export default function MultiLangTableMVP() {
  // -- 健康检查
  const [health, setHealth] = useState({ ok: false, text: "Checking..." });

  // -- 表单与状态
  const [urlText, setUrlText] = useState("https://example.com/product/123");
  const [fields, setFields] = useState({
    name: true,
    imageUrl: false,
    price: true,
    moq_value: false,
    description: false,
  });
  const [lang, setLang] = useState("zh"); // zh | en | de
  const [format, setFormat] = useState("excel"); // excel | pdf

  const [loading, setLoading] = useState(false);
  const [jsonData, setJsonData] = useState(null); // 预览 JSON（若后端支持）
  const [message, setMessage] = useState("");

  const urls = useMemo(() => parseUrls(urlText), [urlText]);
  const selectedFields = useMemo(
    () => Object.keys(fields).filter((k) => fields[k]),
    [fields]
  );

  // 健康检查
  useEffect(() => {
    let stop = false;
    (async () => {
      try {
        const r = await fetch(`${BACKEND_BASE}/health`);
        const data = await r.json().catch(() => ({}));
        if (!stop) {
          setHealth({
            ok: Boolean(r.ok),
            text: r.ok
              ? `Backend OK（uptime: ${data.uptime ?? "-"}s）`
              : "Backend unhealthy",
          });
        }
      } catch (e) {
        if (!stop) setHealth({ ok: false, text: "Health check failed" });
      }
    })();
    return () => {
      stop = true;
    };
  }, []);

  // 勾选切换
  const toggleField = (key) =>
    setFields((s) => ({
      ...s,
      [key]: !s[key],
    }));

  // 一键清空
  const handleClear = () => {
    setUrlText("");
    setFields({
      name: true,
      imageUrl: false,
      price: true,
      moq_value: false,
      description: false,
    });
    setLang("zh");
    setFormat("excel");
    setJsonData(null);
    setMessage("");
  };

  // 主提交：下载 Excel / PDF，同时尝试请求 JSON 以供“复制/下载 JSON”
  const handleSubmit = async () => {
    if (!urls.length) {
      setMessage("请先粘贴至少一个商品 URL");
      return;
    }
    if (!selectedFields.length) {
      setMessage("请至少勾选一个字段");
      return;
    }

    setLoading(true);
    setMessage("");
    setJsonData(null);

    try {
      const payload = {
        urls,
        fields: selectedFields,
        languages: [lang],
        format, // excel | pdf
      };

      // 1) 先下载文件
      const r = await fetch(`${BACKEND_BASE}/api/tablegen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!r.ok) {
        const text = await r.text();
        throw new Error(`生成文件失败：${r.status} ${text}`);
      }

      const blob = await r.blob();
      downloadBlob(
        blob,
        `tablegen_${Date.now()}.${format === "pdf" ? "pdf" : "xlsx"}`
      );

      // 2) 再尝试拿一份 JSON 预览（方便“复制/下载 JSON”）
      //    如果后端暂未实现 format: 'json'，这里会失败，但不影响文件下载
      try {
        const r2 = await fetch(`${BACKEND_BASE}/api/tablegen`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, format: "json" }),
        });
        if (r2.ok) {
          const data = await r2.json();
          // data 可能是 { ok:true, rows:[...] } 或直接数组，兼容两种
          const rows = Array.isArray(data) ? data : data?.rows;
          if (rows && Array.isArray(rows)) {
            setJsonData(rows);
            setMessage("文件已下载；JSON 预览已就绪。");
          } else {
            setMessage("文件已下载；后端未提供 JSON 预览。");
          }
        } else {
          setMessage("文件已下载；后端暂未提供 JSON 预览。");
        }
      } catch {
        setMessage("文件已下载；后端暂未提供 JSON 预览。");
      }
    } catch (err) {
      console.error(err);
      setMessage(String(err.message || err));
    } finally {
      setLoading(false);
    }
  };

  // 复制 JSON（若已拿到）
  const handleCopyJson = async () => {
    if (!jsonData) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2));
      setMessage("JSON 已复制到剪贴板 ✅");
    } catch (e) {
      setMessage("复制失败，请手动选择文本复制");
    }
  };

  // 下载 JSON（若已拿到）
  const handleDownloadJson = () => {
    if (!jsonData) return;
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    downloadBlob(blob, `tablegen_${Date.now()}.json`);
  };

  return (
    <div style={styles.wrap}>
      <h2 style={{ marginTop: 0 }}>多语言表格制作 MVP</h2>

      {/* 健康检查 */}
      <div
        style={{
          marginBottom: 12,
          color: health.ok ? "#16a34a" : "#e11d48",
          fontSize: 13,
        }}
      >
        <span style={{ marginRight: 6 }}>•</span>
        {health.text}
      </div>

      {/* URL 列表 */}
      <div style={styles.section}>
        <div style={styles.label}>产品页面 URL 列表（每行一个）</div>
        <textarea
          value={urlText}
          onChange={(e) => setUrlText(e.target.value)}
          placeholder="https://example.com/product/123"
          style={styles.textarea}
          rows={6}
        />
      </div>

      {/* 字段选择 */}
      <div style={styles.section}>
        <div style={styles.label}>选择需抓取字段：</div>
        {[
          ["name", "name"],
          ["imageUrl", "imageUrl"],
          ["price", "price"],
          ["moq_value", "moq_value"],
          ["description", "description"],
        ].map(([key, text]) => (
          <label key={key} style={styles.checkItem}>
            <input
              type="checkbox"
              checked={fields[key]}
              onChange={() => toggleField(key)}
            />
            <span style={{ marginLeft: 6 }}>{text}</span>
          </label>
        ))}
      </div>

      {/* 语言 */}
      <div style={styles.section}>
        <div style={styles.label}>选择语言：</div>
        {[
          ["zh", "中文"],
          ["en", "English"],
          ["de", "Deutsch"],
        ].map(([v, text]) => (
          <label key={v} style={styles.checkItem}>
            <input
              type="radio"
              name="lang"
              value={v}
              checked={lang === v}
              onChange={() => setLang(v)}
            />
            <span style={{ marginLeft: 6 }}>{text}</span>
          </label>
        ))}
      </div>

      {/* 导出格式 */}
      <div style={styles.section}>
        <div style={styles.label}>导出格式：</div>
        {[
          ["excel", "Excel"],
          ["pdf", "PDF"],
        ].map(([v, text]) => (
          <label key={v} style={styles.checkItem}>
            <input
              type="radio"
              name="format"
              value={v}
              checked={format === v}
              onChange={() => setFormat(v)}
            />
            <span style={{ marginLeft: 6 }}>{text}</span>
          </label>
        ))}
      </div>

      {/* 操作按钮 */}
      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            ...styles.btn,
            background: loading ? "#a78bfa" : "#7c3aed",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "提交中，请稍候…" : "生成表格"}
        </button>

        <button
          onClick={handleCopyJson}
          disabled={!jsonData || loading}
          style={{
            ...styles.btn,
            background: !jsonData ? "#9ca3af" : "#2563eb",
            cursor: !jsonData ? "not-allowed" : "pointer",
          }}
          title={!jsonData ? "需要后端支持 JSON 预览" : ""}
        >
          复制 JSON
        </button>

        <button
          onClick={handleDownloadJson}
          disabled={!jsonData || loading}
          style={{
            ...styles.btn,
            background: !jsonData ? "#9ca3af" : "#10b981",
            cursor: !jsonData ? "not-allowed" : "pointer",
          }}
          title={!jsonData ? "需要后端支持 JSON 预览" : ""}
        >
          下载 JSON
        </button>

        <button
          onClick={handleClear}
          disabled={loading}
          style={{
            ...styles.btn,
            background: "#f97316",
          }}
        >
          一键清空
        </button>
      </div>

      {/* 提示 / JSON 预览 */}
      {!!message && (
        <div style={{ marginTop: 10, color: "#111827", fontSize: 13 }}>{message}</div>
      )}

      {jsonData && (
        <div style={{ marginTop: 12 }}>
          <div style={{ ...styles.label, marginBottom: 6 }}>JSON 预览（前 1-2 条）：</div>
          <pre style={styles.preview}>
            {JSON.stringify(jsonData.slice(0, 2), null, 2)}
          </pre>
        </div>
      )}

      <div style={{ marginTop: 16, fontSize: 12, color: "#6b7280" }}>
        后端：<code>{BACKEND_BASE}</code>
      </div>
    </div>
  );
}

/* --- 简单内联样式 --- */
const styles = {
  wrap: {
    maxWidth: 840,
    margin: "24px auto",
    padding: 16,
    fontFamily:
      '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif',
    color: "#111827",
    lineHeight: 1.5,
  },
  section: { marginTop: 14 },
  label: { fontSize: 14, fontWeight: 600, marginBottom: 6 },
  textarea: {
    width: "100%",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    padding: 10,
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas",
    fontSize: 13,
    outline: "none",
  },
  checkItem: { marginRight: 16, fontSize: 14 },
  btn: {
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 14,
  },
  preview: {
    background: "#111827",
    color: "#d1fae5",
    padding: 12,
    borderRadius: 8,
    fontSize: 12,
    maxHeight: 280,
    overflow: "auto",
  },
};

