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
  isCloseDisabled?: boolean;
}

export function Modal({
  title,
  children,
  onClose,
  footer,
  className = "",
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
            "transition-[transform,opacity] duration-150 ease-out",
            isEntering ? "animate-sheet-in" : "",
            isExiting ? "translate-y-6 opacity-0 sm:-translate-y-3" : "",
            className,
          ].join(" ")
        }
      >
        <Dialog className="flex min-h-0 flex-col outline-none">
          <header className="flex min-h-14 shrink-0 items-center justify-between gap-3 border-b border-white/8 bg-surface-raised/70 px-5 py-2.5 sm:min-h-16 sm:py-3">
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
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
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
