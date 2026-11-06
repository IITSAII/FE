import type { ComponentType, SVGProps } from "react";
import Logo from "../../assets/icons/Logo/Logo.svg?react";
import JobokColorIcon from "../../assets/icons/Logo/JobokColorIcon.svg?react";
import JobokMonoIcon from "../../assets/icons/Logo/JobokMonoIcon.svg?react";
import jobokColorUrl from "../../assets/frames/jobok_color.svg";
import jobokMonoUrl from "../../assets/frames/jobok_mono.svg";

/** 프레임 식별자. 백엔드 FrameType 값과 같다. */
export type FrameId = "DARK" | "LIGHT" | "IVORY" | "JobokPink" | "JobokDark";

/** PhotoFrame(코드로 그리는 프레임)의 색상 묶음. */
export interface PhotoFramePalette {
  /** 프레임 배경 + 로고/문구 색상 클래스 */
  rootClassName: string;
  /** 사진이 없을 때 보이는 사진 칸 배경 클래스 */
  photoSlotClassName: string;
  /** 로고 옆 구분선 색상 클래스 */
  dividerClassName: string;
  qrDotsColor: string;
  qrBackgroundColor: string;
}

export interface FrameSlotPosition {
  x: number;
  y: number;
}

/** 프레임 선택 버튼에 쓰는 썸네일. */
export interface FrameThumbnail {
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  iconClassName: string;
  /** 버튼 배경 클래스 */
  buttonClassName: string;
  /** 선택되지 않았을 때의 테두리 클래스 */
  unselectedBorderClassName: string;
}

interface BaseFrameConfig {
  id: FrameId;
  /** 선택 버튼의 접근성 라벨에 쓰는 이름 */
  label: string;
  thumbnail: FrameThumbnail;
}

/** 코드로 그리는 프레임(PhotoFrame). 업체 로고와 관계 문구가 들어간다. */
export interface LogoFrameConfig extends BaseFrameConfig {
  kind: "logo";
  palette: PhotoFramePalette;
}

/** 디자이너가 제공한 SVG를 사진 위에 겹치는 프레임(SvgFrame). 좌표는 600x1800 기준 px. */
export interface SvgFrameConfig extends BaseFrameConfig {
  kind: "svg";
  svgUrl: string;
  photoSlots: readonly FrameSlotPosition[];
  qr: FrameSlotPosition & {
    size: number;
    dotsColor: string;
    backgroundColor: string;
  };
  date: FrameSlotPosition & { color: string };
}

export type FrameConfig = LogoFrameConfig | SvgFrameConfig;

const JOBOK_PHOTO_SLOTS = [
  { x: 4, y: 4 },
  { x: 4, y: 353 },
  { x: 4, y: 702 },
  { x: 4, y: 1051 },
];

/** 객체에 적은 순서대로 프레임 선택 버튼이 표시된다. */
export const FRAME_CONFIGS: Record<FrameId, FrameConfig> = {
  DARK: {
    id: "DARK",
    kind: "logo",
    label: "다크",
    palette: {
      rootClassName: "bg-frame-dark text-white",
      photoSlotClassName: "bg-iphone-background",
      dividerClassName: "bg-iphone-background",
      qrDotsColor: "#000000",
      qrBackgroundColor: "#ffffff",
    },
    thumbnail: {
      Icon: Logo,
      iconClassName: "w-14.75 h-6 text-ipad-background",
      buttonClassName: "bg-frame-dark",
      unselectedBorderClassName: "border-transparent",
    },
  },
  LIGHT: {
    id: "LIGHT",
    kind: "logo",
    label: "라이트",
    palette: {
      rootClassName: "bg-frame-light text-green-500",
      photoSlotClassName: "bg-frame-dark",
      dividerClassName: "bg-green-500",
      qrDotsColor: "#4ca858",
      qrBackgroundColor: "#F9F5ED",
    },
    thumbnail: {
      Icon: Logo,
      iconClassName: "w-14.75 h-6 text-green-500",
      buttonClassName: "bg-frame-light",
      unselectedBorderClassName: "border-gray-400",
    },
  },
  IVORY: {
    id: "IVORY",
    kind: "logo",
    label: "아이보리",
    palette: {
      rootClassName: "bg-frame-light text-frame-ink",
      photoSlotClassName: "bg-frame-ink",
      dividerClassName: "bg-frame-ink",
      qrDotsColor: "#000000",
      qrBackgroundColor: "#F9F5ED",
    },
    thumbnail: {
      Icon: Logo,
      iconClassName: "w-14.75 h-6 text-frame-ink",
      buttonClassName: "bg-frame-light",
      unselectedBorderClassName: "border-gray-400",
    },
  },
  JobokPink: {
    id: "JobokPink",
    kind: "svg",
    label: "조복 컬러",
    svgUrl: jobokColorUrl,
    photoSlots: JOBOK_PHOTO_SLOTS,
    qr: {
      x: 515,
      y: 1317,
      size: 73,
      dotsColor: "#3D1808",
      backgroundColor: "#FFBEBE",
    },
    date: { x: 361, y: 1688, color: "#3D1808" },
    thumbnail: {
      Icon: JobokColorIcon,
      iconClassName: "h-14 w-auto",
      buttonClassName: "bg-white",
      unselectedBorderClassName: "border-gray-400",
    },
  },
  JobokDark: {
    id: "JobokDark",
    kind: "svg",
    label: "조복 흑백",
    svgUrl: jobokMonoUrl,
    photoSlots: JOBOK_PHOTO_SLOTS,
    qr: {
      x: 515,
      y: 1317,
      size: 73,
      dotsColor: "#000000",
      backgroundColor: "#FFFFFF",
    },
    date: { x: 361, y: 1688, color: "#000000" },
    thumbnail: {
      Icon: JobokMonoIcon,
      iconClassName: "h-14 w-auto",
      buttonClassName: "bg-white",
      unselectedBorderClassName: "border-gray-400",
    },
  },
};

export const FRAME_LIST: FrameConfig[] = Object.values(FRAME_CONFIGS);

export const DEFAULT_FRAME_ID: FrameId = "DARK";
