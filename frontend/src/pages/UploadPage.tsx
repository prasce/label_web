import { useState, useRef } from 'react';
import { uploadProducts } from '../api/products';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setResult(null);
    setErrMsg('');
  }

  async function handleUpload() {
    if (!file) { setErrMsg('請先選擇 Excel 檔案'); return; }
    setLoading(true);
    setErrMsg('');
    try {
      const res = await uploadProducts(file);
      setResult(res);
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
    } catch (err: any) {
      setErrMsg(err.response?.data?.error || '上傳失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>上傳商品主檔</h2>
      <div style={styles.card}>
        <p style={styles.hint}>
          請上傳 Excel 檔案，欄位順序：<br />
          <strong>A: 品號　B: 對照號　C: 品名　E: 單箱數量</strong><br />
          （第一列為標題，自動略過）
        </p>

        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          style={styles.fileInput}
        />

        {file && (
          <div style={styles.fileInfo}>
            已選擇：<strong>{file.name}</strong>（{(file.size / 1024).toFixed(1)} KB）
          </div>
        )}

        {errMsg && <div style={styles.error}>{errMsg}</div>}

        <button
          style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}
          onClick={handleUpload}
          disabled={loading}
        >
          {loading ? '上傳中...' : '開始上傳'}
        </button>

        {result && (
          <div style={styles.result}>
            <div style={{ color: 'green', fontWeight: 600 }}>✓ 成功：{result.success} 筆</div>
            {result.failed > 0 && (
              <>
                <div style={{ color: '#e74c3c', fontWeight: 600 }}>✗ 失敗：{result.failed} 筆</div>
                <ul style={{ margin: '8px 0 0 16px', color: '#e74c3c', fontSize: 13 }}>
                  {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '32px 24px' },
  title: { color: '#1a5276', marginBottom: 24 },
  card: {
    background: '#fff', padding: '28px 32px', borderRadius: 8,
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)', maxWidth: 520,
    display: 'flex', flexDirection: 'column', gap: 16,
  },
  hint: {
    background: '#eaf4fb', padding: '12px 16px', borderRadius: 6,
    fontSize: 14, lineHeight: 1.8, color: '#333', margin: 0,
  },
  fileInput: { fontSize: 14 },
  fileInfo: { fontSize: 13, color: '#555' },
  error: { background: '#fdecea', color: '#c0392b', padding: '8px 12px', borderRadius: 4, fontSize: 14 },
  btn: {
    padding: '10px 0', background: '#1a5276', color: '#fff',
    border: 'none', borderRadius: 4, fontSize: 15, cursor: 'pointer',
  },
  result: {
    background: '#f9f9f9', border: '1px solid #ddd', borderRadius: 6,
    padding: '12px 16px', fontSize: 14,
  },
};
