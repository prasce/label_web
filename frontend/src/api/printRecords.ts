import client from './client';

export interface PrintRecord {
  id: number;
  品號: string;
  品名: string;
  列印數量: number;
  createtime: string;
  username: string;
}

export async function createPrintRecord(data: {
  品號: string;
  品名: string;
  列印數量: number;
}) {
  await client.post('/api/print-records', data);
}

export async function getPrintRecords(): Promise<PrintRecord[]> {
  const res = await client.get<PrintRecord[]>('/api/print-records');
  return res.data;
}
