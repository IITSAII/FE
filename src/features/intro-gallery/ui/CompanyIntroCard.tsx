import { cn } from "../../../shared/lib/utils";
import TeamBadgeIcon from "../../../shared/assets/icons/TeamBadgeIcon.svg?react";

export interface CompanyIntroContent {
  /** 카테고리 탭 id와 매칭되는 식별자 */
  id: string;
  /** 히어로 이미지 (opacity가 이미 적용된 파일) */
  heroImage: string;
  /** 히어로 타이틀 (줄바꿈 단위 배열) */
  titleLines: string[];
  /** 참여 팀원 이름 목록 */
  members: string[];
  /** 소개글 문단 목록 */
  paragraphs: string[];
}

export interface CompanyIntroCardProps {
  content: CompanyIntroContent;
  className?: string;
}

/**
 * 카테고리 탭에서 선택된 업체의 매거진형 소개글 카드 (CompanyIntroCard)
 * - 히어로 이미지(오버레이 이미 적용된 파일) + 타이틀/참여자 + 소개 문단으로 구성
 */
export function CompanyIntroCard({ content, className }: CompanyIntroCardProps) {
  const { heroImage, titleLines, members, paragraphs } = content;

  return (
    <article className={cn("w-full bg-white overflow-hidden", className)}>
      <div className="relative w-full h-47 overflow-hidden">
        <img
          src={heroImage}
          alt={titleLines.join(" ")}
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 px-6.25 py-5.25">
          <h2 className="text-white text-[18px] font-semibold leading-[1.5] tracking-[-0.45px] whitespace-pre-line">
            {titleLines.join("\n")}
          </h2>
          <div className="flex flex-wrap items-center gap-1.5">
            <TeamBadgeIcon className="size-4.5 shrink-0" />
            <div className="flex flex-wrap items-center gap-1.5 text-[#f7f7f7] text-[12px] tracking-[-0.3px]">
              {members.map((member) => (
                <span key={member}>{member}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-6.25 py-6 text-gray-600 text-[14px] leading-[1.5] tracking-[-0.35px] whitespace-pre-line">
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}
