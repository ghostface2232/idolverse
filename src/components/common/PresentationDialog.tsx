import type { ReactNode } from "react";
import {
  Dialog,
  Modal as AriaModal,
  ModalOverlay,
} from "react-aria-components";

interface PresentationDialogProps {
  label: string;
  children: ReactNode;
}

/**
 * 결과 확인이 필요한 게임 연출 전용 모달.
 * 배경 상호작용 차단, 포커스 트랩과 복원을 React Aria에 맡긴다.
 */
export function PresentationDialog({
  label,
  children,
}: PresentationDialogProps) {
  return (
    <ModalOverlay
      isOpen
      isDismissable={false}
      className={({ isEntering, isExiting }) =>
        [
          "fixed inset-0 z-[60] grid place-items-center bg-slate-950/92 px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(2rem+env(safe-area-inset-top))] backdrop-blur-md",
          "transition-opacity duration-[var(--motion-state)] ease-out",
          isEntering ? "animate-modal-fade" : "",
          isExiting ? "opacity-0" : "",
        ].join(" ")
      }
    >
      <AriaModal className="w-full max-w-md outline-none">
        <Dialog
          aria-label={label}
          className="w-full rounded-[var(--radius-card)] bg-surface-panel p-3 shadow-[var(--shadow-raised)] outline-none"
        >
          {children}
        </Dialog>
      </AriaModal>
    </ModalOverlay>
  );
}
