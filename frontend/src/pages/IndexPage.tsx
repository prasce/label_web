import { Link } from 'react-router-dom';

const cards = [
  { to: '/print',   label: '列印標籤',   icon: '🖨️', desc: '輸入品號與數量，產生並列印商品標籤' },
  { to: '/upload',  label: '上傳商品',   icon: '📂', desc: '從 Excel 批次匯入商品主檔資料' },
  { to: '/records', label: '列印記錄',   icon: '📋', desc: '查詢所有標籤的列印歷史記錄' },
];

export default function IndexPage() {
  const username = localStorage.getItem('username') || '';

  return (
    <div style={styles.page}>
      <h2 style={styles.greeting}>歡迎，{username}</h2>
      <div style={styles.grid}>
        {cards.map((c) => (
          <Link key={c.to} to={c.to} style={styles.card}>
            <span style={styles.icon}>{c.icon}</span>
            <strong style={styles.cardTitle}>{c.label}</strong>
            <p style={styles.cardDesc}>{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '40px 32px' },
  greeting: { marginBottom: 32, color: '#1a5276' },
  grid: { display: 'flex', gap: 24, flexWrap: 'wrap' },
  card: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    width: 200, padding: '32px 20px', background: '#fff', borderRadius: 10,
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)', textDecoration: 'none',
    color: '#333', transition: 'box-shadow 0.2s',
  },
  icon: { fontSize: 40 },
  cardTitle: { fontSize: 18, color: '#1a5276' },
  cardDesc: { fontSize: 13, color: '#666', textAlign: 'center', margin: 0 },
};
