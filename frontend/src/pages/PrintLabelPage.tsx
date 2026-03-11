import { useState } from 'react';
import { getProduct } from '../api/products';
import { createPrintRecord } from '../api/printRecords';
import { isValidYYYYMMDD } from '../utils/date';

interface FormState {
  品號: string;
  對照號: string;
  品名: string;
  單箱數量: string;
  總進貨數量: string;
  製造日期: string;
  有效日期: string;
  保存期限: string;
}

const INIT: FormState = {
  品號: '', 對照號: '', 品名: '', 單箱數量: '',
  總進貨數量: '', 製造日期: '', 有效日期: '', 保存期限: '',
};

export default function PrintLabelPage() {
  const [form, setForm] = useState<FormState>(INIT);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [lookupMsg, setLookupMsg] = useState('');
  const [submitMsg, setSubmitMsg] = useState('');

  // 總箱數（系統計算）
  const 總箱數 = (() => {
    const qty = Number(form.總進貨數量);
    const box = Number(form.單箱數量);
    if (qty > 0 && box > 0) return Math.floor(qty / box);
    return '';
  })();

  // 品號失焦時自動回查
  async function handleProductLookup() {
    if (!form.品號) return;
    setLookupMsg('查詢中...');
    try {
      const p = await getProduct(form.品號);
      setForm((f) => ({
        ...f,
        對照號: p.對照號 || '',
        品名: p.品名 || '',
        單箱數量: String(p.單箱數量 || ''),
      }));
      setLookupMsg('✓ 已帶入商品資料');
    } catch {
      setLookupMsg('查無此品號，請確認後繼續');
    }
  }

  function validate(): boolean {
    const e: Partial<FormState> = {};
    if (!form.品號) e.品號 = '品號為必填';
    if (!form.總進貨數量) e.總進貨數量 = '總進貨數量為必填';
    if (form.製造日期 && !isValidYYYYMMDD(form.製造日期))
      e.製造日期 = '格式須為 yyyymmdd（例：20260101）';
    if (form.有效日期 && !isValidYYYYMMDD(form.有效日期))
      e.有效日期 = '格式須為 yyyymmdd（例：20270101）';
    if (form.保存期限 && !isValidYYYYMMDD(form.保存期限))
      e.保存期限 = '格式須為 yyyymmdd（例：20280101）';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handlePrint() {
    if (!validate()) return;
    try {
      await createPrintRecord({
        品號: form.品號,
        品名: form.品名,
        列印數量: Number(form.總進貨數量),
      });
      setSubmitMsg('✓ 列印記錄已儲存');
      window.print();
    } catch {
      setSubmitMsg('列印記錄儲存失敗，請重試');
    }
  }

  function handleReset() {
    setForm(INIT);
    setErrors({});
    setLookupMsg('');
    setSubmitMsg('');
  }

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>列印標籤</h2>
      <div style={styles.card}>

        {/* 品號 */}
        <Row label="品號 *">
          <input
            style={styles.input}
            value={form.品號}
            onChange={(e) => setForm((f) => ({ ...f, 品號: e.target.value }))}
            onBlur={handleProductLookup}
            placeholder="輸入後離開欄位自動回查"
          />
          {lookupMsg && <small style={{ color: lookupMsg.startsWith('✓') ? 'green' : '#e67e22' }}>{lookupMsg}</small>}
          {errors.品號 && <Err msg={errors.品號} />}
        </Row>

        {/* 對照號 */}
        <Row label="對照號">
          <input style={{ ...styles.input, background: '#f5f5f5' }} value={form.對照號} readOnly />
        </Row>

        {/* 品名 */}
        <Row label="品名">
          <input style={{ ...styles.input, background: '#f5f5f5' }} value={form.品名} readOnly />
        </Row>

        {/* 單箱數量 */}
        <Row label="單箱數量">
          <input style={{ ...styles.input, background: '#f5f5f5' }} value={form.單箱數量} readOnly />
        </Row>

        {/* 總進貨數量 */}
        <Row label="總進貨數量 *">
          <input
            style={styles.input}
            type="number"
            min={1}
            value={form.總進貨數量}
            onChange={(e) => setForm((f) => ({ ...f, 總進貨數量: e.target.value }))}
          />
          {errors.總進貨數量 && <Err msg={errors.總進貨數量} />}
        </Row>

        {/* 總箱數（唯讀） */}
        <Row label="總箱數">
          <input style={{ ...styles.input, background: '#f5f5f5', fontWeight: 600 }} value={總箱數} readOnly />
          <small style={{ color: '#888' }}>系統計算（總進貨數量 ÷ 單箱數量）</small>
        </Row>

        {/* 日期三欄 */}
        {(['製造日期', '有效日期', '保存期限'] as const).map((field) => (
          <Row key={field} label={field}>
            <input
              style={styles.input}
              value={form[field]}
              maxLength={8}
              placeholder="yyyymmdd"
              onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
            />
            {errors[field] && <Err msg={errors[field]!} />}
          </Row>
        ))}

        {submitMsg && (
          <div style={{ color: submitMsg.startsWith('✓') ? 'green' : '#e74c3c', marginBottom: 8 }}>
            {submitMsg}
          </div>
        )}

        <div style={styles.btnRow}>
          <button style={styles.printBtn} onClick={handlePrint}>列印</button>
          <button style={styles.resetBtn} onClick={handleReset}>清除</button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
      <label style={{ fontWeight: 500, fontSize: 14 }}>{label}</label>
      {children}
    </div>
  );
}

function Err({ msg }: { msg: string }) {
  return <small style={{ color: '#e74c3c' }}>{msg}</small>;
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '32px 24px' },
  title: { color: '#1a5276', marginBottom: 24 },
  card: {
    background: '#fff', padding: '28px 32px', borderRadius: 8,
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)', maxWidth: 520,
  },
  input: {
    padding: '8px 10px', border: '1px solid #ccc', borderRadius: 4,
    fontSize: 15, outline: 'none', width: '100%', boxSizing: 'border-box',
  },
  btnRow: { display: 'flex', gap: 12, marginTop: 8 },
  printBtn: {
    flex: 1, padding: '10px 0', background: '#1a5276', color: '#fff',
    border: 'none', borderRadius: 4, fontSize: 15, cursor: 'pointer',
  },
  resetBtn: {
    padding: '10px 20px', background: '#ecf0f1', color: '#333',
    border: '1px solid #ccc', borderRadius: 4, fontSize: 15, cursor: 'pointer',
  },
};
