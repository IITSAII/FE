import { PhotoFrame, type PhotoFrameTheme, type PhotoFilter } from "./PhotoFrame";
import { SvgFrame } from "./SvgFrame";
import { FRAME_CONFIGS, type FrameId } from "./frames";

export interface FrameRendererProps {
  frameId: FrameId;
  /** 업체 로고 테마 (로고 프레임에서만 쓰인다) */
  theme?: PhotoFrameTheme;
  photos?: (string | undefined | null)[];
  /** 관계 문구 (로고 프레임에서만 쓰인다) */
  relationship?: string;
  date?: string;
  qrCodeUrl?: string;
  filter?: PhotoFilter;
}

/**
 * 프레임 설정(frames.ts)에 맞는 프레임 컴포넌트를 그린다.
 * 미리보기(FrameStep)와 최종 캡처(LoadingStep)가 같은 결과를 내도록 둘 다 이 컴포넌트를 쓴다.
 */
export function FrameRenderer({
  frameId,
  theme,
  photos,
  relationship,
  date,
  qrCodeUrl,
  filter,
}: FrameRendererProps) {
  const config = FRAME_CONFIGS[frameId];

  if (config.kind === "svg") {
    return (
      <SvgFrame
        config={config}
        photos={photos}
        date={date}
        qrCodeUrl={qrCodeUrl}
        filter={filter}
      />
    );
  }

  return (
    <PhotoFrame
      palette={config.palette}
      theme={theme}
      photos={photos}
      relationship={relationship}
      date={date}
      qrCodeUrl={qrCodeUrl}
      filter={filter}
    />
  );
}
