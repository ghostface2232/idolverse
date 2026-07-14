import { useState } from "react";
import { StepIndicator } from "@/components/founding/StepIndicator";
import { StaffHiring } from "@/pages/founding/StaffHiring";
import { FacilityInvestment } from "@/pages/founding/FacilityInvestment";
import { Audition } from "@/pages/founding/Audition";
import { PositionAssignment } from "@/pages/founding/PositionAssignment";
import { useFoundingStore, foundingVanillaStore } from "@/stores/foundingStore";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import type { FoundingStep } from "@/data/founding";

interface FoundingFlowProps {
  onComplete: () => void;
  onCancel: () => void;
}

const STEP_ORDER: FoundingStep[] = ["staff", "facility", "audition", "position"];

export function FoundingFlow({ onComplete, onCancel }: FoundingFlowProps) {
  const step = useFoundingStore((s) => s.foundingStep);
  const [confirmExit, setConfirmExit] = useState(false);

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
          <Button tone="ghost" onClick={() => setConfirmExit(true)}>
            처음으로
          </Button>
          <div className="flex-1">
            <StepIndicator currentStep={step} />
          </div>
        </header>
        <section key={step} className="flex min-h-0 flex-1 flex-col">
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

      {confirmExit && (
        <Modal
          title="창단 중단"
          onClose={() => setConfirmExit(false)}
          footer={
            <div className="grid grid-cols-2 gap-3">
              <Button tone="ghost" onClick={() => setConfirmExit(false)}>
                계속하기
              </Button>
              <Button tone="danger" onClick={onCancel}>
                나가기
              </Button>
            </div>
          }
        >
          <p className="text-center text-sm text-slate-300 [word-break:keep-all] [overflow-wrap:break-word]">
            지금 나가면 채용·투자·오디션 등 창단 진행 내용이 사라집니다. 정말
            처음으로 돌아갈까요?
          </p>
        </Modal>
      )}
    </main>
  );
}
