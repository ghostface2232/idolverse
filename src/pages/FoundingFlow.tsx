import { StepIndicator } from "@/components/founding/StepIndicator";
import { StaffHiring } from "@/pages/founding/StaffHiring";
import { FacilityInvestment } from "@/pages/founding/FacilityInvestment";
import { Audition } from "@/pages/founding/Audition";
import { PositionAssignment } from "@/pages/founding/PositionAssignment";
import { useFoundingStore, foundingVanillaStore } from "@/stores/foundingStore";
import { Button } from "@/components/common/Button";
import type { FoundingStep } from "@/data/founding";

interface FoundingFlowProps {
  onComplete: () => void;
  onCancel: () => void;
}

const STEP_ORDER: FoundingStep[] = ["staff", "facility", "audition", "position"];

export function FoundingFlow({ onComplete, onCancel }: FoundingFlowProps) {
  const step = useFoundingStore((s) => s.foundingStep);

  const goToStep = (target: FoundingStep) => {
    foundingVanillaStore.getState().setFoundingStep(target);
  };

  const goNext = () => {
    const idx = STEP_ORDER.indexOf(step);
    if (idx < STEP_ORDER.length - 1) {
      goToStep(STEP_ORDER[idx + 1]);
    }
  };

  const goPrev = () => {
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) {
      goToStep(STEP_ORDER[idx - 1]);
    }
  };

  return (
    <main className="pixel-grid-bg h-dvh overflow-hidden bg-slate-950 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))]">
      <div className="mx-auto flex h-full w-full max-w-md flex-col gap-3 px-4">
        <header className="flex items-center justify-between gap-3">
          <Button tone="ghost" onClick={onCancel}>
            처음으로
          </Button>
          <div className="flex-1">
            <StepIndicator currentStep={step} />
          </div>
        </header>
        <section
          key={step}
          className="animate-step-fade flex min-h-0 flex-1 flex-col"
        >
          {step === "staff" && <StaffHiring onNext={goNext} />}
          {step === "facility" && (
            <FacilityInvestment onNext={goNext} onPrev={goPrev} />
          )}
          {step === "audition" && (
            <Audition onNext={goNext} onPrev={goPrev} />
          )}
          {step === "position" && (
            <PositionAssignment onComplete={onComplete} onPrev={goPrev} />
          )}
        </section>
      </div>
    </main>
  );
}
