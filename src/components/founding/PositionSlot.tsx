import { POSITION_LABELS } from "@/data/founding";
import type { Position } from "@/types/game";

interface PositionSlotProps {
  position: Position;
  assignedName: string | null;
  fitness: number | null;
  required: boolean;
  onTap: () => void;
}

function fitnessColor(fitness: number): string {
  if (fitness >= 70) return "text-emerald-300";
  if (fitness >= 40) return "text-amber-300";
  return "text-red-300";
}

export function PositionSlot({ position, assignedName, fitness, required, onTap }: PositionSlotProps) {
  return (
    <button
      type="button"
      className={[
        "flex w-full items-center justify-between rounded-2xl border-2 px-4 py-3 text-left transition",
        assignedName
          ? "border-brand-cyan/60 bg-cyan-500/8"
          : "border-slate-600 bg-slate-800/60 hover:border-brand-cyan/40",
      ].join(" ")}
      onClick={onTap}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-50">{POSITION_LABELS[position]}</span>
        {required && !assignedName && (
          <span className="text-[10px] text-red-400">필수</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {assignedName ? (
          <>
            <span className="text-sm text-slate-200">{assignedName}</span>
            {fitness !== null && (
              <span className={["text-xs", fitnessColor(fitness)].join(" ")}>
                {fitness}%
              </span>
            )}
          </>
        ) : (
          <span className="text-xs text-slate-500">탭하여 배정</span>
        )}
      </div>
    </button>
  );
}
