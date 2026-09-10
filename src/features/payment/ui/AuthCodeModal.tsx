import React, { useRef, useState } from "react";
import { Button } from "../../../shared/ui/Button/Button";
import { Modal } from "../../../shared/ui/Modal/Modal";

/** 디자인 기준 인증 코드 자릿수. `.env`에 넣는 코드도 같은 길이여야 한다. */
const CODE_LENGTH = 6;
/** 입력 칸은 3개씩 두 그룹으로 나눠 배치한다. */
const GROUP_SIZE = 3;
/** 안내 문구 기본 스태프 연락처. */
const DEFAULT_STAFF_PHONE_NUMBER = "010-6682-1961";

/**
 * 스태프만 알고 있는 인증 코드. 빌드 시점에 번들로 주입되므로
 * 결제 대체 수단이 아니라 현장 진행용 확인 코드로만 사용한다.
 */
const AUTH_CODE = (import.meta.env.VITE_PAYMENT_AUTH_CODE ?? "").trim();

/** 입력 칸 인덱스를 3개씩 묶어 디자인의 두 그룹 배치를 만든다. */
const CODE_GROUPS: number[][] = Array.from(
  { length: Math.ceil(CODE_LENGTH / GROUP_SIZE) },
  (_, groupIndex) =>
    Array.from(
      { length: Math.min(GROUP_SIZE, CODE_LENGTH - groupIndex * GROUP_SIZE) },
      (_, offset) => groupIndex * GROUP_SIZE + offset,
    ),
);

function createEmptyCode(): string[] {
  return Array<string>(CODE_LENGTH).fill("");
}

export interface AuthCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 인증 코드가 일치했을 때 호출된다. */
  onVerified: () => void;
  /** 안내 문구에 노출할 스태프 연락처. */
  staffPhoneNumber?: string;
}

/**
 * 촬영 전 스태프 인증 코드 입력 모달.
 * 6자리 코드를 입력받아 `.env`의 `VITE_PAYMENT_AUTH_CODE`와 대조한다.
 */
export function AuthCodeModal({
  isOpen,
  onClose,
  onVerified,
  staffPhoneNumber = DEFAULT_STAFF_PHONE_NUMBER,
}: AuthCodeModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      closeOnBackdropClick={false}
      className="max-w-100"
      title="촬영 전 확인이 필요해요!"
      description={`코드 입력을 위해\n스태프(${staffPhoneNumber})를 불러주세요.`}
    >
      {/* 모달이 닫히면 함께 언마운트되므로 재오픈 시 입력값이 초기화된다. */}
      <AuthCodeForm onVerified={onVerified} />
    </Modal>
  );
}

function AuthCodeForm({ onVerified }: { onVerified: () => void }) {
  const [digits, setDigits] = useState<string[]>(createEmptyCode);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const code = digits.join("");
  const isComplete = code.length === CODE_LENGTH;

  const focusInput = (index: number) => {
    const input = inputRefs.current[index];
    input?.focus();
    input?.select();
  };

  const handleChange = (index: number, rawValue: string) => {
    setErrorMessage(null);

    const digitsOnly = rawValue.replace(/\D/g, "");
    const next = [...digits];

    if (digitsOnly.length === 0) {
      next[index] = "";
      setDigits(next);
      return;
    }

    // 붙여넣기나 연속 입력도 현재 칸부터 순서대로 채운다.
    let cursor = index;
    for (const digit of digitsOnly) {
      if (cursor >= CODE_LENGTH) break;
      next[cursor] = digit;
      cursor += 1;
    }

    setDigits(next);
    focusInput(Math.min(cursor, CODE_LENGTH - 1));
  };

  const handleSubmit = () => {
    if (!isComplete) return;

    if (!AUTH_CODE) {
      setErrorMessage(
        "인증 코드가 설정되지 않았습니다. 관리자에게 문의해주세요.",
      );
      return;
    }

    if (code !== AUTH_CODE) {
      setErrorMessage("인증 코드가 일치하지 않습니다. 다시 확인해주세요.");
      setDigits(createEmptyCode());
      focusInput(0);
      return;
    }

    onVerified();
  };

  const handleKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    // 빈 칸에서 backspace를 누르면 앞 칸을 지우고 이동한다.
    if (event.key === "Backspace" && digits[index] === "" && index > 0) {
      event.preventDefault();
      const next = [...digits];
      next[index - 1] = "";
      setDigits(next);
      focusInput(index - 1);
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusInput(index - 1);
      return;
    }

    if (event.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      event.preventDefault();
      focusInput(index + 1);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full flex flex-col gap-8 pt-2">
      <div className="w-full flex flex-col gap-2">
        <div className="w-full flex items-center gap-4">
          {CODE_GROUPS.map((group) => (
            <div
              key={group[0]}
              className="flex flex-1 min-w-0 items-center gap-2"
            >
              {group.map((index) => (
                <input
                  key={index}
                  ref={(element) => {
                    inputRefs.current[index] = element;
                  }}
                  type="text"
                  // 기본 size(20)의 고유 너비가 flex 축소를 막으므로 1로 줄인다.
                  size={1}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  aria-label={`인증 코드 ${index + 1}번째 자리`}
                  value={digits[index]}
                  onChange={(event) => handleChange(index, event.target.value)}
                  onKeyDown={(event) => handleKeyDown(index, event)}
                  onFocus={(event) => event.target.select()}
                  className="flex-1 min-w-0 h-15.5 rounded-[5px] bg-gray-100 px-3 py-1.5 text-center text-[24px] leading-[1.5] font-bold tracking-[-0.6px] text-gray-900 caret-gray-900 focus:outline-none"
                />
              ))}
            </div>
          ))}
        </div>

        {errorMessage && (
          <p className="text-red-500 text-center text-sm">{errorMessage}</p>
        )}
      </div>

      <Button
        variant="dark"
        size="inline"
        onClick={handleSubmit}
        disabled={!isComplete}
        className="w-full py-3 text-heading-1-semibold text-green-200 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        인증하기
      </Button>
    </div>
  );
}
