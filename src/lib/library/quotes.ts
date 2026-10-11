export function isQuoteText(text: string): boolean {
  const trimmed = text.trim();
  return (
    (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) ||
    (trimmed.startsWith('“') && trimmed.endsWith('”') && trimmed.length >= 2)
  );
}
