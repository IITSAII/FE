/**
 * GA4 이벤트 전송. 측정 ID(`VITE_GA_MEASUREMENT_ID`)가 없으면 아무것도 보내지 않는다.
 *
 * 갤러리 주소(`/intro/{galleryToken}`, `/{code}`)의 토큰은 손님 사진에 접근하는 키라
 * GA로 보내면 안 된다. GA는 모든 이벤트에 현재 주소(page_location)를 자동으로 붙이므로,
 * 자동 페이지뷰를 끄고 주소를 직접 정리해서 덮어쓴다. 결제 키·주문번호가 담긴 쿼리도 버린다.
 */
const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as
  | string
  | undefined;

/** 키오스크에서 손님 한 명의 흐름을 묶는 ID. 결제 후 토스 리다이렉트로 새로고침돼도 유지한다. */
const FLOW_ID_STORAGE_KEY = "analytics_flow_id";

type EventParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** 첫 번째 경로가 이 중 하나가 아니면 QR 단축 주소(`/{code}`)다. */
const STATIC_ROOT_SEGMENTS = new Set([
  "",
  "intro",
  "success",
  "fail",
  "refund-policy",
  "test",
]);

/** 토큰이 들어가는 경로 조각을 이름으로 바꾼다. 예: `/intro/abc/download` → `/intro/:token/download` */
export function sanitizePath(pathname: string): string {
  const segments = pathname.split("/");
  const [, first, second] = segments;

  if (first === "intro" && second && second !== "location") {
    segments[2] = ":token";
  } else if (!STATIC_ROOT_SEGMENTS.has(first ?? "")) {
    segments[1] = ":code";
  }

  return segments.join("/");
}

function isMobilePath(path: string): boolean {
  return path.startsWith("/intro") || path.startsWith("/:code");
}

function gtag(...args: unknown[]): void {
  window.gtag?.(...args);
}

export function initAnalytics(): void {
  if (!MEASUREMENT_ID || typeof window === "undefined" || window.gtag) return;

  window.dataLayer = window.dataLayer ?? [];
  window.gtag = function gtagShim() {
    // gtag.js는 배열이 아니라 arguments 객체 형태를 기대한다.
    window.dataLayer?.push(arguments);
  };

  const path = sanitizePath(window.location.pathname);
  gtag("js", new Date());
  gtag("config", MEASUREMENT_ID, {
    send_page_view: false,
    page_location: window.location.origin + path,
    page_referrer: "",
  });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);
}

/** 라우트 이동마다 호출한다. 이후 이벤트의 page_location도 정리된 주소로 바뀐다. */
export function trackPageView(pathname: string): void {
  if (!MEASUREMENT_ID) return;

  const path = sanitizePath(pathname);
  gtag("set", {
    page_location: window.location.origin + path,
    page_referrer: "",
  });
  gtag("event", "page_view", {
    page_path: path,
    surface: isMobilePath(path) ? "mobile" : "kiosk",
  });
}

function readFlowId(): string | undefined {
  try {
    return sessionStorage.getItem(FLOW_ID_STORAGE_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

/** 키오스크에서 손님이 시작 화면을 누를 때 새 흐름 ID를 만든다. */
export function startAnalyticsFlow(): void {
  try {
    sessionStorage.setItem(FLOW_ID_STORAGE_KEY, crypto.randomUUID());
  } catch {
    // 저장소를 쓸 수 없으면 흐름 ID 없이 보낸다.
  }
  trackEvent("flow_start");
}

/** 처음으로 돌아갈 때 흐름 ID를 지워, 다음 손님의 이벤트와 섞이지 않게 한다. */
export function endAnalyticsFlow(): void {
  try {
    sessionStorage.removeItem(FLOW_ID_STORAGE_KEY);
  } catch {
    // 무시한다.
  }
}

export function trackEvent(name: string, params: EventParams = {}): void {
  if (!MEASUREMENT_ID) return;

  const mobile = isMobilePath(sanitizePath(window.location.pathname));
  gtag("event", name, {
    ...params,
    surface: mobile ? "mobile" : "kiosk",
    ...(mobile ? {} : { flow_id: readFlowId() }),
  });
}
