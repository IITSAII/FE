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

/** 스무딩 반경은 사진 크기에 비례한다. 사진 너비를 이 값으로 나눈다. */
const SMOOTHING_RADIUS_DIVISOR = 147;
/** 값이 클수록 윤곽까지 함께 뭉개진다. */
const SMOOTHING_EDGE_THRESHOLD = 0.0012;
const SMOOTHING_AMOUNT = 0.15;
/** 이 밝기(0~1) 구간에서 스무딩이 켜진다. 어두운 머리카락과 눈은 선명하게 둔다. */
const SMOOTHING_LUMINANCE_START = 0.3;
const SMOOTHING_LUMINANCE_END = 0.55;

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

/**
 * 윤곽은 두고 밝은 영역의 잔결만 정리한다(밝기 기준 guided filter). 단순 블러와 달리
 * 명암 차이가 큰 경계에서는 효과가 약해져 손가락과 입 윤곽이 뭉개지지 않는다.
 */
function smoothSkinTexture(imageData: ImageData): void {
  const { data, width, height } = imageData;
  const pixelCount = width * height;
  const radius = Math.max(1, Math.round(width / SMOOTHING_RADIUS_DIVISOR));

  const luminance = new Float32Array(pixelCount);
  const luminanceSquared = new Float32Array(pixelCount);
  for (let i = 0, p = 0; p < pixelCount; i += 4, p++) {
    const value =
      (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
    luminance[p] = value;
    luminanceSquared[p] = value * value;
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
    const amount =
      smoothstep(
        SMOOTHING_LUMINANCE_START,
        SMOOTHING_LUMINANCE_END,
        luminance[p],
      ) * SMOOTHING_AMOUNT;
    const offset = (smoothed - luminance[p]) * amount * 255;
    data[i] += offset;
    data[i + 1] += offset;
    data[i + 2] += offset;
  }
}

/** 이미 캔버스에 그려진 `ImageData`에 빈티지 색 변환과 스무딩을 in-place 적용한다. */
export function applyVintageToImageData(imageData: ImageData): void {
  const { data } = imageData;
  const [redRow, greenRow, blueRow] = COLOR_MATRIX;
  const [redCurve, greenCurve, blueCurve] = TONE_CURVES;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;

    data[i] =
      255 *
      applyToneCurve(redCurve, redRow[0] * r + redRow[1] * g + redRow[2] * b);
    data[i + 1] =
      255 *
      applyToneCurve(
        greenCurve,
        greenRow[0] * r + greenRow[1] * g + greenRow[2] * b,
      );
    data[i + 2] =
      255 *
      applyToneCurve(
        blueCurve,
        blueRow[0] * r + blueRow[1] * g + blueRow[2] * b,
      );
    // 알파(data[i + 3])는 그대로 둔다.
  }

  smoothSkinTexture(imageData);
}

/**
 * 사진에 빈티지를 입힌 새 data URL을 만든다. 미리보기와 최종 캡처가 같은 이미지를 쓰므로
 * 화면과 인쇄물의 색이 같아지고, `ctx.filter`를 무시하는 Safari에서도 동일하게 동작한다.
 */
export async function applyVintageFilter(photoUrl: string): Promise<string> {
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
  applyVintageToImageData(imageData);
  ctx.putImageData(imageData, 0, 0);

  return canvas.toDataURL("image/jpeg", 0.95);
}
