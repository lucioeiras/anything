export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  try {
    if (new URL(path).hostname === 'expo-sharing') {
      return '/handle-share';
    }
  } catch {
    // Ordinary relative paths are not absolute URLs.
  }
  return path;
}
