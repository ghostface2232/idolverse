import type { ReactNode } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  Heading,
  Modal as AriaModal,
  ModalOverlay,
} from "react-aria-components";
import { Button } from "@/components/common/Button";

interface ModalProps {
  title: string;
  children: ReactNode;
  onClose?: () => void | Promise<void>;
  footer?: ReactNode;
  className?: string;
  /**
   * 콘텐츠 영역 패딩 오버라이드. 자체 카드 여백을 가진 콘텐츠(SaveSlots 등)를
   * 음수 마진 없이 담을 때 쓴다 — 음수 마진은 스크롤 컨테이너의 하단
   * 패딩과 셈이 맞지 않는다.
   */
  contentClassName?: string;
  isCloseDisabled?: boolean;
  /**
   * 시트 뒤에 겹쳐 보이는 대기 카드 수(최대 2장 표시). 이벤트 큐처럼
   * 같은 모달이 연속으로 이어질 때 스택으로 보이게 한다.
   */
  stackDepth?: number;
  /**
   * 결정을 내려야만 닫히는 모달. 눌리지 않는 X를 남기는 대신 닫기 버튼을
   * 아예 그리지 않는다 — 죽은 출구는 잘못된 신호다.
   */
  forced?: boolean;
  /** 강제 결정 시퀀스에서의 위치 표기(예: "2/4"). forced일 때 X 자리에 노출. */
  stepLabel?: string;
}

export function Modal({
  title,
  children,
  onClose,
  footer,
  className = "",
  contentClassName = "px-5 py-5",
  isCloseDisabled = false,
  stackDepth = 0,
  forced = false,
  stepLabel,
}: ModalProps) {
  return (
    <ModalOverlay
      isOpen
      onOpenChange={(isOpen) => {
        if (!isOpen) void onClose?.();
      }}
      isDismissable={!forced && !isCloseDisabled}
      className={({ isEntering, isExiting }) =>
        [
          // 모바일: 바텀시트 정렬(하단 밀착). sm 이상: 센터 다이얼로그.
          "fixed inset-0 z-50 flex items-end justify-center bg-slate-950/78 pt-10 backdrop-blur-sm sm:items-center sm:px-4 sm:py-6",
          "transition-[opacity] duration-[var(--motion-state)] ease-out",
          isEntering ? "animate-modal-fade" : "",
          isExiting ? "opacity-0 duration-150" : "",
        ].join(" ")
      }
    >
      <AriaModal
        className={({ isEntering, isExiting }) =>
          [
            // 시각 스타일(배경·모서리·클리핑)은 Dialog가 갖는다 — 시트 위로
            // 삐져나오는 스택 카드 셸을 그리려면 이 레이어는 overflow를
            // 허용해야 한다.
            "flex max-h-full w-full flex-col outline-none sm:max-h-[88dvh] sm:max-w-md",
            "relative transition-[transform,scale,opacity] duration-150 ease-out",
            isEntering ? "animate-sheet-in" : "",
            isExiting
              ? "translate-y-6 opacity-0 sm:translate-y-2 sm:scale-[0.98]"
              : "",
            className,
          ].join(" ")
        }
      >
        {stackDepth > 0 ? (
          // 뒤에 대기 중인 카드가 실제 시트처럼 겹쳐 보이는 스택 셸.
          // 큐가 줄면 transition으로 자리를 내려앉는다.
          <div aria-hidden="true" className="pointer-events-none">
            {stackDepth > 1 ? (
              <span className="absolute inset-x-7 -top-4 h-10 rounded-t-2xl bg-surface-panel/55 shadow-[var(--shadow-raised)] transition-all duration-300" />
            ) : null}
            <span className="absolute inset-x-3.5 -top-2 h-10 rounded-t-2xl bg-surface-panel/85 shadow-[var(--shadow-raised)] transition-all duration-300" />
          </div>
        ) : null}
        <Dialog className="relative flex min-h-0 flex-col overflow-hidden rounded-t-3xl bg-surface-panel pb-[env(safe-area-inset-bottom)] shadow-[var(--shadow-raised)] outline-none sm:rounded-3xl sm:pb-0">
          <header className="flex min-h-14 shrink-0 items-center justify-between gap-3 bg-surface-raised/76 px-5 py-3 shadow-[var(--shadow-chrome)] backdrop-blur-xl sm:min-h-16">
            <Heading slot="title" className="text-lg font-semibold text-text-primary">
              {title}
            </Heading>
            {forced ? (
              stepLabel ? (
                <span className="text-xs font-semibold tabular-nums text-text-muted">
                  {stepLabel}
                </span>
              ) : null
            ) : (
              <Button
                slot="close"
                tone="ghost"
                className="min-w-11 px-0"
                aria-label="닫기"
                isDisabled={isCloseDisabled}
              >
                <X className="size-5" aria-hidden="true" />
              </Button>
            )}
          </header>
          <div
            className={`min-h-0 flex-1 overflow-y-auto overscroll-contain ${contentClassName}`}
          >
            {children}
          </div>
          {footer ? (
            <footer className="shrink-0 border-t border-white/8 bg-surface-shell/60 px-5 py-4">
              {footer}
            </footer>
          ) : null}
        </Dialog>
      </AriaModal>
    </ModalOverlay>
  );
}
