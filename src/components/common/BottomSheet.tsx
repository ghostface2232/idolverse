import { useEffect, type ReactNode } from "react";
import { Button } from "@/components/common/Button";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <>
      <div
        className="fixed inset-0 z-30 bg-black/55 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <section
        className="fixed inset-x-0 bottom-0 z-30 flex max-h-[82dvh] flex-col rounded-t-3xl border-t-2 border-brand-cyan/40 bg-slate-900 pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_40px_rgba(0,0,0,0.55)]"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex flex-col items-center pt-2">
          <span className="h-1 w-10 rounded-full bg-slate-600" aria-hidden="true" />
        </div>
        {title ? (
          <header className="flex items-center justify-between border-b border-slate-700/60 px-5 py-3">
            <h2 className="text-sm text-slate-100">{title}</h2>
            <Button
              tone="ghost"
              className="min-h-9 min-w-9 px-2 py-1 text-xs"
              aria-label="Close sheet"
              onClick={onClose}
            >
              X
            </Button>
          </header>
        ) : null}
        <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
      </section>
    </>
  );
}
