export function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function monthFromKey(key: string): Date {
  const [year, month] = key.split('-').map(Number);
  return new Date(year, month - 1, 1);
}
