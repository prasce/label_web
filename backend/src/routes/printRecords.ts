import { FastifyInstance } from 'fastify';
import pool from '../db/pool';
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

      await pool.query(
        'INSERT INTO print_records (品號, 品名, 列印數量, username) VALUES ($1, $2, $3, $4)',
        [品號, 品名 || null, 列印數量, user.username]
      );

      return reply.status(201).send({ message: '列印記錄已儲存' });
    }
  );

  // GET /api/print-records — 查詢列印記錄
  app.get(
    '/',
    { preHandler: authMiddleware },
    async (_request, reply) => {
      const result = await pool.query(
        `SELECT id, 品號, 品名, 列印數量, createtime, username
         FROM print_records
         ORDER BY createtime DESC
         LIMIT 500`
      );
      return reply.send(result.rows);
    }
  );
}
