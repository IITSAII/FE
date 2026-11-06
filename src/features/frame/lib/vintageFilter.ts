// 시안의 빈티지(이미지 보정 + #000024 Exclusion)를 재현하는 색 변환이다. 피그마의 계산식은
// 공개돼 있지 않아, 시안 사진과 원본의 같은 위치 픽셀을 비교해 찾은 값이다.
// 변경하려면 시안을 새로 받아 다시 계산해야 한다. 원본 RGB(0~1)에 행렬을 곱한 뒤
// 채널별 곡선(0~1을 같은 간격으로 나눈 지점의 출력값)을 지난다.
const COLOR_MATRIX = [
  [1.0397, -0.0263, -0.0457],
  [0.0027, 1.0002, 0.012],
  [0.0147, 0.0849, 0.918],
];
const TONE_CURVES = [
  [0.0066, 0.0793, 0.1463, 0.2109, 0.2739, 0.356, 0.4382, 0.528, 0.6224,
    0.7198, 0.7964, 0.8743, 0.9196, 0.9563, 0.9891, 0.9996, 1],
  [0.0012, 0.0529, 0.1149, 0.1743, 0.2381, 0.3285, 0.4329, 0.5429, 0.6413,
    0.7228, 0.7774, 0.8342, 0.8753, 0.9156, 0.9429, 0.9674, 0.9935],
  [0.1543, 0.2096, 0.2569, 0.3016, 0.3571, 0.4407, 0.5503, 0.6123, 0.664,
    0.7047, 0.742, 0.7729, 0.7976, 0.8168, 0.8357, 0.852, 0.8585],
];

/**
 * 디자이너가 조절하는 보정값. 피그마 이미지 보정 슬라이더처럼 0이 "그대로"이고 대부분
 * -100~100 범위다(선명도는 0~200, 스무딩은 0~100). 피그마의 내부 계산식은 공개돼 있지
 * 않아 같은 이름의 보정을 비슷한 느낌으로 구현했으므로, 숫자가 피그마와 1:1로 같지는 않다.
 * 테스트 페이지(__lab)의 슬라이더로 맞춘 값을 아래 기본값에 옮겨 적으면 키오스크에 반영된다.
 */
/** 커브의 조절점. [입력, 출력], 둘 다 0~255. */
export type CurvePoint = [number, number];

/** 색상 보정 곡선. rgb는 세 채널 공통(밝기·대비), red/green/blue는 채널별 색 보정이다. */
export interface VintageCurves {
  rgb: CurvePoint[];
  red: CurvePoint[];
  green: CurvePoint[];
  blue: CurvePoint[];
}

/** 입력과 출력이 같은 직선(보정 없음). */
export const IDENTITY_CURVE: CurvePoint[] = [
  [0, 0],
  [255, 255],
];

export const IDENTITY_CURVES: VintageCurves = {
  rgb: IDENTITY_CURVE,
  red: IDENTITY_CURVE,
  green: IDENTITY_CURVE,
  blue: IDENTITY_CURVE,
};

export interface VintageAdjustments {
  /**
   * 출발점. curve: 시안을 맞춘 색 행렬·톤 곡선 위에 보정한다.
   * exclusion: 원본에 보정한 뒤 피그마처럼 #000024 Exclusion을 덮는다.
   * none: 빈티지 색감 없이 원본에 보정만 한다.
   */
  base: "curve" | "exclusion" | "none";
  /** 전체 밝기를 같은 비율로 올리거나 내린다. */
  exposure: number;
  /** 중간 회색을 기준으로 명암 폭을 벌리거나 좁힌다. */
  contrast: number;
  /** 색의 진하기. -100이면 흑백. */
  saturation: number;
  /** 양수면 따뜻하게(빨강↑ 파랑↓), 음수면 차갑게. */
  temperature: number;
  /** 양수면 마젠타 쪽(초록↓), 음수면 초록 쪽. */
  tint: number;
  /** 밝은 영역만 올리거나(양수) 내린다(음수). */
  highlights: number;
  /** 어두운 영역만 올리거나(양수) 내린다(음수). */
  shadows: number;
  /** 얼굴 음영 같은 넓은 명암(로컬 대비). 음수면 부드러워진다. */
  clarity: number;
  /** 가는 윤곽(속눈썹·머리카락)을 또렷하게 한다. */
  sharpness: number;
  /** 밝은 피부의 잔결을 정리한다. */
  smoothing: number;
  /** 색상 보정 곡선. 슬라이더 보정(과 Exclusion) 다음에 적용한다. */
  curves: VintageCurves;
}

export const DEFAULT_VINTAGE_ADJUSTMENTS: VintageAdjustments = {
  base: "exclusion",
  exposure: 54,
  contrast: -9,
  saturation: 3,
  temperature: -61,
  tint: 69,
  highlights: 43,
  shadows: 44,
  clarity: 0,
  sharpness: 0,
  smoothing: 0,
  curves: {
    rgb: [[0, 0], [172, 162], [255, 255]],
    red: [[0, 0], [73, 83], [255, 255]],
    green: [[0, 0], [146, 147], [255, 255]],
    blue: [[0, 0], [64, 83], [231, 218], [255, 255]],
  },
};

/** 피그마 Exclusion 레이어 색(#000024)의 0~1 값. */
const EXCLUSION_COLOR = [0, 0, 0x24 / 255];

/** 이 밝기(0~1) 위에서 하이라이트 보정이 켜진다. */
const HIGHLIGHTS_START = 0.5;
/** 이 밝기(0~1) 아래에서 그림자 보정이 켜진다. */
const SHADOWS_END = 0.5;

/** 스무딩 반경은 사진 크기에 비례한다. 사진 너비를 이 값으로 나눈다. */
const SMOOTHING_RADIUS_DIVISOR = 147;
/** 값이 클수록 윤곽까지 함께 뭉개진다. */
const SMOOTHING_EDGE_THRESHOLD = 0.0012;
/** 이 밝기(0~1) 구간에서 스무딩이 켜진다. 어두운 머리카락과 눈은 선명하게 둔다. */
const SMOOTHING_LUMINANCE_START = 0.3;
const SMOOTHING_LUMINANCE_END = 0.55;

/** 선명하게 할 윤곽의 굵기 기준. 사진 너비를 이 값으로 나눈 반경(최소 1px)을 쓴다. */
const SHARPNESS_RADIUS_DIVISOR = 600;

/** 명료도로 살릴 음영의 크기 기준. 사진 너비를 이 값으로 나눈 반경을 쓴다(1600px이면 32px). */
const CLARITY_RADIUS_DIVISOR = 50;
/** 이 밝기 구간 밖(아주 어두운 곳·아주 밝은 곳)은 명료도를 약하게 걸어 뭉개짐·날아감을 막는다. */
const CLARITY_SHADOW_PROTECT = 0.3;
const CLARITY_HIGHLIGHT_PROTECT = 0.8;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function smoothstep(start: number, end: number, value: number): number {
  const t = clamp01((value - start) / (end - start));
  return t * t * (3 - 2 * t);
}

function applyToneCurve(curve: number[], value: number): number {
  const position = clamp01(value) * (curve.length - 1);
  const index = Math.min(curve.length - 2, Math.floor(position));
  return curve[index] + (curve[index + 1] - curve[index]) * (position - index);
}

/** 가로·세로 평균 필터. 반경과 무관하게 픽셀 수에 비례하는 시간이 걸린다. */
function boxBlur(
  source: Float32Array,
  width: number,
  height: number,
  radius: number,
): Float32Array {
  const size = radius * 2 + 1;
  const horizontal = new Float32Array(source.length);
  const result = new Float32Array(source.length);

  for (let y = 0; y < height; y++) {
    const row = y * width;
    let sum = 0;
    for (let x = -radius; x <= radius; x++) {
      sum += source[row + Math.min(width - 1, Math.max(0, x))];
    }
    for (let x = 0; x < width; x++) {
      horizontal[row + x] = sum / size;
      sum +=
        source[row + Math.min(width - 1, x + radius + 1)] -
        source[row + Math.max(0, x - radius)];
    }
  }

  for (let x = 0; x < width; x++) {
    let sum = 0;
    for (let y = -radius; y <= radius; y++) {
      sum += horizontal[Math.min(height - 1, Math.max(0, y)) * width + x];
    }
    for (let y = 0; y < height; y++) {
      result[y * width + x] = sum / size;
      sum +=
        horizontal[Math.min(height - 1, y + radius + 1) * width + x] -
        horizontal[Math.max(0, y - radius) * width + x];
    }
  }

  return result;
}

function isIdentityCurve(points: CurvePoint[]): boolean {
  return points.every(([input, output]) => input === output);
}

/**
 * 조절점을 지나는 곡선을 0~255 입력마다 계산한 표(출력 0~1)를 만든다. 점 사이는 모노톤
 * 큐빅(Fritsch–Carlson)으로 이어, 부드럽지만 이웃한 점보다 위·아래로 튀어나가지 않는다.
 * 첫 점보다 왼쪽, 마지막 점보다 오른쪽은 그 점의 출력값으로 평평하게 둔다.
 */
export function buildCurveLut(points: CurvePoint[]): Float32Array {
  const sorted = [...points].sort((a, b) => a[0] - b[0]);
  const xs = sorted.map(([x]) => x);
  const ys = sorted.map(([, y]) => y);
  const count = xs.length;
  const lut = new Float32Array(256);

  const slopes: number[] = [];
  for (let i = 0; i < count - 1; i++) {
    slopes.push((ys[i + 1] - ys[i]) / Math.max(1e-6, xs[i + 1] - xs[i]));
  }
  const tangents = xs.map((_, i) => {
    if (i === 0) return slopes[0] ?? 0;
    if (i === count - 1) return slopes[count - 2] ?? 0;
    return slopes[i - 1] * slopes[i] <= 0 ? 0 : (slopes[i - 1] + slopes[i]) / 2;
  });
  for (let i = 0; i < count - 1; i++) {
    if (slopes[i] === 0) {
      tangents[i] = 0;
      tangents[i + 1] = 0;
      continue;
    }
    const a = tangents[i] / slopes[i];
    const b = tangents[i + 1] / slopes[i];
    const sum = a * a + b * b;
    if (sum > 9) {
      const scale = 3 / Math.sqrt(sum);
      tangents[i] = scale * a * slopes[i];
      tangents[i + 1] = scale * b * slopes[i];
    }
  }

  let segment = 0;
  for (let x = 0; x < 256; x++) {
    let y: number;
    if (count < 2 || x <= xs[0]) {
      y = ys[0] ?? x;
    } else if (x >= xs[count - 1]) {
      y = ys[count - 1];
    } else {
      while (segment < count - 2 && x > xs[segment + 1]) segment++;
      const h = xs[segment + 1] - xs[segment];
      const t = (x - xs[segment]) / h;
      const t2 = t * t;
      const t3 = t2 * t;
      y =
        (2 * t3 - 3 * t2 + 1) * ys[segment] +
        (t3 - 2 * t2 + t) * h * tangents[segment] +
        (-2 * t3 + 3 * t2) * ys[segment + 1] +
        (t3 - t2) * h * tangents[segment + 1];
    }
    lut[x] = clamp01(y / 255);
  }
  return lut;
}

/** rgb 곡선을 먼저, 채널 곡선을 나중에 지나는 채널별 표 3개. 모두 직선이면 null. */
function buildChannelLuts(curves: VintageCurves): Float32Array[] | null {
  const { rgb, red, green, blue } = curves;
  if ([rgb, red, green, blue].every(isIdentityCurve)) return null;

  const master = buildCurveLut(rgb);
  return [red, green, blue].map((channelPoints) => {
    const channel = buildCurveLut(channelPoints);
    const combined = new Float32Array(256);
    for (let x = 0; x < 256; x++) {
      combined[x] = channel[Math.round(master[x] * 255)];
    }
    return combined;
  });
}

/** 0~1 값을 표에서 찾는다. 이웃한 두 칸 사이는 직선으로 이어 계단이 생기지 않게 한다. */
function lookupCurve(lut: Float32Array, value: number): number {
  const position = clamp01(value) * 255;
  const index = Math.min(254, Math.floor(position));
  return lut[index] + (lut[index + 1] - lut[index]) * (position - index);
}

/** 픽셀별 밝기(0~1). */
function getLuminance(data: Uint8ClampedArray, pixelCount: number): Float32Array {
  const luminance = new Float32Array(pixelCount);
  for (let i = 0, p = 0; p < pixelCount; i += 4, p++) {
    luminance[p] =
      (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
  }
  return luminance;
}

/** 세 채널에 같은 값을 더한다(색은 유지하고 밝기만 바꾼다). */
function addToChannels(data: Uint8ClampedArray, i: number, offset: number): void {
  data[i] += offset;
  data[i + 1] += offset;
  data[i + 2] += offset;
}

/**
 * 윤곽은 두고 밝은 영역의 잔결만 정리한다(밝기 기준 guided filter). 단순 블러와 달리
 * 명암 차이가 큰 경계에서는 효과가 약해져 손가락과 입 윤곽이 뭉개지지 않는다.
 */
function smoothSkinTexture(imageData: ImageData, amount: number): void {
  if (amount <= 0) return;

  const { data, width, height } = imageData;
  const pixelCount = width * height;
  const radius = Math.max(1, Math.round(width / SMOOTHING_RADIUS_DIVISOR));

  const luminance = getLuminance(data, pixelCount);
  const luminanceSquared = new Float32Array(pixelCount);
  for (let p = 0; p < pixelCount; p++) {
    luminanceSquared[p] = luminance[p] * luminance[p];
  }

  const mean = boxBlur(luminance, width, height, radius);
  const meanSquared = boxBlur(luminanceSquared, width, height, radius);
  const edgeWeight = new Float32Array(pixelCount);
  const flatValue = new Float32Array(pixelCount);
  for (let p = 0; p < pixelCount; p++) {
    const variance = Math.max(0, meanSquared[p] - mean[p] * mean[p]);
    edgeWeight[p] = variance / (variance + SMOOTHING_EDGE_THRESHOLD);
    flatValue[p] = (1 - edgeWeight[p]) * mean[p];
  }

  const meanEdgeWeight = boxBlur(edgeWeight, width, height, radius);
  const meanFlatValue = boxBlur(flatValue, width, height, radius);
  for (let i = 0, p = 0; p < pixelCount; i += 4, p++) {
    const smoothed = meanEdgeWeight[p] * luminance[p] + meanFlatValue[p];
    const weight =
      smoothstep(
        SMOOTHING_LUMINANCE_START,
        SMOOTHING_LUMINANCE_END,
        luminance[p],
      ) * amount;
    addToChannels(data, i, (smoothed - luminance[p]) * weight * 255);
  }
}

/**
 * 밝기에서 넓은 주변 평균을 뺀 차이를 키워 세 채널에 같은 값으로 더한다(명료도).
 * 주변 평균은 그대로라 전체 밝기는 거의 변하지 않는다. 박스 블러를 두 번 겹쳐
 * 가우시안에 가깝게 만들어, 네모난 테두리 자국이 생기지 않게 한다.
 */
function applyClarity(imageData: ImageData, amount: number): void {
  if (amount === 0) return;

  const { data, width, height } = imageData;
  const pixelCount = width * height;
  const radius = Math.max(1, Math.round(width / CLARITY_RADIUS_DIVISOR / 2));

  const luminance = getLuminance(data, pixelCount);
  const surrounding = boxBlur(
    boxBlur(luminance, width, height, radius),
    width,
    height,
    radius,
  );
  for (let i = 0, p = 0; p < pixelCount; i += 4, p++) {
    const value = luminance[p];
    const midtoneWeight =
      smoothstep(0, CLARITY_SHADOW_PROTECT, value) *
      (1 - smoothstep(CLARITY_HIGHLIGHT_PROTECT, 1, value));
    addToChannels(
      data,
      i,
      (value - surrounding[p]) * amount * midtoneWeight * 255,
    );
  }
}

/** 밝기에서 좁은 주변 평균을 뺀 차이(윤곽)를 키워 세 채널에 더한다(언샤프 마스크). */
function sharpen(imageData: ImageData, amount: number): void {
  if (amount <= 0) return;

  const { data, width, height } = imageData;
  const pixelCount = width * height;
  const radius = Math.max(1, Math.round(width / SHARPNESS_RADIUS_DIVISOR));

  const luminance = getLuminance(data, pixelCount);
  const blurred = boxBlur(luminance, width, height, radius);
  for (let i = 0, p = 0; p < pixelCount; i += 4, p++) {
    addToChannels(data, i, (luminance[p] - blurred[p]) * amount * 255);
  }
}

/** 이미 캔버스에 그려진 `ImageData`에 빈티지 색 변환과 보정을 in-place 적용한다. */
export function applyVintageToImageData(
  imageData: ImageData,
  adjustments: VintageAdjustments = DEFAULT_VINTAGE_ADJUSTMENTS,
): void {
  const { data } = imageData;
  const [redRow, greenRow, blueRow] = COLOR_MATRIX;
  const [redCurve, greenCurve, blueCurve] = TONE_CURVES;

  const useCurve = adjustments.base === "curve";
  const useExclusion = adjustments.base === "exclusion";
  const exposure = 1 + adjustments.exposure / 200;
  const contrast = 1 + adjustments.contrast / 100;
  const saturation = 1 + adjustments.saturation / 100;
  const warmth = adjustments.temperature / 500;
  const tint = adjustments.tint / 500;
  const highlights = adjustments.highlights / 100;
  const shadows = adjustments.shadows / 100;
  const curveLuts = buildChannelLuts(adjustments.curves ?? IDENTITY_CURVES);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;

    let red = r;
    let green = g;
    let blue = b;
    if (useCurve) {
      red = applyToneCurve(
        redCurve,
        redRow[0] * r + redRow[1] * g + redRow[2] * b,
      );
      green = applyToneCurve(
        greenCurve,
        greenRow[0] * r + greenRow[1] * g + greenRow[2] * b,
      );
      blue = applyToneCurve(
        blueCurve,
        blueRow[0] * r + blueRow[1] * g + blueRow[2] * b,
      );
    }

    // 대비(중간 회색 기준) → 노출(곱) → 색온도·틴트
    red = exposure * ((red - 0.5) * contrast + 0.5) * (1 + warmth);
    green = exposure * ((green - 0.5) * contrast + 0.5) * (1 - tint);
    blue = exposure * ((blue - 0.5) * contrast + 0.5) * (1 - warmth);

    // 채도: 밝기는 두고 색만 회색 쪽으로 모으거나 벌린다.
    let luminance = 0.299 * red + 0.587 * green + 0.114 * blue;
    red = luminance + (red - luminance) * saturation;
    green = luminance + (green - luminance) * saturation;
    blue = luminance + (blue - luminance) * saturation;

    // 하이라이트·그림자: 해당 밝기 구간에서만 세 채널에 같은 값을 더한다(색 유지).
    // 올릴 때는 남은 여유(1 - 밝기)에 비례해 255에서 잘리지 않게 하고, 내릴 때는 밝기에 비례한다.
    const highlightWeight = smoothstep(HIGHLIGHTS_START, 1, luminance);
    const highlightLift =
      highlights *
      highlightWeight *
      (highlights > 0 ? Math.max(0, 1 - luminance) : luminance * 0.5);
    const shadowLift =
      shadows *
      (1 - smoothstep(0, SHADOWS_END, luminance)) *
      Math.max(0, luminance);
    luminance += highlightLift + shadowLift;
    red += highlightLift + shadowLift;
    green += highlightLift + shadowLift;
    blue += highlightLift + shadowLift;

    if (useExclusion) {
      // Exclusion: 결과 = 아래 + 위 - 2 × 아래 × 위
      red = red + EXCLUSION_COLOR[0] - 2 * red * EXCLUSION_COLOR[0];
      green = green + EXCLUSION_COLOR[1] - 2 * green * EXCLUSION_COLOR[1];
      blue = blue + EXCLUSION_COLOR[2] - 2 * blue * EXCLUSION_COLOR[2];
    }

    if (curveLuts) {
      red = lookupCurve(curveLuts[0], red);
      green = lookupCurve(curveLuts[1], green);
      blue = lookupCurve(curveLuts[2], blue);
    }

    // Uint8ClampedArray라 0~255 밖의 값은 자동으로 잘린다.
    data[i] = 255 * red;
    data[i + 1] = 255 * green;
    data[i + 2] = 255 * blue;
    // 알파(data[i + 3])는 그대로 둔다.
  }

  smoothSkinTexture(imageData, adjustments.smoothing / 100);
  // 넓은 음영(명료도)을 먼저 살리고, 그 위에 가는 윤곽(선명도)을 또렷하게 한다.
  applyClarity(imageData, adjustments.clarity / 100);
  sharpen(imageData, adjustments.sharpness / 100);
}

/**
 * 사진에 빈티지를 입힌 새 data URL을 만든다. 미리보기와 최종 캡처가 같은 이미지를 쓰므로
 * 화면과 인쇄물의 색이 같아지고, `ctx.filter`를 무시하는 Safari에서도 동일하게 동작한다.
 * `Array.map`에 바로 넘길 수 있도록 인자는 사진 하나만 받는다.
 */
export function applyVintageFilter(photoUrl: string): Promise<string> {
  return applyVintageFilterWith(photoUrl, DEFAULT_VINTAGE_ADJUSTMENTS);
}

/** 보정값을 직접 넘겨 빈티지를 입힌다(테스트 페이지 슬라이더용). */
export async function applyVintageFilterWith(
  photoUrl: string,
  adjustments: VintageAdjustments,
): Promise<string> {
  // 사진은 촬영 시 만든 data URL이다. iOS Safari에서 data URL에 crossOrigin을 붙이면
  // 로드가 실패하는 사례가 있어 지정하지 않는다.
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("빈티지 필터용 이미지 로드 실패"));
    img.src = photoUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("빈티지 필터용 2D 캔버스 컨텍스트를 생성하지 못했습니다.");
  }

  ctx.drawImage(image, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  applyVintageToImageData(imageData, adjustments);
  ctx.putImageData(imageData, 0, 0);

  return canvas.toDataURL("image/jpeg", 0.95);
}
