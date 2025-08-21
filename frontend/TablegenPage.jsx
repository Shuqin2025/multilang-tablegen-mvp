// frontend/TablegenPage.jsx
import React, { useState } from 'react';
import { API_BASE } from './apiBase';

export default function TablegenPage() {
  const [urls, setUrls] = useState('');
  const [fields, setFields] = useState(['name', 'price']);
  const [language, setLanguage] = useState('zh');
  const [format, setFormat] = useState('excel');
  const [downloading, setDownloading] = useState(false);

  const toggleField = (field) => {
    setFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setDownloading(true);
    try {
      const resp = await fetch(`${API_BASE}/api/tablegen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urls: urls.split('\n').map((u) => u.trim()).filter(Boolean),
          fields,
          languages: [language],
          format,
        }),
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `result.${format === 'excel' ? 'xlsx' : format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('下载出错:', err);
      alert('生成表格失败: ' + err.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>多语言表格制作 MVP</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>产品页面 URL 列表（每行一个）</label>
          <br />
          <textarea
            rows={6}
            cols={60}
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            placeholder="https://example.com/prod1"
          />
        </div>

        <div>
          <label>选择需抓取字段：</label>
          {['name', 'imageUrl', 'price', 'moq_value', 'description'].map((f) => (
            <label key={f} style={{ marginRight: 10 }}>
              <input
                type="checkbox"
                checked={fields.includes(f)}
                onChange={() => toggleField(f)}
              />
              {f}
            </label>
          ))}
        </div>

        <div>
          <label>选择语言：</label>
          {[
            ['zh', '中文'],
            ['en', 'English'],
            ['de', 'Deutsch'],
          ].map(([val, label]) => (
            <label key={val} style={{ marginRight: 10 }}>
              <input
                type="radio"
                checked={language === val}
                onChange={() => setLanguage(val)}
              />
              {label}
            </label>
          ))}
        </div>

        <div>
          <label>导出格式：</label>
          {['excel', 'pdf'].map((fmt) => (
            <label key={fmt} style={{ marginRight: 10 }}>
              <input
                type="radio"
                checked={format === fmt}
                onChange={() => setFormat(fmt)}
              />
              {fmt.toUpperCase()}
            </label>
          ))}
        </div>

        <div style={{ marginTop: 20 }}>
          <button type="submit" disabled={downloading}>
            {downloading ? '生成中...' : '生成表格'}
          </button>
        </div>
      </form>
    </div>
  );
}
