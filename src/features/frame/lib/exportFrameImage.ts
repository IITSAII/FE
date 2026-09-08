import { toCanvas } from "html-to-image";

/** 이미지 하나가 너무 느리게 로드될 때 캡처 전체가 무한정 멈추지 않도록 두는 상한(ms). */
const IMAGE_LOAD_TIMEOUT_MS = 8000;

/**
 * 캡처 결과 캔버스에 사진이 patch되지 않은(비어있는) 경우 추가로 시도해볼 횟수.
 * 최초 시도 포함 총 (1 + 재시도 횟수)번 시도한다.
 */
const CAPTURE_RETRY_COUNT = 2;
/** 재시도 사이에 두는 대기 시간(ms). 다음 페인트/디코딩이 끝날 시간을 벌어준다. */
const CAPTURE_RETRY_DELAY_MS = 300;

/** QR 등 `<canvas>`/`<svg>`로 그려지는 요소가 실제로 페인트될 때까지 기다리는 폴링 상한(ms). */
const CANVAS_READY_TIMEOUT_MS = 3000;
/** 캔버스/SVG 준비 여부를 다시 확인하는 폴링 간격(ms). */
const CANVAS_READY_POLL_INTERVAL_MS = 50;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 캡처 대상 노드 안의 모든 `<img>`가 로드·디코딩까지 완료될 때까지 기다린다.
 * 사진(`photoUrl`)은 S3에서 받아오는 외부 이미지라 로컬 개발 환경보다 느린
 * 네트워크(키오스크 Wi-Fi 등)에서는 fonts.ready + rAF 대기만으로는 캡처 시점에
 * 아직 로딩이 끝나지 않은 경우가 있다.
 */
async function waitForImages(node: HTMLElement): Promise<void> {
  const images = Array.from(node.querySelectorAll("img"));

  await Promise.all(
    images.map((img) => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();

      return Promise.race([
        img.decode().catch(() => {}),
        new Promise<void>((resolve) =>
          setTimeout(resolve, IMAGE_LOAD_TIMEOUT_MS),
        ),
      ]);
    }),
  );
}

/** 캔버스에 실제로 픽셀이 그려졌는지(알파가 0이 아닌 픽셀이 하나라도 있는지) 확인한다. */
function isCanvasPainted(canvas: HTMLCanvasElement): boolean {
  if (canvas.width === 0 || canvas.height === 0) return false;

  const ctx = canvas.getContext("2d");
  if (!ctx) return false;

  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] !== 0) return true;
  }
  return false;
}

/**
 * 캡처 대상 노드 안의 `<canvas>`/`<svg>`가 실제로 콘텐츠를 그린 상태가 될 때까지 기다린다.
 * QR 코드(`QrCode` 컴포넌트, `qr-code-styling`)는 `<img>`가 아니라 `useEffect` 안에서
 * 컨테이너에 직접 `<canvas>`/`<svg>`를 append하는 방식이라 `waitForImages`의 대상이 아니다.
 */
async function waitForCanvasesAndSvgs(node: HTMLElement): Promise<void> {
  const deadline = Date.now() + CANVAS_READY_TIMEOUT_MS;

  async function isReady(): Promise<boolean> {
    const canvases = Array.from(node.querySelectorAll("canvas"));
    const svgs = Array.from(node.querySelectorAll("svg"));

    return (
      canvases.every(isCanvasPainted) &&
      svgs.every((svg) => svg.childElementCount > 0)
    );
  }

  while (!(await isReady()) && Date.now() < deadline) {
    await delay(CANVAS_READY_POLL_INTERVAL_MS);
  }
}

/**
 * `object-fit: cover`와 동일한 크롭 규칙으로 이미지를 그릴 좌표/크기를 계산한다.
 * (컨테이너보다 큰 쪽 기준으로 확대해 꽉 채우고, 넘치는 부분은 중앙 기준으로 잘라낸다.)
 */
function computeCoverRect(
  containerWidth: number,
  containerHeight: number,
  naturalWidth: number,
  naturalHeight: number,
): { x: number; y: number; width: number; height: number } {
  const scale = Math.max(
    containerWidth / naturalWidth,
    containerHeight / naturalHeight,
  );
  const width = naturalWidth * scale;
  const height = naturalHeight * scale;

  return {
    x: (containerWidth - width) / 2,
    y: (containerHeight - height) / 2,
    width,
    height,
  };
}

/**
 * `html-to-image`가 캡처한 캔버스 위에, DOM의 사진 `<img>` 요소들을 직접 `drawImage`로
 * 다시 그려 넣는다(patch).
 *
 * `html-to-image`는 DOM을 SVG로 직렬화해 `foreignObject`로 캔버스에 래스터화하는데,
 * 실기기(iOS Safari)에서 이 직렬화 과정이 `<img>` 요소(특히 `data:` URL +
 * `object-fit: cover` 조합)를 누락시키는 사례가 확인됐다(#74) — 사진이 `complete: true`,
 * 올바른 `naturalWidth/Height`로 완전히 로드돼 있어도 최종 캡처 결과물에는 비어있었다.
 * 반면 프레임 배경/텍스트/QR/SVG 장식 요소는 정상적으로 캡처됨이 확인되어, 사진만 이렇게
 * 네이티브 `drawImage`로 직접 patch한다 — `foreignObject` 직렬화를 거치지 않으므로
 * 이 WebKit 특화 버그를 우회한다.
 */
function patchPhotosOntoCanvas(
  node: HTMLElement,
  canvas: HTMLCanvasElement,
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const nodeRect = node.getBoundingClientRect();
  if (nodeRect.width === 0 || nodeRect.height === 0) return;

  const scaleX = canvas.width / nodeRect.width;
  const scaleY = canvas.height / nodeRect.height;

  const images = Array.from(node.querySelectorAll("img"));

  for (const img of images) {
    if (!img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) {
      continue;
    }

    const imgRect = img.getBoundingClientRect();
    const containerX = (imgRect.left - nodeRect.left) * scaleX;
    const containerY = (imgRect.top - nodeRect.top) * scaleY;
    const containerWidth = imgRect.width * scaleX;
    const containerHeight = imgRect.height * scaleY;
    if (containerWidth === 0 || containerHeight === 0) continue;

    const cover = computeCoverRect(
      containerWidth,
      containerHeight,
      img.naturalWidth,
      img.naturalHeight,
    );

    ctx.save();
    ctx.beginPath();
    ctx.rect(containerX, containerY, containerWidth, containerHeight);
    ctx.clip();

    // 사진에 grayscale 등 CSS filter 클래스가 적용돼 있으면 canvas에도 동일하게 반영한다.
    const cssFilter = window.getComputedStyle(img).filter;
    if (cssFilter && cssFilter !== "none") {
      ctx.filter = cssFilter;
    }

    ctx.drawImage(
      img,
      containerX + cover.x,
      containerY + cover.y,
      cover.width,
      cover.height,
    );

    ctx.restore();
  }
}

/**
 * 캡처 직전/직후 상태를 콘솔에 남긴다. #66/#69로도 iPad에서 사진 누락이 재현되어(#74)
 * canvas patch 방식으로 전환했는데, 이 수정이 실제 기기에서 효과가 있는지 확인하기
 * 위한 진단 로깅이다. 안정화되면 제거한다.
 */
function logCaptureDiagnostics(
  node: HTMLElement,
  attempt: number,
  blob: Blob | null,
): void {
  const images = Array.from(node.querySelectorAll("img")).map((img) => ({
    complete: img.complete,
    naturalWidth: img.naturalWidth,
    naturalHeight: img.naturalHeight,
  }));

  console.log(`[CAPTURE-DEBUG] attempt=${attempt}`, {
    images,
    blobSize: blob?.size ?? null,
  });
}

/**
 * 화면 밖에 렌더링된 `PhotoFrame` DOM 노드를 PNG Blob으로 캡처한다.
 * `POST /print/final-image` 업로드에 그대로 사용된다.
 */
export async function exportFrameImage(node: HTMLElement): Promise<Blob> {
  for (let attempt = 0; attempt <= CAPTURE_RETRY_COUNT; attempt++) {
    await waitForImages(node);
    await waitForCanvasesAndSvgs(node);

    const canvas = await toCanvas(node, {
      pixelRatio: 1,
      cacheBust: true,
    });

    patchPhotosOntoCanvas(node, canvas);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );

    logCaptureDiagnostics(node, attempt, blob);

    if (blob) return blob;

    if (attempt < CAPTURE_RETRY_COUNT) {
      await delay(CAPTURE_RETRY_DELAY_MS);
    }
  }

  throw new Error("프레임 이미지를 생성하지 못했습니다.");
}
