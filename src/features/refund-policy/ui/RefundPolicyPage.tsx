import { useRouter } from "@tanstack/react-router";
import LeftChevronIcon from "../../../shared/assets/icons/LeftChevronIcon.svg?react";

interface RefundPolicySection {
  title: string;
  body: string[];
}

const LAST_UPDATED = "2026년 09월 08일";

const REFUND_POLICY_SECTIONS: RefundPolicySection[] = [
  {
    title: "기기 오작동 환불",
    body: [
      "결제 후 기기 오류로 사진이 출력되지 않았거나 촬영이 진행되지 않은 경우, 100% 환불해 드립니다.",
    ],
  },
  {
    title: "단순 변심",
    body: [
      "촬영이 정상적으로 진행되고 사진이 출력된 경우, 고객 단순 변심으로 인한 환불은 불가합니다.",
    ],
  },
  {
    title: "환불 신청 방법",
    body: [
      "환불이 필요하신 경우 촬영 시각, 결제 내역(카드 승인 문자 또는 영수증)을 확인 가능한 자료와 함께 고객센터로 문의해 주세요.",
    ],
  },
  {
    title: "환불 처리 기간",
    body: [
      "문의 접수 후 확인을 거쳐 영업일 기준 3~5일 이내 결제 수단으로 환불해 드립니다.",
    ],
  },
  {
    title: "환불 처리 기간",
    body: [
      "촬영 완료 후 사진 결과물(포즈, 표정, 밝기 등)에 대한 불만",
      "소품 파손 등 이용자 부주의로 인한 문제",
      "인쇄 완료 후 단순 변심",
    ],
  },
];

/** 푸터의 "환불 정책" 링크로 진입하는 환불 정책 안내 페이지. */
export function RefundPolicyPage() {
  const router = useRouter();

  return (
    <div className="w-full min-h-screen bg-iphone-background font-primary flex flex-col items-center">
      <main className="w-full max-w-[430px] mx-auto flex flex-col box-border gap-6">
        <div className="w-full flex items-center justify-center relative bg-iphone-background border-b border-gray-100 px-4.5 py-3">
          <button
            type="button"
            onClick={() => router.history.back()}
            aria-label="이전 화면으로 이동"
            className="absolute left-0"
          >
            <LeftChevronIcon className="w-6 h-6 text-gray-900" />
          </button>
          <p className="text-iphone-heading-2-medium text-black">환불 정책</p>
        </div>

        <div className="w-full bg-white px-6 pt-5 pb-8 flex flex-col gap-6">
          <div className="flex flex-col">
            <h1 className="text-iphone-heading-1-semibold text-black">
              환불 정책
            </h1>
            <p className="text-iphone-body-2-regular text-gray-400">
              최종 업데이트 : {LAST_UPDATED}
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {REFUND_POLICY_SECTIONS.map((section, index) => (
              <div key={index} className="flex flex-col gap-1">
                <p className="flex gap-1 text-iphone-heading-2-medium text-gray-800">
                  <span>{index + 1}.</span>
                  <span>{section.title}</span>
                </p>
                <div className="flex flex-col text-iphone-body-2-regular text-gray-700">
                  {section.body.map((line, lineIndex) => (
                    <div key={lineIndex} className="flex gap-2 ps-0.5">
                      <span
                        className="mt-[9px] size-0.75 shrink-0 rounded-full bg-current"
                        aria-hidden="true"
                      />
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
