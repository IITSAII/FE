import { useEffect, useRef } from "react";
import QRCodeStyling from "qr-code-styling";
import { cn } from "../../lib/utils";

/** QR 패턴과 배경 테두리 사이 여백(px) */
const QR_MARGIN = 1;

/**
 * 내부 canvas를 표시 크기의 몇 배 해상도로 그릴지.
 * `qr-code-styling`은 canvas를 `width`×`height` 픽셀 그대로 만들기 때문에, 표시 크기로
 * 그리면 고밀도 화면에서 확대 보간되어 도트 경계가 뿌옇게 번지고, 인화용 캡처
 * (`exportFrameImage`)에서도 저해상도 원본을 늘려 그리게 된다. 크게 그린 뒤 CSS로
 * 표시 크기에 맞춰 줄인다. 인화용 캡처 배율이 이 값을 그대로 쓰므로, 캡처 시 QR이
 * 리샘플링 없이 1:1로 옮겨진다.
 */
export const QR_RENDER_SCALE = 3;

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

    // width/height/margin은 QR_RENDER_SCALE배 해상도 기준 값이고, 표시 크기는 컨테이너가
    // 정한다(canvas는 아래 className으로 컨테이너를 꽉 채운다).
    const renderSize = size * QR_RENDER_SCALE;
    const renderMargin = QR_MARGIN * QR_RENDER_SCALE;
    // 코드 패턴(데이터 모듈)은 원형 도트로, 모서리 파인더 패턴은 인식률을 위해 사각형으로 그린다.
    const patternOptions = {
      dotsOptions: { type: "dots", color: dotsColor, roundSize: false },
      cornersSquareOptions: { type: "square", color: dotsColor },
      cornersDotOptions: { type: "square", color: dotsColor },
    } as const;

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
        ...patternOptions,
        backgroundOptions: { color: backgroundColor },
      });
      // roundSize: false면 라이브러리가 SVG에 shape-rendering="crispEdges"를 붙이는데,
      // 원형 도트에 걸리면 안티앨리어싱 없이 계단 모양으로 깎인다. 캔버스로 옮기기 전에 떼어낸다.
      qrRef.current.applyExtension((svg) => {
        svg.removeAttribute("shape-rendering");
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
      ...patternOptions,
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
