import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "../Button/Button";
import ExclamationIcon from "../../assets/icons/ExclamationIcon.svg?react";
import { cn } from "../../lib/utils";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  cancelText?: string;
  confirmText?: string;
  onCancel?: () => void;
  onConfirm?: () => void;
  closeOnBackdropClick?: boolean;
  children?: React.ReactNode;
  className?: string;
}

/**
 * 공용 Modal 컴포넌트
 */
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  icon = <ExclamationIcon className="w-6 h-6 text-white" />,
  cancelText,
  confirmText,
  onCancel,
  onConfirm,
  closeOnBackdropClick = true,
  children,
  className,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // 모달 오픈 시 배경 스크롤을 방지하고 스크롤바 감추기로 인한 레이아웃 밀림 방지
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && closeOnBackdropClick) {
      onClose();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={modalRef}
        className={cn(
          "bg-white rounded-[20px] px-6 py-7 w-full max-w-88 max-h-[calc(100vh-2rem)] flex flex-col items-center relative animate-in fade-in zoom-in-95 duration-200",
          className,
        )}
      >
        {/* 헤더 영역 */}
        {(icon || title) && (
          <div className="flex flex-col items-center gap-5 w-full shrink-0">
            {icon && (
              <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                {icon}
              </div>
            )}

            {title && (
              <h2 className="text-iphone-heading-1-semibold text-black whitespace-pre-line text-center">
                {title}
              </h2>
            )}
          </div>
        )}

        {/* 모달 바디 / 컨텐츠 영역 (long description 또는 children 대응) */}
        {(description || children) && (
          <div className="w-full flex-1 min-h-0 overflow-y-auto overscroll-contain [scrollbar-gutter:stable] pt-2 flex flex-col items-center gap-4 text-center">
            {description && (
              <div className="text-iphone-body-2-regular text-gray-600 leading-[1.3] whitespace-pre-line">
                {description}
              </div>
            )}
            {children}
          </div>
        )}

        {/* 하단 액션 버튼 */}
        {(cancelText || confirmText) && (
          <div className="flex items-center gap-3 w-full shrink-0 pt-6">
            {cancelText && (
              <Button
                variant="gray"
                size="inline"
                className="flex-1 h-10.5 px-0 justify-center"
                onClick={handleCancel}
              >
                {cancelText}
              </Button>
            )}

            {confirmText && (
              <Button
                variant="darkGreen"
                size="inline"
                className="flex-1 h-10.5 px-0 justify-center"
                onClick={handleConfirm}
              >
                {confirmText}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
