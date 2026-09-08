/**
 * QR 코드가 가리키는 갤러리(매거진/쿠폰) 페이지 URL을 만든다.
 * sessionId가 아니라 galleryToken을 사용한다 — 사진 열람은 촬영 후 24시간이면 만료되지만,
 * 갤러리(매거진/쿠폰) 접속 자체는 galleryToken으로 만료 없이 계속 가능해야 하기 때문이다.
 */
export function buildGalleryUrl(galleryToken: string): string {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/intro/${galleryToken}`;
}
