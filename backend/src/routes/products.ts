import { FastifyInstance } from 'fastify';
import { MultipartFile } from '@fastify/multipart';
import ExcelJS from 'exceljs';
import pool from '../db/pool';
import { authMiddleware, JwtPayload } from '../middleware/auth';

export default async function productRoutes(app: FastifyInstance) {

  // GET /api/products/:品號 — 回查商品主檔（列印頁使用）
  app.get<{ Params: { 品號: string } }>(
    '/:品號',
    { preHandler: authMiddleware },
    async (request, reply) => {
      const { 品號 } = request.params;
      const result = await pool.query(
        'SELECT 品號, 對照號, 品名, 單箱數量 FROM products WHERE 品號 = $1',
        [品號]
      );
      if (result.rowCount === 0) {
        return reply.status(404).send({ error: '查無此品號' });
      }
      return reply.send(result.rows[0]);
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
          單箱數量: Number(row.getCell(5).value) || null,
        });
      });

      let success = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const row of rows) {
        if (!row.品號 || !row.品名) {
          failed++;
          errors.push(`品號「${row.品號 || '空白'}」缺少必填欄位`);
          continue;
        }
        try {
          await pool.query(
            `INSERT INTO products (品號, 對照號, 品名, 單箱數量, updated_by)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (品號) DO UPDATE SET
               對照號    = EXCLUDED.對照號,
               品名      = EXCLUDED.品名,
               單箱數量  = EXCLUDED.單箱數量,
               updated_by = EXCLUDED.updated_by`,
            [row.品號, row.對照號 || null, row.品名, row.單箱數量, user.username]
          );
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
