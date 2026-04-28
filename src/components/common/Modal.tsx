import type { ReactNode } from "react";
import { Button } from "@/components/common/Button";

interface ModalProps {
  title: string;
  children: ReactNode;
  onClose: () => void;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/78 px-4 py-6 backdrop-blur-sm animate-modal-fade">
      <section
        className={[
          "max-h-[88vh] w-full max-w-md overflow-hidden rounded-[28px] border-2 border-brand-cyan/60 bg-slate-900 shadow-[0_0_0_4px_rgba(15,23,42,0.9),0_24px_80px_rgba(0,0,0,0.55)]",
          className,
        ].join(" ")}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <header className="flex items-center justify-between gap-3 border-b-2 border-slate-700 bg-slate-800 px-5 py-4">
          <h2 id="modal-title" className="text-lg font-black text-slate-50">
            {title}
          </h2>
          <Button
            tone="ghost"
            className="min-h-11 min-w-11 px-3"
            aria-label="Close modal"
            onClick={onClose}
          >
            X
          </Button>
        </header>
        <div className="max-h-[62vh] overflow-y-auto px-5 py-5">{children}</div>
        {footer ? (
          <footer className="border-t-2 border-slate-700 bg-slate-950/60 px-5 py-4">
            {footer}
          </footer>
        ) : null}
      </section>
    </div>
  );
}
