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
  onClose: () => void | Promise<void>;
  footer?: ReactNode;
  className?: string;
  /**
   * 콘텐츠 영역 패딩 오버라이드. 자체 카드 여백을 가진 콘텐츠(SaveSlots 등)를
   * 음수 마진 없이 담을 때 쓴다 — 음수 마진은 스크롤 컨테이너의 하단
   * 패딩과 셈이 맞지 않는다.
   */
  contentClassName?: string;
  isCloseDisabled?: boolean;
}

export function Modal({
  title,
  children,
  onClose,
  footer,
  className = "",
  contentClassName = "px-5 py-5",
  isCloseDisabled = false,
}: ModalProps) {
  return (
    <ModalOverlay
      isOpen
      onOpenChange={(isOpen) => {
        if (!isOpen) void onClose();
      }}
      isDismissable={!isCloseDisabled}
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
            "flex max-h-full w-full flex-col overflow-hidden rounded-t-3xl bg-surface-panel pb-[env(safe-area-inset-bottom)] shadow-[var(--shadow-raised)] outline-none sm:max-h-[88dvh] sm:max-w-md sm:rounded-3xl sm:pb-0",
            "relative transition-[transform,scale,opacity] duration-150 ease-out",
            isEntering ? "animate-sheet-in" : "",
            isExiting
              ? "translate-y-6 opacity-0 sm:translate-y-2 sm:scale-[0.98]"
              : "",
            className,
          ].join(" ")
        }
      >
        <Dialog className="flex min-h-0 flex-col outline-none">
          <header className="flex min-h-14 shrink-0 items-center justify-between gap-3 bg-surface-raised/76 px-5 py-3 shadow-[var(--shadow-chrome)] backdrop-blur-xl sm:min-h-16">
            <Heading slot="title" className="text-lg font-semibold text-text-primary">
              {title}
            </Heading>
            <Button
              slot="close"
              tone="ghost"
              className="min-w-11 px-0"
              aria-label="닫기"
              isDisabled={isCloseDisabled}
            >
              <X className="size-5" aria-hidden="true" />
            </Button>
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
