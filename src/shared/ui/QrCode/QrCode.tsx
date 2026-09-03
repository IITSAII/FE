import { useEffect, useRef } from "react";
import QRCodeStyling from "qr-code-styling";
import { cn } from "../../lib/utils";

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
      qrRef.current = new QRCodeStyling({
        width: size,
        height: size,
        data: url,
        margin: 0,
        qrOptions: { errorCorrectionLevel: "M" },
        dotsOptions: { color: dotsColor, type: "square" },
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
      dotsOptions: { color: dotsColor, type: "square" },
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
