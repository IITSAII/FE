import { useEffect, useRef } from "react";
import QRCodeStyling from "qr-code-styling";
import { cn } from "../../lib/utils";

/** QR 패턴과 배경 테두리 사이 여백(px) */
const QR_MARGIN = 1;

/**
 * 내부 canvas를 표시 크기의 몇 배 해상도로 그릴지.
 * `qr-code-styling`은 canvas를 `width`×`height` 픽셀 그대로 만들기 때문에, 표시 크기로
 * 그리면 고밀도 화면(iPad DPR 2 등)에서 브라우저가 비트맵을 확대 보간해 도트 경계가
 * 뿌옇게 번진다. 크게 그린 뒤 CSS로 표시 크기에 맞춰 줄여서 경계를 또렷하게 유지한다.
 */
const RENDER_SCALE = 4;

export interface QrCodeProps {
  /** QR 코드가 담을 URL */
  url: string;
  /** 정사각형 한 변 크기(px) */
  size?: number;
  /** 점(코드 패턴) 색상 */
  dotsColor?: string;
  /** 배경 색상 */
  backgroundColor?: string;
  className?: string;
}

/**
 * `qr-code-styling` 래퍼 컴포넌트.
 * - 색상/배경색/크기를 props로 조정할 수 있는 커스텀 QR 코드를 렌더링한다.
 */
export function QrCode({
  url,
  size = 120,
  dotsColor = "#000000",
  backgroundColor = "#ffffff",
  className,
}: QrCodeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<QRCodeStyling | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // width/height/margin은 RENDER_SCALE배 해상도 기준 값이고, 표시 크기는 컨테이너가
    // 정한다(canvas는 아래 className으로 컨테이너를 꽉 채운다).
    const renderSize = size * RENDER_SCALE;
    const renderMargin = QR_MARGIN * RENDER_SCALE;

    if (!qrRef.current) {
      // margin은 QR 패턴과 배경 테두리 사이 여백(px)이고, roundSize는 도트 한 변을
      // 내림할지 여부다. roundSize 기본값(true)은 Math.floor(가용크기 / 모듈수)로
      // 내림해서 나누어  떨어지지 않으면 남은 픽셀이 통째로 여백이 되어버린다
      // (73px / 25모듈 → 도트 2px, 50px만 쓰고 23px이 여백). false로 두면 소수점
      // 도트 크기를 그대로 써서 여백이 margin 값과 정확히 일치한다.
      qrRef.current = new QRCodeStyling({
        width: renderSize,
        height: renderSize,
        data: url,
        margin: renderMargin,
        qrOptions: { errorCorrectionLevel: "L" },
        dotsOptions: { color: dotsColor, type: "square", roundSize: false },
        backgroundOptions: { color: backgroundColor },
      });
      containerRef.current.innerHTML = "";
      qrRef.current.append(containerRef.current);
      return;
    }

    qrRef.current.update({
      width: renderSize,
      height: renderSize,
      data: url,
      margin: renderMargin,
      dotsOptions: { color: dotsColor, type: "square", roundSize: false },
      backgroundOptions: { color: backgroundColor },
    });
  }, [url, size, dotsColor, backgroundColor]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "inline-flex shrink-0 leading-none [&>canvas]:size-full",
        className,
      )}
      style={{ width: size, height: size }}
    />
  );
}
