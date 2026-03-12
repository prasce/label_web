import { useNavigate } from 'react-router-dom';
import { useTabContext } from '../contexts/TabContext';

const NAV_ITEMS = [
  { path: '/',        label: '首頁' },
  { path: '/print',   label: '列印標籤' },
  { path: '/upload',  label: '上傳商品' },
  { path: '/records', label: '列印記錄' },
];

export default function Navbar() {
  const navigate = useNavigate();
  const { openTab } = useTabContext();
  const username = localStorage.getItem('username') || '';

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
  }

  return (
    <nav style={styles.nav}>
      <div style={styles.links}>
        {NAV_ITEMS.map((item) => (
          <span
            key={item.path}
            style={styles.link}
            onClick={() => openTab(item.path)}
          >
            {item.label}
          </span>
        ))}
      </div>
      <div style={styles.user}>
        <span style={{ marginRight: 12 }}>{username}</span>
        <button onClick={handleLogout} style={styles.logoutBtn}>登出</button>
      </div>
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 24px', height: 52, background: '#1a5276', color: '#fff',
  },
  links: { display: 'flex', gap: 24 },
  link: {
    color: '#fff', textDecoration: 'none', fontWeight: 500,
    cursor: 'pointer',
  },
  user: { display: 'flex', alignItems: 'center' },
  logoutBtn: {
    padding: '4px 14px', background: '#e74c3c', color: '#fff',
    border: 'none', borderRadius: 4, cursor: 'pointer',
  },
};
