import { useEffect, useRef } from "react";
import QRCodeStyling from "qr-code-styling";
import { cn } from "../../lib/utils";

/** QR 패턴과 배경 테두리 사이 여백(px) */
const QR_MARGIN = 4;

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

    if (!qrRef.current) {
      // margin은 QR 패턴과 배경 테두리 사이 여백(px)이고, roundSize는 도트 한 변을
      // 내림할지 여부다. roundSize 기본값(true)은 Math.floor(가용크기 / 모듈수)로
      // 내림해서 나누어  떨어지지 않으면 남은 픽셀이 통째로 여백이 되어버린다
      // (73px / 25모듈 → 도트 2px, 50px만 쓰고 23px이 여백). false로 두면 소수점
      // 도트 크기를 그대로 써서 여백이 margin 값과 정확히 일치한다.
      qrRef.current = new QRCodeStyling({
        width: size,
        height: size,
        data: url,
        margin: QR_MARGIN,
        qrOptions: { errorCorrectionLevel: "M" },
        dotsOptions: { color: dotsColor, type: "square", roundSize: false },
        backgroundOptions: { color: backgroundColor },
      });
      containerRef.current.innerHTML = "";
      qrRef.current.append(containerRef.current);
      return;
    }

    qrRef.current.update({
      width: size,
      height: size,
      data: url,
      margin: QR_MARGIN,
      dotsOptions: { color: dotsColor, type: "square", roundSize: false },
      backgroundOptions: { color: backgroundColor },
    });
  }, [url, size, dotsColor, backgroundColor]);

  return (
    <div
      ref={containerRef}
      className={cn("inline-flex shrink-0 leading-none", className)}
      style={{ width: size, height: size }}
    />
  );
}
