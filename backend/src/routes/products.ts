import { FastifyInstance } from 'fastify';
import { MultipartFile } from '@fastify/multipart';
import ExcelJS from 'exceljs';
import { sql, pool, poolConnect } from '../db/pool';
import { authMiddleware, JwtPayload } from '../middleware/auth';

export default async function productRoutes(app: FastifyInstance) {

  // GET /api/products/:品號 — 回查商品主檔（列印頁使用）
  app.get<{ Params: { 品號: string } }>(
    '/:品號',
    { preHandler: authMiddleware },
    async (request, reply) => {
      const { 品號 } = request.params;
      await poolConnect;
      const result = await pool.request()
        .input('品號', sql.NVarChar(50), 品號)
        .query('SELECT 品號, 對照號, 品名, 單箱數量 FROM products WHERE 品號 = @品號');

      if (!result.recordset || result.recordset.length === 0) {
        return reply.status(404).send({ error: '查無此品號' });
      }
      return reply.send(result.recordset[0]);
    }
  );

  // POST /api/products/batch — Excel 批次上傳
  app.post(
    '/batch',
    { preHandler: authMiddleware },
    async (request, reply) => {
      const user = (request as any).user as JwtPayload;
      const data = await (request as any).file() as MultipartFile | undefined;

      if (!data) {
        return reply.status(400).send({ error: '請上傳 Excel 檔案' });
      }

      // 讀取 Excel
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.read(data.file as any);
      const worksheet = workbook.worksheets[0];

      const rows: any[] = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // 跳過標題列
        rows.push({
          品號:     row.getCell(1).text.trim(),
          對照號:   row.getCell(2).text.trim(),
          品名:     row.getCell(3).text.trim(),
          單箱數量: Number(row.getCell(4).value) || null,
        });
      });

      let success = 0;
      let failed = 0;
      const errors: string[] = [];

      await poolConnect;

      for (const row of rows) {
        if (!row.品號 || !row.品名) {
          failed++;
          errors.push(`品號「${row.品號 || '空白'}」缺少必填欄位`);
          continue;
        }
        try {
          await pool.request()
            .input('品號',     sql.NVarChar(50),  row.品號)
            .input('對照號',   sql.NVarChar(50),  row.對照號 || null)
            .input('品名',     sql.NVarChar(200), row.品名)
            .input('單箱數量', sql.Int,           row.單箱數量)
            .input('updated_by', sql.NVarChar(50), user.username)
            .query(`
              MERGE INTO products WITH (HOLDLOCK) AS target
              USING (VALUES (@品號)) AS source(品號) ON target.品號 = source.品號
              WHEN MATCHED THEN
                UPDATE SET
                  對照號    = @對照號,
                  品名      = @品名,
                  單箱數量  = @單箱數量,
                  updated_by = @updated_by
              WHEN NOT MATCHED THEN
                INSERT (品號, 對照號, 品名, 單箱數量, updated_by)
                VALUES (@品號, @對照號, @品名, @單箱數量, @updated_by);
            `);
          success++;
        } catch (err) {
          failed++;
          errors.push(`品號「${row.品號}」寫入失敗`);
        }
      }

      return reply.send({ success, failed, errors });
    }
  );
}
