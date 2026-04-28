import type { FoundingStep } from "@/data/founding";

const STEPS: { key: FoundingStep; label: string }[] = [
  { key: "staff", label: "스태프" },
  { key: "facility", label: "시설" },
  { key: "audition", label: "오디션" },
  { key: "position", label: "포지션" },
];

interface StepIndicatorProps {
  currentStep: FoundingStep;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className="flex items-center gap-1">
      {STEPS.map((step, index) => (
        <div key={step.key} className="flex flex-1 flex-col items-center gap-1">
          <div
            className={[
              "h-2 w-full rounded-full transition",
              index < currentIndex
                ? "bg-emerald-400"
                : index === currentIndex
                  ? "bg-brand-cyan"
                  : "bg-slate-700",
            ].join(" ")}
          />
          <span
            className={[
              "text-[10px] transition",
              index === currentIndex ? "text-brand-cyan" : "text-slate-500",
            ].join(" ")}
          >
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );
}
