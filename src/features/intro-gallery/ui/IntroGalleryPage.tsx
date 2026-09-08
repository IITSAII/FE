import { useEffect, useState } from "react";
import {
  CategoryTabs,
  type CategoryTabItem,
} from "../../../shared/ui/CategoryTabs/CategoryTabs";
import { isApiError } from "../../../shared/lib/apiError";
import {
  getAssignedPartnerByGalleryToken,
  type AssignedPartner,
} from "../../partner-location/api/partnerApi";
import { PartnerToast } from "../../partner-location/ui/PartnerToast";
import { Modal } from "../../../shared/ui/Modal/Modal";
import { useModal } from "../../../shared/hooks/useModal";
import { CompanyIntroCard } from "./CompanyIntroCard";
import { CategoryLocationToast } from "./CategoryLocationToast";
import { COMPANY_INTRO_CONTENT } from "../lib/companyIntroContent";

const CATEGORIES: CategoryTabItem[] = [
  { id: "majuhada", name: "마주하다" },
  { id: "banjjak", name: "반짝" },
  { id: "overnook", name: "overnook" },
  { id: "itsai", name: "잇, 사이" },
  { id: "pichimothan", name: "피치못한" },
];

/**
 * 결제 확정 직후엔 배정이 아직 끝나지 않아 404(SESSION_404_2)가 날 수 있어 재시도한다.
 * TODO: galleryToken 기반 조회(`GET /gallery/{galleryToken}`)도 미배정 시 동일한
 * SESSION_404_2를 내려주는지 백엔드와 확인 필요 — 다르면 이 에러 코드 체크도 맞춰 수정.
 */
const PARTNER_FETCH_RETRY_DELAY_MS = 2000;
const PARTNER_FETCH_MAX_RETRIES = 5;

export interface IntroGalleryPageProps {
  /** QR로 진입한 `/intro/{galleryToken}`에서만 전달된다. 있을 때만 배정된 업체 토스트와 혜택 안내 모달을 보여준다. */
  galleryToken?: string;
}

/**
 * `/intro`(파라미터 없음)와 `/intro/{galleryToken}`(QR 진입)가 공유하는 매거진/브랜드 템플릿 갤러리 화면.
 */
export function IntroGalleryPage({ galleryToken }: IntroGalleryPageProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState("overnook");
  const [partner, setPartner] = useState<AssignedPartner | null>(null);
  const benefitModal = useModal();

  useEffect(() => {
    if (!galleryToken) return;

    setPartner(null);
    let isMounted = true;
    let retryTimer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();

    function fetchPartner(attempt: number) {
      getAssignedPartnerByGalleryToken(galleryToken!, controller.signal)
        .then((result) => {
          if (isMounted) {
            setPartner(result);
            benefitModal.openModal();
          }
        })
        .catch((err) => {
          if (isApiError(err) && err.code === "CANCELED") return;

          if (
            isMounted &&
            isApiError(err) &&
            err.code === "SESSION_404_2" &&
            attempt < PARTNER_FETCH_MAX_RETRIES
          ) {
            retryTimer = setTimeout(
              () => fetchPartner(attempt + 1),
              PARTNER_FETCH_RETRY_DELAY_MS,
            );
            return;
          }

          console.error("배정된 제휴업체 조회 실패:", err);
        });
    }

    fetchPartner(0);

    return () => {
      isMounted = false;
      clearTimeout(retryTimer);
      controller.abort();
    };
  }, [galleryToken, benefitModal.openModal]);

  return (
    <div className="w-full min-h-screen bg-iphone-background font-primary flex flex-col items-center">
      {/* 데스크톱 등 대형 화면 접근 시에도 모바일 너비(max-w-[430px])로 중앙 정렬 */}
      <main className="w-full max-w-[430px] mx-auto px-4.5 pt-16 pb-12 flex flex-col gap-4 box-border relative">
        {/* 카테고리 탭 영역 */}
        <div className="fixed top-15 inset-x-0 z-50 bg-iphone-background">
          <div className="w-full max-w-[430px] mx-auto">
            <CategoryTabs
              categories={CATEGORIES}
              selectedId={selectedCategoryId}
              onSelectCategory={(id) => setSelectedCategoryId(id)}
              className="pt-3"
            />
          </div>
        </div>

        {/* 선택된 업체의 매거진형 소개글 카드 */}
        <CompanyIntroCard
          content={COMPANY_INTRO_CONTENT[selectedCategoryId]}
          className="mt-17.75"
        />
      </main>

      {galleryToken && partner && (
        <PartnerToast galleryToken={galleryToken} partner={partner} />
      )}

      {!galleryToken && (
        <CategoryLocationToast selectedCategoryId={selectedCategoryId} />
      )}

      {galleryToken && partner && (
        <Modal
          isOpen={benefitModal.isOpen}
          onClose={benefitModal.closeModal}
          title="혜택은 촬영 당일만 가능해요!"
          description={`오늘 촬영한 사진을 ${partner.name} 매장에서\n사진을 보여주면 할인 혜택이 적용됩니다.`}
          cancelText="매거진 보기"
          confirmText="확인 했어요"
        />
      )}
    </div>
  );
}
