// frontend/src/components/TablegenPage.jsx
import React, { useState } from "react";

export default function TablegenPage() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // 后端基地址：优先取环境变量，未配置则用当前 Render 后端示例
  const API_BASE =
    import.meta.env?.VITE_API_BASE || "https://multilang-backend-bl2m.onrender.com";

  const handleSubmit = async () => {
    if (!input.trim()) {
      alert("请输入测试内容再提交哦～");
      return;
    }
    setLoading(true);
    setResult(null); // 提交时清空上一条结果
    try {
      const res = await fetch(`${API_BASE}/api/tablegen/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setResult({ error: err.message || "请求失败" });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const text = JSON.stringify(result, null, 2);
    navigator.clipboard.writeText(text).then(() => {
      alert("✅ 已复制到剪贴板！");
    });
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "tablegen-result.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (loading) return; // loading 中避免误清空
    setInput("");
    setResult(null);
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">测试 Tablegen 接口</h1>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="输入测试内容"
        className="border p-2 w-full mb-3"
        disabled={loading}
      />

      <div className="flex gap-2 mb-2">
        <button
          onClick={handleSubmit}
          className={`text-white px-4 py-2 rounded ${
            loading ? "bg-blue-300" : "bg-blue-500 hover:bg-blue-600"
          }`}
          disabled={loading}
        >
          {loading ? "提交中，请稍候…" : "提交"}
        </button>

        <button
          onClick={handleClear}
          className={`text-white px-4 py-2 rounded ${
            loading ? "bg-gray-300" : "bg-gray-500 hover:bg-gray-600"
          }`}
          disabled={loading}
        >
          清空
        </button>

        <button
          onClick={handleCopy}
          className={`text-white px-4 py-2 rounded ${
            !result || loading ? "bg-green-300" : "bg-green-500 hover:bg-green-600"
          }`}
          disabled={!result || loading}
        >
          📋 复制结果
        </button>

        <button
          onClick={handleDownload}
          className={`text-white px-4 py-2 rounded ${
            !result || loading ? "bg-purple-300" : "bg-purple-500 hover:bg-purple-600"
          }`}
          disabled={!result || loading}
        >
          💾 下载 JSON
        </button>
      </div>

      {loading && (
        <div className="text-sm text-gray-600 mb-2">⏳ 提交中，请稍候…</div>
      )}

      {result && (
        <div className="mt-3">
          <h2 className="text-lg font-semibold mb-2">结果：</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto whitespace-pre-wrap break-words">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
