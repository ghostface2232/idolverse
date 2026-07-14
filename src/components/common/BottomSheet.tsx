import type { ReactNode } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  Heading,
  Modal,
  ModalOverlay,
} from "react-aria-components";
import { Button } from "@/components/common/Button";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  return (
    <ModalOverlay
      isOpen={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
      isDismissable
      className={({ isEntering, isExiting }) =>
        [
          "fixed inset-0 z-40 flex items-end justify-center bg-black/60 backdrop-blur-sm",
          "transition-[opacity] duration-[var(--motion-panel)] ease-out",
          isEntering ? "opacity-100" : "",
          isExiting ? "opacity-0 duration-150 ease-in" : "",
          "lg:items-stretch lg:justify-end",
        ].join(" ")
      }
    >
      <Modal
        className={({ isEntering, isExiting }) =>
          [
            "flex max-h-[86dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl bg-surface-panel pb-[env(safe-area-inset-bottom)] shadow-[var(--shadow-raised)] outline-none",
            "transition-[transform,opacity] duration-[var(--motion-panel)] ease-out",
            isEntering ? "translate-y-0 opacity-100" : "",
            isExiting ? "translate-y-3 opacity-0 duration-150 ease-in" : "",
            "lg:h-full lg:max-h-none lg:w-[400px] lg:rounded-none lg:pb-0",
          ].join(" ")
        }
      >
        <Dialog className="flex min-h-0 flex-1 flex-col outline-none">
          <div className="flex flex-col items-center pt-2 lg:hidden">
            <span className="h-1 w-10 rounded-full bg-text-muted/50" aria-hidden="true" />
          </div>
          {title ? (
            <header className="flex min-h-14 items-center justify-between gap-3 border-b border-white/8 px-4 py-2">
              <Heading slot="title" className="text-base font-semibold text-text-primary">
                {title}
              </Heading>
              <Button
                slot="close"
                tone="ghost"
                className="min-w-11 px-0"
                aria-label="시트 닫기"
              >
                <X className="size-5" aria-hidden="true" />
              </Button>
            </header>
          ) : null}
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
