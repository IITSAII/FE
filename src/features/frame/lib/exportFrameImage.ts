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

/**
 * 화면 밖에 렌더링된 `PhotoFrame` DOM 노드를 PNG Blob으로 캡처한다.
 * `POST /print/final-image` 업로드에 그대로 사용된다.
 */
export async function exportFrameImage(node: HTMLElement): Promise<Blob> {
  await waitForImages(node);

  for (let attempt = 0; attempt <= CAPTURE_RETRY_COUNT; attempt++) {
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
