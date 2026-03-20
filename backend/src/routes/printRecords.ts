import { FastifyInstance } from 'fastify';
import { sql, pool, poolConnect } from '../db/pool';
import { authMiddleware, JwtPayload } from '../middleware/auth';

export default async function printRecordRoutes(app: FastifyInstance) {

  // POST /api/print-records — 列印後寫入記錄
  app.post<{
    Body: { 品號: string; 品名: string; 列印數量: number }
  }>(
    '/',
    { preHandler: authMiddleware },
    async (request, reply) => {
      const user = (request as any).user as JwtPayload;
      const { 品號, 品名, 列印數量 } = request.body;

      if (!品號 || !列印數量) {
        return reply.status(400).send({ error: '品號與列印數量為必填' });
      }

      await poolConnect;
      await pool.request()
        .input('品號',     sql.NVarChar(50),  品號)
        .input('品名',     sql.NVarChar(200), 品名 || null)
        .input('列印數量', sql.Int,           列印數量)
        .input('username', sql.NVarChar(50),  user.username)
        .query('INSERT INTO print_records (品號, 品名, 列印數量, username) VALUES (@品號, @品名, @列印數量, @username)');

      return reply.status(201).send({ message: '列印記錄已儲存' });
    }
  );

  // GET /api/print-records — 查詢列印記錄
  app.get(
    '/',
    { preHandler: authMiddleware },
    async (_request, reply) => {
      await poolConnect;
      const result = await pool.request()
        .query(`
          SELECT TOP 500 id, 品號, 品名, 列印數量, createtime, username
          FROM print_records
          ORDER BY createtime DESC
        `);
      return reply.send(result.recordset);
    }
  );
}
