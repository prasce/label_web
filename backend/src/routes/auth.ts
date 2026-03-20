import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { sql, pool, poolConnect } from '../db/pool';

const SALT_ROUNDS = 12;

export default async function authRoutes(app: FastifyInstance) {

  // POST /api/auth/login
  app.post<{
    Body: { username: string; password: string }
  }>('/login', async (request, reply) => {
    const { username, password } = request.body;

    if (!username || !password) {
      return reply.status(400).send({ error: '帳號與密碼為必填' });
    }

    await poolConnect;
    const result = await pool.request()
      .input('username', sql.NVarChar(50), username)
      .query('SELECT id, username, password FROM users WHERE username = @username');

    if (!result.recordset || result.recordset.length === 0) {
      return reply.status(401).send({ error: '帳號或密碼錯誤' });
    }

    const user = result.recordset[0];
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

  // POST /api/auth/register
  app.post<{
    Body: { username: string; password: string }
  }>('/register', async (request, reply) => {
    const { username, password } = request.body;

    if (!username || !password) {
      return reply.status(400).send({ error: '帳號與密碼為必填' });
    }
    if (username.length > 50) {
      return reply.status(400).send({ error: '帳號長度不可超過 50 字元' });
    }
    if (password.length < 6) {
      return reply.status(400).send({ error: '密碼長度至少 6 字元' });
    }

    await poolConnect;

    // 檢查帳號是否已存在
    const check = await pool.request()
      .input('username', sql.NVarChar(50), username)
      .query('SELECT id FROM users WHERE username = @username');

    if (check.recordset.length > 0) {
      return reply.status(409).send({ error: '此帳號已被使用' });
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);

    await pool.request()
      .input('username', sql.NVarChar(50), username)
      .input('password', sql.NVarChar(255), hashed)
      .query('INSERT INTO users (username, password) VALUES (@username, @password)');

    return reply.status(201).send({ message: '註冊成功' });
  });
}
