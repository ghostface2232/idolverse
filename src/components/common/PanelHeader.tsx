import { ChevronLeft } from "lucide-react";

interface PanelHeaderProps {
  title: string;
  onBack: () => void;
}

export function PanelHeader({ title, onBack }: PanelHeaderProps) {
  return (
    <header className="flex items-center gap-3 border-b border-white/8 bg-surface-panel/92 px-4 py-2 backdrop-blur">
      <button
        type="button"
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-white/[0.05] text-text-primary transition hover:bg-white/[0.09] active:scale-[0.96]"
        aria-label="뒤로 가기"
        onClick={onBack}
      >
        <ChevronLeft className="size-5" aria-hidden="true" />
      </button>
      <h2 className="text-base font-semibold text-text-primary">{title}</h2>
    </header>
  );
}
