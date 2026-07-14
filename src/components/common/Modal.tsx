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
}

export function Modal({
  title,
  children,
  onClose,
  footer,
  className = "",
}: ModalProps) {
  return (
    <ModalOverlay
      isOpen
      onOpenChange={(isOpen) => {
        if (!isOpen) void onClose();
      }}
      isDismissable
      className={({ isEntering, isExiting }) =>
        [
          "fixed inset-0 z-50 flex items-center justify-center bg-slate-950/78 px-4 py-6 backdrop-blur-sm",
          "transition-[opacity] duration-[var(--motion-state)] ease-out",
          isEntering ? "opacity-100" : "",
          isExiting ? "opacity-0 duration-150 ease-in" : "",
        ].join(" ")
      }
    >
      <AriaModal
        className={({ isEntering, isExiting }) =>
          [
            "max-h-[88dvh] w-full max-w-md overflow-hidden rounded-3xl bg-surface-panel shadow-[var(--shadow-raised)] outline-none",
            "transition-[transform,opacity] duration-[var(--motion-panel)] ease-out",
            isEntering ? "translate-y-0 opacity-100" : "",
            isExiting ? "-translate-y-3 opacity-0 duration-150 ease-in" : "",
            className,
          ].join(" ")
        }
      >
        <Dialog className="outline-none">
          <header className="flex min-h-16 items-center justify-between gap-3 border-b border-white/8 bg-surface-raised/70 px-5 py-3">
            <Heading slot="title" className="text-lg font-semibold text-text-primary">
              {title}
            </Heading>
            <Button
              slot="close"
              tone="ghost"
              className="min-w-11 px-0"
              aria-label="닫기"
            >
              <X className="size-5" aria-hidden="true" />
            </Button>
          </header>
          <div className="max-h-[62dvh] overflow-y-auto px-5 py-5">{children}</div>
          {footer ? (
            <footer className="border-t border-white/8 bg-surface-shell/60 px-5 py-4">
              {footer}
            </footer>
          ) : null}
        </Dialog>
      </AriaModal>
    </ModalOverlay>
  );
}
