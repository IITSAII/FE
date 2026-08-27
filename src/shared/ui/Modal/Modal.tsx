import React, { useEffect } from "react";
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
  // ESC 키 이벤트 감지 및 스크롤 방지
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
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
        className={cn(
          "bg-white rounded-[20px] px-6 py-7 w-full max-w-88 flex flex-col items-center gap-6 relative animate-in fade-in zoom-in-95 duration-200",
          className,
        )}
      >
        {/* 헤더 및 타이틀 영역 */}
        <div className="flex flex-col items-center gap-5 w-full">
          {icon && (
            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center shrink-0">
              {icon}
            </div>
          )}

          <div className="flex flex-col items-center gap-2 w-full text-center">
            {title && (
              <h2 className="text-[20px] text-iphone-heading-1-semibold text-black whitespace-pre-line">
                {title}
              </h2>
            )}

            {description && (
              <div className="text-iphone-body-2-regular text-gray-600 leading-[1.3] whitespace-pre-line">
                {description}
              </div>
            )}
          </div>
        </div>

        {/* 커스텀 영역 */}
        {children}

        {/* 하단 액션 버튼 (Button 컴포넌트의 3번 gray, 4번 darkGreen 사용) */}
        {(cancelText || confirmText) && (
          <div className="flex items-center gap-3 w-full">
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
