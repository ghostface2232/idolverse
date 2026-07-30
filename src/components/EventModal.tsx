import { useState } from "react";
import { Alert } from "@/components/common/Alert";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import type {
  EffectKey,
  EffectMap,
  GameEvent,
  RandomEventTone,
} from "@/types/game";

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

const EFFECT_LABELS: Record<EffectKey, string> = {
  money: "자금",
  public: "대중 인지도",
  fandom: "코어 팬덤",
  fandomLoyalty: "팬 충성도",
  fandomDisappointment: "팬 실망",
  global: "해외 팬덤",
  industry: "업계 평판",
  investorPressure: "투자사 압박",
  condition: "컨디션",
  stress: "스트레스",
  satisfaction: "만족도",
  injuryWeeks: "부상 기간",
  chemistry: "팀 케미",
  visual: "비주얼",
  vocal: "보컬",
  dance: "댄스",
  charm: "끼",
  stamina: "체력",
  mental: "멘탈",
  albumSong: "곡 완성도",
  albumChoreography: "안무 완성도",
  albumVisual: "비주얼 완성도",
  albumMarketing: "홍보 준비도",
};

export function EventModal({ event, onResolve, onClose }: EventModalProps) {
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const tone = event.tone ?? inferTone(event.type);
  const choices = event.choices ?? [];
  const selectedChoice =
    event.resolvedChoiceIndex == null
      ? null
      : choices[event.resolvedChoiceIndex] ?? null;

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

  const handleSelect = async (choiceIndex: number) => {
    if (saving) return;
    setErrorMessage(null);
    setSaving(true);
    try {
      await onResolve(choiceIndex);
    } catch (error) {
      console.error("Event resolution save failed.", error);
      setErrorMessage("선택 결과를 저장하지 못했습니다. 다시 선택해 주세요.");
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
        event.resolved || choices.length === 0 ? (
          <Button className="w-full" isDisabled={saving} onPress={handleClose}>
            {saving ? "저장 중…" : "확인"}
          </Button>
        ) : null
      }
    >
      <div className="space-y-5">
        <div
          className={[
            "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
            TONE_CLASSES[tone],
          ].join(" ")}
        >
          {TONE_LABELS[tone]}
        </div>

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
          <div className="space-y-3">
            {choices.map((choice, index) => (
              <button
                key={choice.label}
                type="button"
                disabled={saving}
                className="min-h-11 w-full rounded-2xl border border-white/8 bg-surface-shell/70 px-4 py-3 text-left transition duration-[var(--motion-state)] hover:border-brand-cyan/60 hover:bg-surface-raised/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-secondary disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => handleSelect(index)}
              >
                <span className="block text-sm font-semibold text-text-primary [word-break:keep-all]">
                  {choice.label}
                </span>
                <span className="mt-1 block text-xs leading-5 text-text-muted [word-break:keep-all]">
                  {choice.description}
                </span>
                <span className="mt-2 block text-xs text-brand-cyan [word-break:keep-all]">
                  {choice.tradeoff}
                </span>
              </button>
            ))}
          </div>
        ) : null}

        {event.resolved && selectedChoice ? (
          <div className="rounded-2xl bg-surface-shell/60 p-4">
            <p className="text-sm font-semibold text-text-primary [word-break:keep-all]">
              {selectedChoice.label}
            </p>
            <p className="mt-2 text-xs text-text-muted [word-break:keep-all]">
              {selectedChoice.tradeoff}
            </p>
            <EffectList effects={selectedChoice.effects} />
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

function EffectList({ effects }: { effects: EffectMap }) {
  const entries = Object.entries(effects);

  if (entries.length === 0) {
    return <p className="mt-3 text-xs text-text-muted">추가 변화는 없습니다.</p>;
  }

  return (
    <ul className="mt-3 flex flex-wrap gap-2">
      {entries.map(([key, value]) => (
        <li
          key={key}
          className="rounded-full bg-surface-raised px-2.5 py-1 text-xs tabular-nums text-text-secondary"
        >
          {EFFECT_LABELS[key as EffectKey]}{" "}
          {formatEffectValue(key as EffectKey, value)}
        </li>
      ))}
    </ul>
  );
}

function formatEffectValue(key: EffectKey, value: number) {
  if (key === "money") {
    const sign = value > 0 ? "+" : value < 0 ? "-" : "";
    return `${sign}₩${Math.abs(value).toLocaleString("ko-KR")}`;
  }

  if (key === "investorPressure" && value <= 0) {
    return "해제";
  }

  const sign = value > 0 ? "+" : "";
  const unit = key === "injuryWeeks" || key === "investorPressure" ? "주" : "";
  return `${sign}${value}${unit}`;
}

function inferTone(type: GameEvent["type"]): RandomEventTone {
  if (type === "scandal") return "negative";
  if (type === "market") return "positive";
  return "neutral";
}
