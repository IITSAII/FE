import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { decodeGalleryToken } from "../shared/lib/qrCode";

/**
 * 인화물 QR이 가리키는 단축 경로. galleryToken을 base36으로 압축해 담아 QR 모듈 수를
 * 낮추고(`buildGalleryUrl` 참고), 진입 즉시 `/intro/{galleryToken}`으로 리다이렉트한다.
 *
 * 화면을 여기서 직접 렌더링하지 않는 이유: 전역 `Header`는 URL 파라미터의 galleryToken으로
 * 사진 저장 아이콘 노출을, `/intro` 경로 여부로 모바일 스타일을 결정한다. 단축 경로에는
 * 둘 다 없어서 QR로 처음 들어오면 아이콘이 안 뜨고 헤더 스타일도 달라졌다. 주소를 기존
 * 경로로 통일해 헤더·뒤로가기·위치 보기가 모두 같은 경로를 기준으로 동작하게 한다.
 *
 * 경로 세그먼트 없이 루트에 둔 이유는 글자 수 때문이다. 영숫자 모드 25x25 QR의 용량이
 * 47자인데 `/1/` 같은 세그먼트를 끼우면 정확히 47자가 되어 여유가 0이 된다.
 * 단축 토큰은 항상 25자의 `[0-9A-Z]`라 `/intro`, `/success` 같은 정적 경로와 겹치지
 * 않고, TanStack Router가 정적 경로를 동적 경로보다 먼저 매칭하므로 안전하다.
 */
export const Route = createFileRoute("/$code")({
  beforeLoad: ({ params }) => {
    const galleryToken = decodeGalleryToken(params.code);
    // 단축 토큰이 아닌 경로는 이 라우트가 삼키지 않고 404로 넘긴다.
    if (!galleryToken) throw notFound();
    // 단축 주소가 방문 기록에 남지 않도록 replace한다(뒤로가기 시 다시 리다이렉트되는 루프 방지).
    throw redirect({
      to: "/intro/$galleryToken",
      params: { galleryToken },
      replace: true,
    });
  },
});
