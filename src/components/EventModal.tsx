import { useState } from "react";
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
  positive: "border-emerald-400/70 bg-emerald-500/12 text-emerald-200",
  negative: "border-red-400/70 bg-red-500/12 text-red-200",
  neutral: "border-sky-400/70 bg-sky-500/12 text-sky-200",
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
          <Button className="w-full" disabled={saving} onPress={handleClose}>
            {saving ? "저장 중…" : "확인"}
          </Button>
        ) : null
      }
    >
      <div className="space-y-5">
        <div
          className={[
            "rounded-2xl border px-3 py-2 text-xs",
            TONE_CLASSES[tone],
          ].join(" ")}
        >
          {TONE_LABELS[tone]}
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl text-slate-50">{event.title}</h2>
          <p className="text-sm leading-6 text-slate-300">{event.description}</p>
        </div>

        {errorMessage ? (
          <p
            role="alert"
            className="rounded-xl bg-state-danger/12 px-3 py-2 text-sm text-rose-200"
          >
            {errorMessage}
          </p>
        ) : null}

        {choices.length > 0 && !event.resolved ? (
          <div className="space-y-3">
            {choices.map((choice, index) => (
              <button
                key={choice.label}
                disabled={saving}
                className="min-h-11 w-full rounded-2xl border border-white/8 bg-slate-950/70 px-4 py-3 text-left transition hover:border-brand-cyan/60"
                onClick={() => handleSelect(index)}
              >
                <span className="block text-sm text-slate-100">
                  {choice.label}
                </span>
                <span className="mt-1 block text-xs text-slate-400">
                  {choice.description}
                </span>
                <span className="mt-2 block text-xs text-brand-cyan">
                  {choice.tradeoff}
                </span>
              </button>
            ))}
          </div>
        ) : null}

        {event.resolved && selectedChoice ? (
          <div className="rounded-2xl bg-slate-950/60 p-4">
            <p className="text-sm text-slate-100">{selectedChoice.label}</p>
            <p className="mt-2 text-xs text-slate-400">
              {selectedChoice.tradeoff}
            </p>
            <EffectList effects={selectedChoice.effects} />
          </div>
        ) : null}

        {event.resolved && !selectedChoice ? (
          <div className="rounded-2xl bg-slate-950/60 p-4">
            <p className="text-sm text-slate-100">관련 조치를 마쳤습니다.</p>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

function EffectList({ effects }: { effects: EffectMap }) {
  const entries = Object.entries(effects);

  if (entries.length === 0) {
    return <p className="mt-3 text-xs text-slate-500">추가 변화 없음</p>;
  }

  return (
    <ul className="mt-3 flex flex-wrap gap-2">
      {entries.map(([key, value]) => (
        <li
          key={key}
          className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-200"
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
