import { toBlob } from "html-to-image";

/**
 * 화면 밖에 렌더링된 `PhotoFrame` DOM 노드를 PNG Blob으로 캡처한다.
 * `POST /print/final-image` 업로드에 그대로 사용된다.
 */
export async function exportFrameImage(node: HTMLElement): Promise<Blob> {
  const blob = await toBlob(node, {
    pixelRatio: 1,
    cacheBust: true,
  });

  if (!blob) {
    throw new Error("프레임 이미지를 생성하지 못했습니다.");
  }

  return blob;
}
