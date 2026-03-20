# Skill: upload-product

## Description

Handles the Excel batch product upload feature. This covers parsing the uploaded
`.xlsx` / `.xls` file with exceljs, mapping columns to database fields, performing
a MSSQL MERGE (UPSERT) via the backend route, and surfacing the result on the
frontend upload page.

## Trigger

Use this skill when the user asks about or requests changes to:
- The upload page or file upload UX
- Excel column mapping or header row handling
- Backend batch upsert logic (MERGE INTO products)
- Success/failure count reporting
- The downloadable Excel template (`上傳範本.xlsx`)
- POST /api/products/batch behaviour

## Files to Read

Always read these files before making changes:

1. `frontend/src/pages/UploadPage.tsx` — upload UI (file picker, status display)
2. `frontend/src/api/products.ts` — `batchUpload()` call (POST /api/products/batch)
3. `backend/src/routes/products.ts` — batch upload route handler (exceljs + MERGE INTO)
4. `frontend/public/上傳範本.xlsx` — the template file users download (inspect column headers)
5. `backend/src/db/pool.ts` — MSSQL connection pool (for query patterns)

## Steps

1. **Read all files listed above** before writing any code.
2. **Understand the Excel column mapping** (row 1 is the header and is always skipped):
   - Column A (index 1) = 品號
   - Column B (index 2) = 對照號
   - Column C (index 3) = 品名
   - Column D (index 4) = 單箱數量
   - Do NOT shift to column E for 單箱數量 — always use `getCell(4)`.
3. **Backend parsing with exceljs**:
   - Load workbook: `new ExcelJS.Workbook()`, then `workbook.xlsx.load(buffer)`
   - Get first worksheet: `workbook.worksheets[0]`
   - Iterate rows starting at row 2 (`worksheet.eachRow` or manual slice)
   - Collect rows where 品號 is non-empty; skip rows with missing required fields (品名)
4. **UPSERT pattern (MSSQL)**:
   ```sql
   MERGE INTO products WITH (HOLDLOCK) AS target
   USING (VALUES (@品號, @對照號, @品名, @單箱數量)) AS source (品號, 對照號, 品名, 單箱數量)
   ON target.品號 = source.品號
   WHEN MATCHED THEN
     UPDATE SET 對照號 = source.對照號, 品名 = source.品名,
                單箱數量 = source.單箱數量, updated_by = @username
   WHEN NOT MATCHED THEN
     INSERT (品號, 對照號, 品名, 單箱數量, updated_by)
     VALUES (source.品號, source.對照號, source.品名, source.單箱數量, @username);
   ```
   Use named `@param` syntax — never string interpolation.
5. **Track success and failures**:
   - Wrap each row MERGE in a try/catch
   - Accumulate `successCount` and `failedRows: [{ rowNumber, 品號, reason }]`
6. **Frontend response handling** in `UploadPage.tsx`:
   - Display `successCount` inserted/updated
   - If `failedRows.length > 0`, show a table listing each failed row and reason
7. **Template download** — "下載上傳範本" button href points to `/上傳範本.xlsx`.
   Vite serves `public/` files at root; do not add an API endpoint for this.
8. **Run type-check**: `cd frontend && npx tsc --noEmit` and `cd backend && npx tsc --noEmit`

## Validation Checklist

- [ ] Row 1 (header) is skipped; data starts at row 2
- [ ] `getCell(4)` used for 單箱數量 (column D), not `getCell(5)`
- [ ] MERGE INTO uses `WITH (HOLDLOCK)` to prevent race conditions
- [ ] Named `@param` placeholders are used in all SQL — no string interpolation
- [ ] Rows with empty 品號 are skipped before attempting the DB insert
- [ ] Response body includes `{ successCount, failedRows }` with row numbers
- [ ] Frontend shows both the success count and the failed-row table
- [ ] `multipart/form-data` content type is correctly set on the Axios request
- [ ] Template download link is `/上傳範本.xlsx` (static, no API route needed)
- [ ] `tsc --noEmit` reports zero errors in both frontend and backend

## Output

After completing changes, report:
- Which files were modified
- Change summary (e.g. added new column, changed UPSERT condition)
- Result of `tsc --noEmit` for both frontend and backend
- Any validation or edge-case logic added (empty rows, non-numeric 單箱數量, etc.)
