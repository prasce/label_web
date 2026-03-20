# Skill: print-label

## Description

Handles all read and modify operations on the label printing feature. This includes
the `PrintLabelPage.tsx` UI, the label format and layout, all business calculations,
date validation rules, keyboard navigation, and the API calls that back the feature.

## Trigger

Use this skill when the user asks about or requests changes to:
- The print label page or label preview
- Label format, size, or fields
- Box count / scatter-box calculations
- Date field rules (製造日期 / 有效日期 / 保存期限)
- Keyboard navigation on the print form
- Auto-filling product data from 品號 lookup
- POST /api/print-records behaviour

## Files to Read

Always read these files before making changes:

1. `frontend/src/pages/PrintLabelPage.tsx` — main page component
2. `frontend/src/api/products.ts` — `getProduct()` call (GET /api/products/:品號)
3. `frontend/src/api/printRecords.ts` — `createRecord()` call (POST /api/print-records)
4. `frontend/src/utils/date.ts` — `isValidYYYYMMDD()` validation helper
5. `backend/src/routes/printRecords.ts` — POST handler that inserts into print_records
6. `backend/src/routes/products.ts` — GET handler that returns a single product

## Steps

1. **Read all files listed above** before writing any code.
2. **Understand the current form fields**:
   - 品號 (required, triggers product lookup on blur/Enter/Tab)
   - 總進貨數量 (required, integer)
   - 對照號, 品名, 單箱數量 (read-only, filled by product lookup)
   - 總箱數 (read-only, computed)
   - 製造日期, 有效日期, 保存期限 (yyyymmdd, two-of-three required)
3. **Apply business rules** for any calculation changes:
   - 總箱數 = `Math.floor(總進貨數量 / 單箱數量)`
   - 列印張數 = `Math.ceil(總進貨數量 / 單箱數量)`
   - Scatter box condition: `總進貨數量 % 單箱數量 !== 0`
4. **Label layout** (11 cm x 8 cm per label):
   - Fields in order: 日翊品號 / 商品名稱 / 單箱入數 / 總進貨數 / 箱號 / 日期
   - Scatter box (last label): display "！！！此箱散貨箱請注意！！！"
   - Container must use `position: absolute` — never `position: fixed`
5. **Date validation** — call `isValidYYYYMMDD()` from `utils/date.ts`. At least two of
   the three date fields must be filled and valid before printing is allowed.
6. **Keyboard navigation** — Tab/Enter key order:
   品號 → 總進貨數量 → 製造日期 → 有效日期 → 保存期限
   Read-only fields use `tabIndex=-1` to be skipped.
7. **After printing** — call `createRecord()` (POST /api/print-records) with:
   `{ 品號, 品名, 列印數量: 總進貨數量 }` plus the authenticated user's username.
8. **Run type-check**: `cd frontend && npx tsc --noEmit`

## Validation Checklist

- [ ] 品號 blur triggers product lookup; fields are populated correctly
- [ ] 總箱數 is read-only and recomputes when 品號 or 總進貨數量 changes
- [ ] 列印張數 = `Math.ceil`, not `Math.floor`
- [ ] Scatter box banner appears on the last label when there is a remainder
- [ ] At least two of three date fields are filled before print is allowed
- [ ] Each date passes `isValidYYYYMMDD()` validation
- [ ] Label container uses `position: absolute` (verify with browser print preview)
- [ ] POST /api/print-records fires after the browser print dialog closes
- [ ] Read-only fields have `tabIndex=-1`
- [ ] `npx tsc --noEmit` reports zero errors

## Output

After completing changes, report:
- Which files were modified
- What business rule or UI behaviour was changed
- Result of `tsc --noEmit`
- Any edge cases handled (e.g. 單箱數量 = 0 guard, empty product lookup result)
