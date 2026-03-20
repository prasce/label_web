import { useState, useRef } from 'react';
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

interface LabelData {
  boxNo: number;
  total: number;
  quantity: number;
  isPartial: boolean;
}

function calcLabels(form: FormState): LabelData[] {
  const qty = Number(form.總進貨數量);
  const box = Number(form.單箱數量);
  if (!qty || !box) return [];
  const fullBoxes = Math.floor(qty / box);
  const remainder = qty % box;
  const total = remainder > 0 ? fullBoxes + 1 : fullBoxes;
  return Array.from({ length: total }, (_, i) => ({
    boxNo: i + 1,
    total,
    quantity: i < fullBoxes ? box : remainder,
    isPartial: remainder > 0 && i === total - 1,
  }));
}

// ── 單張標籤 ──────────────────────────────────────────────
function LabelPage({ form, label }: { form: FormState; label: LabelData }) {
  return (
    <div className="label-page">
      <table className="label-table">
        <tbody>
          <tr>
            <td className="label-cell label-cell-left">
              <span className="label-field-name">日翊品號：</span>
              <span className="label-value">{form.品號}</span>
            </td>
            <td className="label-cell label-cell-right">
              <span className="label-field-name">商品名稱：</span>
              <span className="label-value">{form.品名}</span>
            </td>
          </tr>
          <tr>
            <td className="label-cell label-cell-left">
              <span className="label-field-name">商品單箱入數：</span>
              <span className="label-value">{form.單箱數量}</span>
            </td>
            <td className="label-cell label-cell-right">
              <span className="label-field-name">商品總進貨數(採購數量)：</span>
              <span className="label-value">{form.總進貨數量}</span>
            </td>
          </tr>
          <tr>
            <td className="label-cell label-cell-remark" colSpan={2}>
              <div className="label-remark-line">
                <span className="label-field-name">備註：</span>
                第 <u>{label.boxNo}</u> 箱 / 共 <u>{label.total}</u> 箱
                &nbsp;&nbsp;數量：<strong className="label-qty">{label.quantity}</strong>
              </div>
              {label.isPartial && (
                <div className="label-scatter">！！！此箱散貨箱請注意！！！</div>
              )}
            </td>
          </tr>
          <tr>
            <td className="label-cell label-cell-dates" colSpan={2}>
              <div className="label-dates-row">
                <span>
                  <span className="label-field-name">製造日期：</span>
                  {isValidYYYYMMDD(form.製造日期) ? form.製造日期 : ''}
                </span>
                <span>
                  <span className="label-field-name">保存期限：</span>
                  {isValidYYYYMMDD(form.保存期限) ? form.保存期限 : ''}
                </span>
                <span>
                  <span className="label-field-name">有效日期：</span>
                  {isValidYYYYMMDD(form.有效日期) ? form.有效日期 : ''}
                </span>
              </div>
            </td>
          </tr>
          <tr>
            <td className="label-cell label-cell-hint" colSpan={2}>
              （三擇二填寫）
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ── 主頁面 ────────────────────────────────────────────────
export default function PrintLabelPage() {
  const [form, setForm] = useState<FormState>(INIT);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [lookupMsg, setLookupMsg] = useState('');
  const [submitMsg, setSubmitMsg] = useState('');

  const 總進貨數量Ref = useRef<HTMLInputElement>(null);
  const dateRefs = useRef<Record<string, HTMLInputElement | null>>({});

  function handleEnterTab(e: React.KeyboardEvent<HTMLInputElement>, next: () => void) {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      next();
    }
  }

  const 總箱數 = (() => {
    const qty = Number(form.總進貨數量);
    const box = Number(form.單箱數量);
    if (qty > 0 && box > 0) return Math.floor(qty / box);
    return '';
  })();

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
    const dateFields = ['製造日期', '有效日期', '保存期限'] as const;
    dateFields.forEach((field) => {
      if (form[field] && !isValidYYYYMMDD(form[field]))
        e[field] = '格式須為 yyyymmdd（例：20260101）';
    });
    const validDateCount = dateFields.filter((f) => form[f] && isValidYYYYMMDD(form[f])).length;
    if (validDateCount < 2)
      e.製造日期 = (e.製造日期 ? e.製造日期 + '；' : '') + '製造日期／有效日期／保存期限至少填寫兩項';
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

  const labels = calcLabels(form);
  const readonlyInput = { ...styles.input, background: '#f5f5f5', color: '#888' };

  return (
    <>
      <style>{PRINT_CSS}</style>

      {/* 列印用標籤（僅列印時顯示） */}
      <div className="print-labels">
        {labels.map((label) => (
          <LabelPage key={label.boxNo} form={form} label={label} />
        ))}
      </div>

      {/* 表單（列印時隱藏） */}
      <div className="screen-form" style={styles.page}>
        <h2 style={styles.title}>列印標籤</h2>
        <div style={styles.card}>

          {/* Row 1: 品號 + 對照號 */}
          <div style={styles.grid2}>
            <div style={styles.field}>
              <label style={styles.label}>品號 *</label>
              <input
                style={errors.品號 ? { ...styles.input, borderColor: '#e74c3c' } : styles.input}
                value={form.品號}
                onChange={(e) => setForm((f) => ({ ...f, 品號: e.target.value }))}
                onBlur={handleProductLookup}
                onKeyDown={(e) => handleEnterTab(e, () => {
                  handleProductLookup();
                  總進貨數量Ref.current?.focus();
                })}
                placeholder="輸入後離開欄位自動回查"
              />
              {lookupMsg && (
                <small style={{ color: lookupMsg.startsWith('✓') ? '#16a34a' : '#e67e22', marginTop: 3 }}>
                  {lookupMsg}
                </small>
              )}
              {errors.品號 && <small style={styles.errText}>{errors.品號}</small>}
            </div>

            <div style={styles.field}>
              <label style={styles.label}>對照號</label>
              <input style={readonlyInput} value={form.對照號} readOnly tabIndex={-1} />
            </div>
          </div>

          {/* Row 2: 品名 + 單箱數量 */}
          <div style={styles.grid2}>
            <div style={styles.field}>
              <label style={styles.label}>品名</label>
              <input style={readonlyInput} value={form.品名} readOnly tabIndex={-1} />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>單箱數量</label>
              <input style={readonlyInput} value={form.單箱數量} readOnly tabIndex={-1} />
            </div>
          </div>

          {/* Row 3: 總進貨數量 + 總箱數 */}
          <div style={styles.grid2}>
            <div style={styles.field}>
              <label style={styles.label}>總進貨數量 *</label>
              <input
                ref={總進貨數量Ref}
                style={errors.總進貨數量 ? { ...styles.input, borderColor: '#e74c3c' } : styles.input}
                type="number"
                min={1}
                value={form.總進貨數量}
                onChange={(e) => setForm((f) => ({ ...f, 總進貨數量: e.target.value }))}
                onKeyDown={(e) => handleEnterTab(e, () => dateRefs.current['製造日期']?.focus())}
              />
              {errors.總進貨數量 && <small style={styles.errText}>{errors.總進貨數量}</small>}
            </div>

            <div style={styles.field}>
              <label style={styles.label}>總箱數</label>
              <input style={{ ...readonlyInput, fontWeight: 600 }} value={總箱數} readOnly tabIndex={-1} />
              <small style={{ color: '#9ca3af', marginTop: 3, fontSize: 12 }}>
                系統計算（總進貨數量 ÷ 單箱數量）
              </small>
            </div>
          </div>

          {/* Row 4: 製造日期 + 有效日期 + 保存期限 */}
          <div style={styles.grid3}>
            {(['製造日期', '有效日期', '保存期限'] as const).map((field, idx, arr) => (
              <div key={field} style={styles.field}>
                <label style={styles.label}>{field}</label>
                <input
                  ref={(el) => { dateRefs.current[field] = el; }}
                  style={errors[field] ? { ...styles.input, borderColor: '#e74c3c' } : styles.input}
                  value={form[field]}
                  maxLength={8}
                  placeholder="yyyymmdd"
                  onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                  onKeyDown={(e) => {
                    const next = arr[idx + 1];
                    if (next) handleEnterTab(e, () => dateRefs.current[next]?.focus());
                  }}
                />
                {errors[field] && <small style={styles.errText}>{errors[field]}</small>}
              </div>
            ))}
          </div>

          {submitMsg && (
            <div style={{
              color: submitMsg.startsWith('✓') ? '#16a34a' : '#e74c3c',
              fontSize: 13, marginBottom: 10,
            }}>
              {submitMsg}
            </div>
          )}

          {/* 按鈕列 */}
          <div style={styles.btnRow}>
            <button style={styles.printBtn} onClick={handlePrint}>列印</button>
            <button style={styles.resetBtn} onClick={handleReset}>清除</button>
          </div>

        </div>
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '32px 24px' },
  title: {
    color: '#1a3a5c',
    fontSize: 26,
    fontWeight: 700,
    marginBottom: 24,
    letterSpacing: '0.5px',
  },
  card: {
    background: '#fff',
    padding: '32px 36px',
    borderRadius: 12,
    boxShadow: '0 2px 16px rgba(0,0,0,0.09)',
    maxWidth: 760,
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0 24px',
    marginBottom: 4,
  },
  grid3: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '0 20px',
    marginBottom: 4,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: 500,
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    padding: '10px 12px',
    border: '1.5px solid #d1d5db',
    borderRadius: 6,
    fontSize: 14,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
    color: '#111827',
    transition: 'border-color 0.15s',
  },
  errText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 3,
  },
  btnRow: {
    display: 'flex',
    gap: 12,
    marginTop: 8,
  },
  printBtn: {
    flex: 1,
    padding: '12px 0',
    background: '#1a3a5c',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    letterSpacing: '2px',
  },
  resetBtn: {
    padding: '12px 28px',
    background: '#ecf0f1',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    fontSize: 15,
    fontWeight: 500,
    cursor: 'pointer',
  },
};

const PRINT_CSS = `
  @media screen {
    .print-labels { display: none; }
  }

  @media print {
    @page {
      size: 11cm 8cm;
      margin: 0;
    }

    body * { visibility: hidden; }
    .print-labels, .print-labels * { visibility: visible; }
    .print-labels {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
    }

    .label-page {
      page-break-after: always;
      width: 11cm;
      height: 8cm;
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      padding: 2mm;
    }
    .label-page:last-child { page-break-after: avoid; }

    .label-table {
      width: 100%;
      height: 100%;
      border-collapse: collapse;
      font-size: 9pt;
      font-family: "Microsoft JhengHei", "微軟正黑體", Arial, sans-serif;
    }

    .label-cell {
      border: 1.5px solid #000;
      padding: 3mm 4mm;
      vertical-align: middle;
    }

    .label-cell-left  { width: 42%; }
    .label-cell-right { width: 58%; }

    .label-cell-remark {
      font-size: 9pt;
      padding: 3mm 4mm;
      height: 18mm;
      vertical-align: middle;
    }

    .label-remark-line { margin-bottom: 2mm; }
    .label-qty { font-size: 12pt; }

    .label-scatter {
      font-size: 10pt;
      font-weight: bold;
      text-align: center;
      margin-top: 1mm;
    }

    .label-cell-dates { padding: 3mm 4mm; }

    .label-cell-hint {
      border: 1.5px solid #000;
      padding: 2mm 4mm;
      text-align: center;
      font-size: 8.5pt;
    }

    .label-field-name { font-weight: bold; }
    .label-value { margin-left: 2px; }

    .label-dates-row {
      display: flex;
      justify-content: space-between;
      gap: 4px;
      font-size: 8.5pt;
    }
  }
`;
