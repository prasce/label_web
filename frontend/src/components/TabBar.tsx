import { useNavigate } from 'react-router-dom';
import { useTabContext } from '../contexts/TabContext';

export default function TabBar() {
  const { tabs, activeTab, closeTab } = useTabContext();
  const navigate = useNavigate();

  return (
    <div style={styles.bar}>
      {tabs.map((tab) => {
        const isActive = tab.path === activeTab;
        return (
          <div
            key={tab.path}
            style={{
              ...styles.tab,
              ...(isActive ? styles.tabActive : styles.tabInactive),
            }}
            onClick={() => navigate(tab.path)}
          >
            <span style={styles.tabLabel}>{tab.label}</span>
            <span
              style={styles.closeBtn}
              onClick={(e) => { e.stopPropagation(); closeTab(tab.path); }}
              title="關閉"
            >
              ×
            </span>
          </div>
        );
      })}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  bar: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 2,
    background: '#ede8f5',
    padding: '6px 16px 0',
    borderBottom: '1px solid #ccc',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 14px',
    borderRadius: '6px 6px 0 0',
    cursor: 'pointer',
    fontSize: 13,
    userSelect: 'none',
    border: '1px solid transparent',
    borderBottom: 'none',
    minWidth: 80,
    maxWidth: 160,
  },
  tabActive: {
    background: '#fff',
    color: '#1a1a1a',
    border: '1px solid #ccc',
    borderBottom: '1px solid #fff',
    fontWeight: 600,
    marginBottom: -1,
  },
  tabInactive: {
    background: 'transparent',
    color: '#555',
  },
  tabLabel: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  closeBtn: {
    fontSize: 15,
    lineHeight: 1,
    color: '#888',
    padding: '0 2px',
    borderRadius: 3,
    cursor: 'pointer',
    flexShrink: 0,
  },
};
