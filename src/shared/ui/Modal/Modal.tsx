import React, { useEffect, useRef, useId, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "../Button/Button";
import ExclamationIcon from "../../assets/icons/ExclamationIcon.svg?react";
import { cn } from "../../lib/utils";

interface ModalStackItem {
  id: symbol;
}

const modalStack: ModalStackItem[] = [];
let originalBodyOverflow: string | null = null;
let originalBodyPaddingRight: string | null = null;

function pushModalStack(item: ModalStackItem) {
  if (modalStack.length === 0) {
    originalBodyOverflow = document.body.style.overflow;
    originalBodyPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
  }
  modalStack.push(item);
}

function popModalStack(item: ModalStackItem): boolean {
  const index = modalStack.findIndex((i) => i.id === item.id);
  const isTopmost = index !== -1 && index === modalStack.length - 1;
  if (index !== -1) {
    modalStack.splice(index, 1);
  }
  if (modalStack.length === 0) {
    if (originalBodyOverflow !== null) {
      document.body.style.overflow = originalBodyOverflow;
      originalBodyOverflow = null;
    }
    if (originalBodyPaddingRight !== null) {
      document.body.style.paddingRight = originalBodyPaddingRight;
      originalBodyPaddingRight = null;
    }
  }
  return isTopmost;
}

function isTopmostModal(item: ModalStackItem): boolean {
  return modalStack.length > 0 && modalStack[modalStack.length - 1].id === item.id;
}

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
  ariaLabel?: string;
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
  ariaLabel,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [instanceId] = useState(() => Symbol("ModalInstance"));
  const titleId = useId();

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // 모달 오픈 시 배경 스크롤 방지, 포커스 캡처 및 트랩 관리 (공유 모달 스택 기반)
  useEffect(() => {
    if (!isOpen) return;

    const stackItem: ModalStackItem = { id: instanceId };
    previousFocusRef.current = document.activeElement as HTMLElement | null;

    pushModalStack(stackItem);

    const focusableSelector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const animationFrameId = requestAnimationFrame(() => {
      if (modalRef.current && isTopmostModal(stackItem)) {
        const focusableElements =
          modalRef.current.querySelectorAll<HTMLElement>(focusableSelector);
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        } else {
          modalRef.current.focus();
        }
      }
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isTopmostModal(stackItem)) return;

      if (e.key === "Escape") {
        onCloseRef.current();
        return;
      }

      if (e.key === "Tab" && modalRef.current) {
        const focusableElements = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(focusableSelector),
        );

        if (focusableElements.length === 0) {
          e.preventDefault();
          modalRef.current.focus();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (
            document.activeElement === firstElement ||
            document.activeElement === modalRef.current
          ) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("keydown", handleKeyDown);

      const wasTopmost = popModalStack(stackItem);

      if (
        wasTopmost &&
        previousFocusRef.current &&
        typeof previousFocusRef.current.focus === "function"
      ) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, instanceId]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && closeOnBackdropClick) {
      onCloseRef.current();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onCloseRef.current();
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onCloseRef.current();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-label={!title ? ariaLabel : undefined}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className={cn(
          "bg-white rounded-[20px] px-6 py-7 w-full max-w-88 max-h-[calc(100vh-2rem)] flex flex-col items-center relative animate-in fade-in zoom-in-95 duration-200 focus:outline-none",
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
              <h2
                id={titleId}
                className="text-iphone-heading-1-semibold text-black whitespace-pre-line text-center"
              >
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
