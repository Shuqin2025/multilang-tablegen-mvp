import React, { useEffect, useMemo, useState } from "react";

/** 后端基地址（优先取环境变量 VITE_API_BASE） */
const API_BASE =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE) ||
  "https://multilang-backend-bl2m.onrender.com";

/** 具体接口 */
const ENDPOINTS = {
  health: `${API_BASE}/health`,
  tablegen: `${API_BASE}/api/tablegen`, // 同一个接口，根据 export: "excel" | "pdf" | "json"
};

/** 下载 Blob 的通用工具 */
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
  // 表单状态
  const [urlsText, setUrlsText] = useState("https://example.com/product/123");
  const [fields, setFields] = useState({
    name: true,
    imageUrl: true,
    price: true,
    moq_value: false,
    description: false,
  });
  const [lang, setLang] = useState("zh");       // zh | en | de
  const [format, setFormat] = useState("excel"); // excel | pdf

  // 运行状态
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState({ ok: false, msg: "checking…" });
  const [result, setResult] = useState(null);   // 用于“复制/下载 JSON” 预览

  // 解析 URL 列表
  const urlList = useMemo(
    () =>
      urlsText
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean),
    [urlsText]
  );

  // 健康检查
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(ENDPOINTS.health);
        const ok = res.ok;
        if (!cancelled) setHealth({ ok, msg: ok ? "running" : "unhealthy" });
      } catch {
        if (!cancelled) setHealth({ ok: false, msg: "offline" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // 表单校验
  const validate = () => {
    if (!urlList.length) return "请至少输入 1 个商品 URL";
    const bad = urlList.find((u) => !/^https?:\/\//i.test(u));
    if (bad) return `URL 格式不正确：${bad}`;
    const picked = Object.entries(fields)
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (!picked.length) return "请至少选择 1 个字段";
    if (!["zh", "en", "de"].includes(lang)) return "请选择语言";
    if (!["excel", "pdf"].includes(format)) return "请选择导出格式";
    return null;
  };

  // 生成并下载（唯一的点击处理函数）
  const handleGenerate = async () => {
    const err = validate();
    if (err) return alert(err);

    const payload = {
      urls: urlList,
      fields: Object.entries(fields)
        .filter(([, v]) => v)
        .map(([k]) => k),
      languages: [lang],
      export: format, // "excel" | "pdf"
    };

    setLoading(true);
    try {
      const res = await fetch(ENDPOINTS.tablegen, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // 如果后端按文件流返回（推荐），content-type 会是 application/xxx
      const ct = res.headers.get("content-type") || "";
      if (res.ok && /application\//i.test(ct)) {
        const blob = await res.blob();
        const cd = res.headers.get("content-disposition") || "";
        let filename =
          cd.match(/filename\*?=(?:UTF-8''|")?([^;"']+)/i)?.[1] ||
          `tablegen_${Date.now()}.${format === "pdf" ? "pdf" : "xlsx"}`;
        try {
          filename = decodeURIComponent(filename);
        } catch {}
        downloadBlob(blob, filename);

        // 如果你也想在页面上展示 JSON，可以再追加一次 "json" 请求（可选）
        try {
          const r2 = await fetch(ENDPOINTS.tablegen, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...payload, export: "json" }),
          });
          setResult(r2.ok ? await r2.json() : null);
        } catch {
          setResult(null);
        }
        return;
      }

      // 否则尽量解析文本/JSON用于报错提示
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        setResult(json);
        alert(json?.message || `生成完成（返回 JSON）。如未触发下载，请检查后端导出实现。`);
      } catch {
        alert(`生成表格失败：HTTP ${res.status}：${text.slice(0, 400)}`);
      }
    } catch (e) {
      alert(`请求失败：${e?.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  // 复制 / 下载 JSON（可选）
  const handleCopyJSON = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      alert("已复制到剪贴板");
    } catch {
      alert("复制失败，请手动复制");
    }
  };
  const handleDownloadJSON = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    downloadBlob(blob, `tablegen_result_${Date.now()}.json`);
  };

  // 清空
  const handleClear = () => {
    setUrlsText("");
    setFields({
      name: true,
      imageUrl: true,
      price: true,
      moq_value: false,
      description: false,
    });
    setLang("zh");
    setFormat("excel");
    setResult(null);
  };

  return (
    <div style={{ padding: 16, maxWidth: 920, margin: "0 auto", lineHeight: 1.6 }}>
      <h2>多语言表格制作 MVP</h2>

      <div style={{ margin: "12px 0" }}>
        <div style={{ marginBottom: 6 }}>产品页面 URL 列表（每行一个）</div>
        <textarea
          value={urlsText}
          onChange={(e) => setUrlsText(e.target.value)}
          rows={6}
          style={{ width: "100%", fontFamily: "monospace" }}
          placeholder="https://example.com/product/123"
        />
      </div>

      <div style={{ margin: "12px 0" }}>
        <div style={{ marginBottom: 6 }}>选择需抓取字段：</div>
        {Object.entries(fields).map(([k, v]) => (
          <label key={k} style={{ marginRight: 16 }}>
            <input
              type="checkbox"
              checked={v}
              onChange={(e) => setFields((old) => ({ ...old, [k]: e.target.checked }))}
            />{" "}
            {k}
          </label>
        ))}
      </div>

      <div style={{ margin: "12px 0" }}>
        <div style={{ marginBottom: 6 }}>选择语言：</div>
        <label style={{ marginRight: 16 }}>
          <input type="radio" value="zh" checked={lang === "zh"} onChange={() => setLang("zh")} /> 中文
        </label>
        <label style={{ marginRight: 16 }}>
          <input type="radio" value="en" checked={lang === "en"} onChange={() => setLang("en")} /> English
        </label>
        <label style={{ marginRight: 16 }}>
          <input type="radio" value="de" checked={lang === "de"} onChange={() => setLang("de")} /> Deutsch
        </label>
      </div>

      <div style={{ margin: "12px 0" }}>
        <div style={{ marginBottom: 6 }}>导出格式：</div>
        <label style={{ marginRight: 16 }}>
          <input
            type="radio"
            value="excel"
            checked={format === "excel"}
            onChange={() => setFormat("excel")}
          />{" "}
          EXCEL
        </label>
        <label style={{ marginRight: 16 }}>
          <input type="radio" value="pdf" checked={format === "pdf"} onChange={() => setFormat("pdf")} /> PDF
        </label>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          style={{
            padding: "8px 16px",
            background: "#5b6cff",
            color: "#fff",
            border: 0,
            borderRadius: 6,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "提交中，请稍候…" : "生成表格"}
        </button>

        <button type="button" onClick={handleCopyJSON} disabled={!result}>
          复制 JSON
        </button>
        <button type="button" onClick={handleDownloadJSON} disabled={!result}>
          下载 JSON
        </button>
        <button type="button" onClick={handleClear}>清空</button>

        <span style={{ marginLeft: "auto", opacity: 0.8, fontSize: 12 }}>
          API：{API_BASE}{" "}
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: health.ok ? "#22c55e" : "#ef4444",
              verticalAlign: "middle",
              marginLeft: 6,
            }}
            title={`health: ${health.msg}`}
          />
        </span>
      </div>

      {result && (
        <div style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 6, fontWeight: 600 }}>结果预览（JSON）</div>
          <pre
            style={{
              background: "#f7f7fa",
              border: "1px solid #eee",
              padding: 12,
              borderRadius: 6,
              maxHeight: 360,
              overflow: "auto",
            }}
          >
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
