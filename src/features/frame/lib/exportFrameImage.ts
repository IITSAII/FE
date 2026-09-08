import { toBlob } from "html-to-image";

/** 이미지 하나가 너무 느리게 로드될 때 캡처 전체가 무한정 멈추지 않도록 두는 상한(ms). */
const IMAGE_LOAD_TIMEOUT_MS = 8000;

/**
 * `toBlob`이 null을 반환했을 때(WebKit에서 foreignObject 래스터화 시점에
 * 자식 리소스가 아직 페인트되지 않아 발생하는 것으로 추정되는 일시적 실패)
 * 추가로 시도해볼 횟수. 최초 시도 포함 총 (1 + 재시도 횟수)번 시도한다.
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
 * 아직 로딩이 끝나지 않은 경우가 있다. 이 상태로 캡처하면 html-to-image의
 * toBlob이 (사진 조각 없이 blank canvas만 남아) null을 반환해 캡처가 실패한다.
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
 * `document.fonts.ready` + 이중 rAF 대기만으로는 WebKit에서 이 캔버스가 실제로 페인트되기
 * 전에 캡처가 이뤄지는 경우가 있어(사진/QR이 빈 채로 캡처됨), 짧은 간격으로 폴링해
 * 실제 픽셀/자식 노드가 생길 때까지 기다린다. 상한 시간 내 준비되지 않아도 캡처 자체를
 * 막지는 않는다(그 경우는 상위의 재시도 루프가 다음 시도에서 다시 기회를 준다).
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
 * 화면 밖에 렌더링된 `PhotoFrame` DOM 노드를 PNG Blob으로 캡처한다.
 * `POST /print/final-image` 업로드에 그대로 사용된다.
 */
export async function exportFrameImage(node: HTMLElement): Promise<Blob> {
  for (let attempt = 0; attempt <= CAPTURE_RETRY_COUNT; attempt++) {
    await waitForImages(node);
    await waitForCanvasesAndSvgs(node);

    const blob = await toBlob(node, {
      pixelRatio: 1,
      cacheBust: true,
    });

    if (blob) return blob;

    if (attempt < CAPTURE_RETRY_COUNT) {
      await delay(CAPTURE_RETRY_DELAY_MS);
    }
  }

  throw new Error("프레임 이미지를 생성하지 못했습니다.");
}
