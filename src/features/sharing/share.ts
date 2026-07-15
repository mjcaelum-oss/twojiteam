// 공유: 클립보드로 링크 복사 (백엔드/실공유 연동 전 목업 동작)
export async function copyShareLink(path: string): Promise<boolean> {
  const url = `${window.location.origin}${path}`;
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}
