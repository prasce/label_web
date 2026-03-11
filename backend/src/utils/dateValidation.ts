/**
 * 驗證 yyyymmdd 格式是否為合法日期
 */
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
