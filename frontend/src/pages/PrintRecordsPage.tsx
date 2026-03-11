import { useState, useEffect } from 'react';
import { getPrintRecords, type PrintRecord } from '../api/printRecords';
import { formatTimestamp } from '../utils/date';

export default function PrintRecordsPage() {
  const [records, setRecords] = useState<PrintRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    getPrintRecords()
      .then(setRecords)
      .catch(() => setError('載入失敗，請重新整理'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = records.filter(
    (r) =>
      r.品號.includes(search) ||
      (r.品名 || '').includes(search) ||
      (r.username || '').includes(search)
  );

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>列印記錄</h2>

      <input
        style={styles.search}
        placeholder="搜尋 品號 / 品名 / 帳號..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading && <p>載入中...</p>}
      {error && <p style={{ color: '#e74c3c' }}>{error}</p>}

      {!loading && !error && (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <Th>品號</Th>
                <Th>品名</Th>
                <Th>列印數量</Th>
                <Th>列印時間</Th>
                <Th>帳號</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} style={styles.empty}>無資料</td></tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} style={styles.tr}>
                    <td style={styles.td}>{r.品號}</td>
                    <td style={styles.td}>{r.品名}</td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>{r.列印數量}</td>
                    <td style={styles.td}>{formatTimestamp(r.createtime)}</td>
                    <td style={styles.td}>{r.username}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <p style={styles.total}>共 {filtered.length} 筆</p>
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ padding: '10px 14px', textAlign: 'left', whiteSpace: 'nowrap' }}>{children}</th>;
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '32px 24px' },
  title: { color: '#1a5276', marginBottom: 20 },
  search: {
    padding: '8px 12px', border: '1px solid #ccc', borderRadius: 4,
    fontSize: 14, width: 280, marginBottom: 16, outline: 'none',
  },
  tableWrap: { overflowX: 'auto' },
  table: {
    width: '100%', borderCollapse: 'collapse',
    background: '#fff', borderRadius: 8, overflow: 'hidden',
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
  },
  thead: { background: '#1a5276', color: '#fff' },
  tr: { borderBottom: '1px solid #eee' },
  td: { padding: '10px 14px', fontSize: 14 },
  empty: { textAlign: 'center', padding: 24, color: '#999' },
  total: { marginTop: 10, fontSize: 13, color: '#888' },
};
