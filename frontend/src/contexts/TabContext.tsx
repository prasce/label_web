import {
  createContext, useContext, useState, useEffect, useCallback,
  type ReactNode,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export interface Tab {
  path: string;
  label: string;
}

const PATH_LABELS: Record<string, string> = {
  '/':        '首頁',
  '/print':   '列印標籤',
  '/upload':  '上傳商品',
  '/records': '列印記錄',
};

interface TabContextValue {
  tabs: Tab[];
  activeTab: string;
  openTab: (path: string) => void;
  closeTab: (path: string) => void;
}

const TabContext = createContext<TabContextValue | null>(null);

export function TabProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [tabs, setTabs] = useState<Tab[]>([{ path: '/', label: '首頁' }]);
  const [activeTab, setActiveTab] = useState('/');

  // 當 URL 改變時，確保對應 tab 已存在
  useEffect(() => {
    const path = location.pathname;
    const label = PATH_LABELS[path];
    if (!label) return;

    setActiveTab(path);
    setTabs((prev) => {
      if (prev.find((t) => t.path === path)) return prev;
      return [...prev, { path, label }];
    });
  }, [location.pathname]);

  const openTab = useCallback((path: string) => {
    const label = PATH_LABELS[path];
    if (!label) return;
    setTabs((prev) => {
      if (prev.find((t) => t.path === path)) return prev;
      return [...prev, { path, label }];
    });
    setActiveTab(path);
    navigate(path);
  }, [navigate]);

  const closeTab = useCallback((path: string) => {
    setTabs((prev) => {
      const idx = prev.findIndex((t) => t.path === path);
      const next = prev.filter((t) => t.path !== path);

      // 若關閉的是目前 active tab，切換到相鄰 tab
      if (path === activeTab) {
        const target = next[Math.min(idx, next.length - 1)];
        if (target) {
          setActiveTab(target.path);
          navigate(target.path);
        } else {
          // 所有 tab 都關掉，回首頁並重新開啟
          setTabs([{ path: '/', label: '首頁' }]);
          setActiveTab('/');
          navigate('/');
          return [{ path: '/', label: '首頁' }];
        }
      }
      return next;
    });
  }, [activeTab, navigate]);

  return (
    <TabContext.Provider value={{ tabs, activeTab, openTab, closeTab }}>
      {children}
    </TabContext.Provider>
  );
}

export function useTabContext() {
  const ctx = useContext(TabContext);
  if (!ctx) throw new Error('useTabContext must be used inside TabProvider');
  return ctx;
}
