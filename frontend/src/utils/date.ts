export function isValidYYYYMMDD(dateStr: string): boolean {
  if (!/^\d{8}$/.test(dateStr)) return false;
  const year  = parseInt(dateStr.substring(0, 4), 10);
  const month = parseInt(dateStr.substring(4, 6), 10);
  const day   = parseInt(dateStr.substring(6, 8), 10);
  const date  = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth()    === month - 1 &&
    date.getDate()     === day
  );
}

export function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('zh-TW', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}
