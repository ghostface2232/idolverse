import { PixelText } from "@/components/common/PixelText";

interface PanelHeaderProps {
  title: string;
  onBack: () => void;
}

export function PanelHeader({ title, onBack }: PanelHeaderProps) {
  return (
    <header className="flex items-center gap-3 border-b border-slate-700/60 bg-slate-900/85 px-4 py-2 backdrop-blur">
      <button
        type="button"
        className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/70 text-base text-slate-100 transition hover:bg-slate-700"
        aria-label="뒤로 가기"
        onClick={onBack}
      >
        ←
      </button>
      <PixelText as="h2" className="text-base text-slate-100">
        {title}
      </PixelText>
    </header>
  );
}
