/** 색상보정 파라미터 (노출/그림자/대비, 모두 -100~100 스케일). */
export interface ColorCorrectionOptions {
  exposure: number;
  shadow: number;
  contrast: number;
}

/** 요청된 촬영 사진 기본 색상보정값. */
export const DEFAULT_COLOR_CORRECTION: ColorCorrectionOptions = {
  exposure: 15,
  shadow: -21,
  contrast: 12,
};

/**
 * 픽셀 하나(0~255)에 노출/대비를 적용한다.
 * - 노출: 전체 밝기에 균일하게 더해지는 오프셋 (-100~100 → -255~255로 스케일).
 * - 대비: 128을 기준으로 벌리거나 좁히는 표준 대비 공식.
 */
function applyExposureAndContrast(
  value: number,
  exposureOffset: number,
  contrastFactor: number,
): number {
  const withExposure = value + exposureOffset;
  return contrastFactor * (withExposure - 128) + 128;
}

/**
 * 그림자 보정 가중치. 어두운 픽셀(휘도가 낮을수록)일수록 크게, 밝은 픽셀(휘도 ≥128)에는
 * 거의 영향을 주지 않도록 휘도 기준 선형 감쇠 곡선을 사용한다.
 * CSS filter로는 전체 밝기에만 균일 적용할 수 있어 어두운 영역만 선택 조정이 불가능했던
 * 한계를 해결하기 위해, 픽셀 단위로 휘도를 계산해 어두운 픽셀에만 가중치를 싣는다.
 */
function shadowWeight(luminance: number): number {
  const SHADOW_LUMINANCE_CEILING = 128;
  if (luminance >= SHADOW_LUMINANCE_CEILING) return 0;
  return 1 - luminance / SHADOW_LUMINANCE_CEILING;
}

function clamp255(value: number): number {
  return Math.min(255, Math.max(0, value));
}

/**
 * 이미 캔버스에 그려진 `ImageData`에 노출/그림자/대비를 픽셀 단위로 in-place 적용한다.
 * - 그림자는 픽셀별 휘도를 기준으로 어두운 영역에만 가중 적용되는 실제 픽셀 보정이다
 *   (CSS filter 근사치와 달리 밝은 영역은 거의 그대로 유지된다).
 * - 이미지를 새로 불러오지 않고 호출 측이 이미 가진 캔버스 컨텍스트를 그대로 활용하므로,
 *   촬영 캡처처럼 동기적으로(추가 네트워크/디코딩 대기 없이) 바로 적용해야 하는 경우에 쓴다.
 */
export function applyColorCorrectionToImageData(
  imageData: ImageData,
  { exposure, shadow, contrast }: ColorCorrectionOptions,
): void {
  const { data } = imageData;

  // 노출(-100~100) → 픽셀 오프셋(-255~255), 대비(-100~100) → 표준 대비 계수.
  const exposureOffset = (exposure / 100) * 255;
  const contrastPct = (contrast / 100) * 255;
  const contrastFactor =
    (259 * (contrastPct + 255)) / (255 * (259 - contrastPct));
  // 그림자(-100~100) → 어두운 픽셀에 실릴 최대 오프셋(-255~255).
  const shadowMaxOffset = (shadow / 100) * 255;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    const shadowOffset = shadowMaxOffset * shadowWeight(luminance);

    data[i] = clamp255(
      applyExposureAndContrast(r + shadowOffset, exposureOffset, contrastFactor),
    );
    data[i + 1] = clamp255(
      applyExposureAndContrast(g + shadowOffset, exposureOffset, contrastFactor),
    );
    data[i + 2] = clamp255(
      applyExposureAndContrast(b + shadowOffset, exposureOffset, contrastFactor),
    );
    // 알파(data[i + 3])는 그대로 둔다.
  }
}

/**
 * 이미지 URL을 불러와 색상보정을 픽셀 단위로 적용한 뒤, 결과를 data URL로 반환한다.
 * - 원본이 별도 오리진(S3 등)에서 서빙되는 경우 CORS(Access-Control-Allow-Origin)가
 *   허용돼 있어야 한다.
 * - 개발용 비교 도구(photo-filter-test)처럼 "이미지 URL만 갖고 있고 캔버스는 아직 없는"
 *   상황을 위한 진입점이다. 이미 캔버스가 있는 경우(촬영 캡처 등)는
 *   `applyColorCorrectionToImageData`를 직접 쓰는 편이 이미지 로드 왕복이 없어 더 빠르다.
 */
export async function applyColorCorrection(
  imageUrl: string,
  options: ColorCorrectionOptions,
): Promise<string> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new Error(`색상보정용 이미지 로드 실패: ${imageUrl}`));
    img.src = imageUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("색상보정용 2D 캔버스 컨텍스트를 생성하지 못했습니다.");
  }

  ctx.drawImage(image, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  applyColorCorrectionToImageData(imageData, options);
  ctx.putImageData(imageData, 0, 0);

  return canvas.toDataURL("image/jpeg", 0.92);
}

/**
 * 노출/그림자/대비를 CSS `filter`로 근사한 문자열을 만든다.
 * 픽셀 단위 보정(`applyColorCorrectionToImageData`)과 완전히 동일하지는 않지만
 * (그림자는 전체 밝기에 완화된 비중으로만 반영됨), 촬영 중 라이브 비디오 미리보기처럼
 * 매 프레임 픽셀 연산을 하기엔 비용이 큰 경우의 실시간 근사 미리보기용으로 쓴다.
 */
export function colorCorrectionCssFilter({
  exposure,
  shadow,
  contrast,
}: ColorCorrectionOptions): string {
  const SHADOW_PREVIEW_WEIGHT = 0.3;
  return `brightness(${100 + exposure + shadow * SHADOW_PREVIEW_WEIGHT}%) contrast(${100 + contrast}%)`;
}
