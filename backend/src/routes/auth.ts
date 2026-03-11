import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db/pool';

export default async function authRoutes(app: FastifyInstance) {

  // POST /api/auth/login
  app.post<{
    Body: { username: string; password: string }
  }>('/login', async (request, reply) => {
    const { username, password } = request.body;

    if (!username || !password) {
      return reply.status(400).send({ error: '帳號與密碼為必填' });
    }

    const result = await pool.query(
      'SELECT id, username, password FROM users WHERE username = $1',
      [username]
    );

    if (!result.rowCount || result.rowCount === 0) {
      return reply.status(401).send({ error: '帳號或密碼錯誤' });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return reply.status(401).send({ error: '帳號或密碼錯誤' });
    }

    const expiresIn = (process.env.JWT_EXPIRES_IN || '8h') as jwt.SignOptions['expiresIn'];
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET as string,
      { expiresIn }
    );

    return reply.send({ token, username: user.username });
  });
}
