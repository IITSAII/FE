/** QR에 담는 단축 토큰의 고정 길이. UUID 128비트는 base36으로 항상 25자에 담긴다. */
const SHORT_TOKEN_LENGTH = 25;

/** 표준 UUID(하이픈 8-4-4-4-12) 형식. */
const UUID_PATTERN =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/** 단축 토큰 형식. QR 영숫자 모드를 타려면 대문자와 숫자만 허용해야 한다. */
const SHORT_TOKEN_PATTERN = new RegExp(`^[0-9A-Z]{${SHORT_TOKEN_LENGTH}}$`);

/**
 * UUID(128비트)를 25자 대문자 base36 문자열로 압축한다.
 *
 * 대문자와 숫자만 쓰는 이유는 `qr-code-styling`이 데이터를 보고 인코딩 모드를 자동으로
 * 고르기 때문이다. 소문자가 하나라도 섞이면 Byte 모드(8비트/자)로 떨어지고, 전부
 * 대문자·숫자·허용기호면 Alphanumeric 모드(5.5비트/자)가 걸린다. 하이픈 UUID 36자는
 * Byte 모드에서 288비트를 먹지만 base36 25자는 영숫자 모드에서 137비트만 먹는다.
 */
export function encodeGalleryToken(uuid: string): string {
  let value = 0n;
  for (const char of uuid.replace(/-/g, "")) {
    value = value * 16n + BigInt(parseInt(char, 16));
  }
  return value.toString(36).toUpperCase().padStart(SHORT_TOKEN_LENGTH, "0");
}

/**
 * `encodeGalleryToken`이 만든 단축 토큰을 표준 UUID로 되돌린다.
 * 형식이 맞지 않거나 128비트 범위를 벗어나면 `null`을 준다.
 */
export function decodeGalleryToken(code: string): string | null {
  const normalized = code.toUpperCase();
  if (!SHORT_TOKEN_PATTERN.test(normalized)) return null;

  let value = 0n;
  for (const char of normalized) {
    const digit = parseInt(char, 36);
    if (Number.isNaN(digit)) return null;
    value = value * 36n + BigInt(digit);
  }

  // 25자 base36의 표현 범위(36^25)가 128비트보다 넓어서, UUID로 환원되지 않는
  // 입력이 존재한다. 16진수 32자를 넘기면 그런 경우다.
  const hex = value.toString(16).padStart(32, "0");
  if (hex.length !== 32) return null;

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join("-");
}

/**
 * QR 코드가 가리키는 갤러리(매거진/쿠폰) 페이지 URL을 만든다.
 * sessionId가 아니라 galleryToken을 사용한다 — 사진 열람은 촬영 후 24시간이면 만료되지만,
 * 갤러리(매거진/쿠폰) 접속 자체는 galleryToken으로 만료 없이 계속 가능해야 하기 때문이다.
 *
 * 인화물의 QR 자리가 73px(약 6mm)로 고정이라 모듈 하나가 0.2mm 아래로 내려가 인쇄 시
 * 서로 뭉개진다. 모듈 수를 줄이는 유일한 방법이 URL을 짧게 만드는 것이라, 토큰을
 * base36으로 압축하고 전체를 대문자로 올려 영숫자 모드를 태운다. 스킴과 호스트는
 * RFC 3986상 대소문자를 구분하지 않으므로 대문자로 올려도 그대로 동작한다.
 */
export function buildGalleryUrl(galleryToken: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  // FrameStep 미리보기는 galleryToken 대신 sessionId(UUID가 아닌 문자열)를 넘긴다.
  // 압축할 수 없는 값은 기존 긴 경로로 그대로 흘려보낸다.
  if (!UUID_PATTERN.test(galleryToken)) {
    return `${origin}/intro/${galleryToken}`;
  }

  return `${origin.toUpperCase()}/${encodeGalleryToken(galleryToken)}`;
}
