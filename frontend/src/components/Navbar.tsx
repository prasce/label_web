import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || '';

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
  }

  return (
    <nav style={styles.nav}>
      <div style={styles.links}>
        <Link to="/" style={styles.link}>首頁</Link>
        <Link to="/print" style={styles.link}>列印標籤</Link>
        <Link to="/upload" style={styles.link}>上傳商品</Link>
        <Link to="/records" style={styles.link}>列印記錄</Link>
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
  link: { color: '#fff', textDecoration: 'none', fontWeight: 500 },
  user: { display: 'flex', alignItems: 'center' },
  logoutBtn: {
    padding: '4px 14px', background: '#e74c3c', color: '#fff',
    border: 'none', borderRadius: 4, cursor: 'pointer',
  },
};
