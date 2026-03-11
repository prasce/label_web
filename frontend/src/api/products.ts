import client from './client';

export interface Product {
  品號: string;
  對照號: string;
  品名: string;
  單箱數量: number;
}

export async function getProduct(品號: string): Promise<Product> {
  const res = await client.get<Product>(`/api/products/${encodeURIComponent(品號)}`);
  return res.data;
}

export async function uploadProducts(file: File) {
  const form = new FormData();
  form.append('file', file);
  const res = await client.post<{ success: number; failed: number; errors: string[] }>(
    '/api/products/batch',
    form
  );
  return res.data;
}
