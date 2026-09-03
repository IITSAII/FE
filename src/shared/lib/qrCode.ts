/** QR 코드가 가리키는 프레임 다운로드 갤러리 페이지 URL을 만든다. */
export function buildGalleryUrl(sessionId: string): string {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/intro/${sessionId}`;
}
