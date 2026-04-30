import { useState } from "react";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import type { GameEvent, RandomEventTone } from "@/types/game";

interface EventModalProps {
  event: GameEvent;
  onResolve: (choiceIndex: number | null) => void;
  onClose: () => void;
}

const TONE_CLASSES: Record<RandomEventTone, string> = {
  positive: "border-emerald-400/70 bg-emerald-500/12 text-emerald-200",
  negative: "border-red-400/70 bg-red-500/12 text-red-200",
  neutral: "border-sky-400/70 bg-sky-500/12 text-sky-200",
};

const TONE_LABELS: Record<RandomEventTone, string> = {
  positive: "긍정 이벤트",
  negative: "위기 이벤트",
  neutral: "중립 이벤트",
};

export function EventModal({ event, onResolve, onClose }: EventModalProps) {
  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState<number | null>(
    null,
  );
  const [resolved, setResolved] = useState(false);
  const tone = event.tone ?? inferTone(event.type);
  const choices = event.choices ?? [];
  const selectedChoice =
    selectedChoiceIndex === null ? null : choices[selectedChoiceIndex] ?? null;

  const handleClose = () => {
    if (choices.length === 0 && !resolved) {
      onResolve(null);
      onClose();
      return;
    }

    if (resolved) {
      onClose();
    }
  };

  const handleSelect = (choiceIndex: number) => {
    setSelectedChoiceIndex(choiceIndex);
    setResolved(true);
    onResolve(choiceIndex);
  };

  return (
    <Modal
      title="이벤트"
      onClose={handleClose}
      footer={
        resolved || choices.length === 0 ? (
          <Button className="w-full" onClick={handleClose}>
            확인
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

        {choices.length > 0 && !resolved ? (
          <div className="space-y-3">
            {choices.map((choice, index) => (
              <button
                key={choice.label}
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

        {resolved && selectedChoice ? (
          <div className="rounded-2xl bg-slate-950/60 p-4">
            <p className="text-sm text-slate-100">{selectedChoice.label}</p>
            <p className="mt-2 text-xs text-slate-400">
              {selectedChoice.tradeoff}
            </p>
            <EffectList effects={selectedChoice.effects} />
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

function EffectList({ effects }: { effects: Record<string, number> }) {
  const entries = Object.entries(effects);

  if (entries.length === 0) {
    return <p className="mt-3 text-xs text-slate-500">추가 효과 없음</p>;
  }

  return (
    <ul className="mt-3 flex flex-wrap gap-2">
      {entries.map(([key, value]) => (
        <li
          key={key}
          className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-200"
        >
          {key} {value > 0 ? "+" : ""}
          {value}
        </li>
      ))}
    </ul>
  );
}

function inferTone(type: GameEvent["type"]): RandomEventTone {
  if (type === "scandal") return "negative";
  if (type === "market") return "positive";
  return "neutral";
}
