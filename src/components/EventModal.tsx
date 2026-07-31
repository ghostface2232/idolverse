import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Alert } from "@/components/common/Alert";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { radioTileClasses } from "@/components/common/selectionTokens";
import { DecisionImpactChips } from "@/components/dashboard/DecisionImpactChips";
import { SceneThumb } from "@/components/visual/SceneThumb";
import { sceneForEvent } from "@/utils/sceneMapping";
import type { GameEvent, RandomEventTone } from "@/types/game";

interface EventModalProps {
  event: GameEvent;
  onResolve: (choiceIndex: number | null) => void | Promise<void>;
  onClose: () => void | Promise<void>;
}

const TONE_CLASSES: Record<RandomEventTone, string> = {
  positive: "border-state-success/60 bg-state-success/12 text-state-success",
  negative: "border-state-danger/60 bg-state-danger/12 text-state-danger",
  neutral: "border-state-info/60 bg-state-info/12 text-state-info",
};

const TONE_LABELS: Record<RandomEventTone, string> = {
  positive: "좋은 소식",
  negative: "긴급 보고",
  neutral: "새 소식",
};

export function EventModal({ event, onResolve, onClose }: EventModalProps) {
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingChoiceIndex, setPendingChoiceIndex] = useState<number | null>(
    null,
  );
  const tone = event.tone ?? inferTone(event.type);
  const choices = event.choices ?? [];
  const selectedChoice =
    event.resolvedChoiceIndex == null
      ? null
      : choices[event.resolvedChoiceIndex] ?? null;

  useEffect(() => {
    setPendingChoiceIndex(null);
    setErrorMessage(null);
  }, [event.id]);

  const handleClose = async () => {
    if (saving) return;

    setErrorMessage(null);
    if (choices.length === 0 && !event.resolved) {
      setSaving(true);
      try {
        await onResolve(null);
        await onClose();
      } catch (error) {
        console.error("Event resolution save failed.", error);
        setErrorMessage("확인한 내용을 저장하지 못했습니다. 다시 시도해 주세요.");
      } finally {
        setSaving(false);
      }
      return;
    }

    if (event.resolved) {
      setSaving(true);
      try {
        await onClose();
      } catch (error) {
        console.error("Event queue save failed.", error);
        setErrorMessage("다음 소식으로 넘어가지 못했습니다. 다시 시도해 주세요.");
      } finally {
        setSaving(false);
      }
    }
  };

  const handleSelect = (choiceIndex: number) => {
    if (saving) return;
    setErrorMessage(null);
    setPendingChoiceIndex(choiceIndex);
  };

  const handleConfirmChoice = async () => {
    if (saving || pendingChoiceIndex === null) return;

    setErrorMessage(null);
    setSaving(true);
    try {
      await onResolve(pendingChoiceIndex);
    } catch (error) {
      console.error("Event resolution save failed.", error);
      setErrorMessage("선택을 확정하지 못했습니다. 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="이번 주 소식"
      onClose={handleClose}
      isCloseDisabled={saving}
      footer={
        event.resolved ? (
          <Button className="w-full" isDisabled={saving} onPress={handleClose}>
            {saving ? "이동 중…" : "다음"}
          </Button>
        ) : choices.length === 0 ? (
          <Button className="w-full" isDisabled={saving} onPress={handleClose}>
            {saving ? "저장 중…" : "확인"}
          </Button>
        ) : (
          <Button
            className="w-full"
            isDisabled={saving || pendingChoiceIndex === null}
            onPress={handleConfirmChoice}
          >
            {saving
              ? "확정 중…"
              : pendingChoiceIndex === null
                ? "선택 후 확인"
                : "선택 확정"}
          </Button>
        )
      }
    >
      <div className="space-y-5">
        <SceneThumb scene={sceneForEvent(event)} variant="banner" label={null}>
          <span
            className={[
              "absolute bottom-2 left-2.5 inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur-sm",
              TONE_CLASSES[tone],
            ].join(" ")}
          >
            {TONE_LABELS[tone]}
          </span>
        </SceneThumb>

        <div className="space-y-2">
          <h2 className="text-2xl text-text-primary [word-break:keep-all]">
            {event.title}
          </h2>
          <p className="text-sm leading-6 text-text-secondary [word-break:keep-all]">
            {event.description}
          </p>
        </div>

        {errorMessage ? <Alert message={errorMessage} /> : null}

        {choices.length > 0 && !event.resolved ? (
          <div aria-label="대응 선택" className="space-y-2" role="radiogroup">
            {choices.map((choice, index) => {
              const isSelected = pendingChoiceIndex === index;

              return (
                <button
                  key={choice.label}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  disabled={saving}
                  className={[
                    "min-h-16 w-full rounded-2xl border-2 px-3 py-3 text-left",
                    "transition-[scale,background-color,border-color,box-shadow] duration-[var(--motion-state)] ease-out active:scale-[0.96]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-secondary disabled:cursor-not-allowed disabled:opacity-50",
                    radioTileClasses(
                      isSelected,
                      pendingChoiceIndex !== null,
                    ),
                  ].join(" ")}
                  onClick={() => handleSelect(index)}
                >
                  <span className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className={[
                        "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border",
                        isSelected
                          ? "border-brand-cyan bg-brand-cyan text-slate-950"
                          : "border-border-strong bg-surface-shell text-transparent",
                      ].join(" ")}
                    >
                      <Check className="size-3.5" strokeWidth={3} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-text-primary [word-break:keep-all]">
                        {choice.label}
                      </span>
                      <DecisionImpactChips option={choice} className="mt-2" />
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}

        {event.resolved && selectedChoice ? (
          <div className="rounded-2xl bg-surface-shell/60 p-4">
            <p className="text-sm font-semibold text-text-primary [word-break:keep-all]">
              {selectedChoice.label}
            </p>
            <DecisionImpactChips option={selectedChoice} className="mt-3" />
          </div>
        ) : null}

        {event.resolved && !selectedChoice ? (
          <div className="rounded-2xl bg-surface-shell/60 p-4">
            <p className="text-sm text-text-primary">관련 조치를 마쳤습니다.</p>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

function inferTone(type: GameEvent["type"]): RandomEventTone {
  if (type === "scandal") return "negative";
  if (type === "market") return "positive";
  return "neutral";
}
