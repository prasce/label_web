import client from './client';

export async function login(username: string, password: string) {
  const res = await client.post<{ token: string; username: string }>('/api/auth/login', {
    username,
    password,
  });
  return res.data;
}
