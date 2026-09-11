import { createFileRoute, notFound } from "@tanstack/react-router";
import { IntroGalleryPage } from "../features/intro-gallery/ui/IntroGalleryPage";
import { decodeGalleryToken } from "../shared/lib/qrCode";

/**
 * 인화물 QR이 가리키는 단축 경로. `/intro/{galleryToken}`과 같은 화면을 보여주되,
 * galleryToken을 base36으로 압축해 담아 QR 모듈 수를 낮춘다(`buildGalleryUrl` 참고).
 *
 * 경로 세그먼트 없이 루트에 둔 이유는 글자 수 때문이다. 영숫자 모드 25x25 QR의 용량이
 * 47자인데 `/1/` 같은 세그먼트를 끼우면 정확히 47자가 되어 여유가 0이 된다.
 * 단축 토큰은 항상 25자의 `[0-9A-Z]`라 `/intro`, `/success` 같은 정적 경로와 겹치지
 * 않고, TanStack Router가 정적 경로를 동적 경로보다 먼저 매칭하므로 안전하다.
 *
 * 이미 인쇄되어 나간 QR을 위해 기존 `/intro/{galleryToken}` 경로도 그대로 유지한다.
 */
export const Route = createFileRoute("/$code")({
  beforeLoad: ({ params }) => {
    const galleryToken = decodeGalleryToken(params.code);
    // 단축 토큰이 아닌 경로는 이 라우트가 삼키지 않고 404로 넘긴다.
    if (!galleryToken) throw notFound();
    return { galleryToken };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { galleryToken } = Route.useRouteContext();
  return <IntroGalleryPage galleryToken={galleryToken} />;
}
