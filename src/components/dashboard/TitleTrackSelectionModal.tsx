import { useState } from "react";
import { Check, Music2 } from "lucide-react";
import { Radio, RadioGroup } from "react-aria-components";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import type { TitleTrack } from "@/types/game";

const TRACK_STRATEGY: Record<
  TitleTrack["type"],
  { label: string; summary: string; tone: string }
> = {
  safe: {
    label: "안정형",
    summary: "코어 팬 반응은 안정적이지만 대중 확장력은 낮습니다.",
    tone: "bg-emerald-400/12 text-emerald-200",
  },
  bold: {
    label: "승부형",
    summary: "대중 돌파력이 높은 대신 결과 편차와 팬 실망 위험이 큽니다.",
    tone: "bg-pink-400/12 text-pink-200",
  },
  fandom: {
    label: "팬덤형",
    summary: "팬덤 성장에 강하지만 캐주얼 리스너 확장은 제한적입니다.",
    tone: "bg-violet-400/12 text-violet-200",
  },
  global: {
    label: "글로벌형",
    summary: "해외 팬 확보에 강하고 국내 대중성은 완만하게 오릅니다.",
    tone: "bg-cyan-400/12 text-cyan-200",
  },
};

interface TitleTrackSelectionModalProps {
  albumTitle: string;
  candidates: readonly TitleTrack[];
  isSaving: boolean;
  errorMessage?: string | null;
  onConfirm: (trackId: string) => void | Promise<void>;
}

export function TitleTrackSelectionModal({
  albumTitle,
  candidates,
  isSaving,
  errorMessage,
  onConfirm,
}: TitleTrackSelectionModalProps) {
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

  return (
    <Modal
      title="타이틀곡 전략 결정"
      onClose={() => undefined}
      isCloseDisabled
      footer={
        <Button
          className="w-full"
          isDisabled={!selectedTrackId || isSaving}
          onPress={() => {
            if (selectedTrackId) void onConfirm(selectedTrackId);
          }}
        >
          {isSaving ? "저장 중…" : "이 곡으로 타이틀 확정"}
        </Button>
      }
    >
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-action-secondary">
            {albumTitle}
          </p>
          <h2 className="mt-1 text-balance text-lg font-semibold text-text-primary">
            어떤 시장을 먼저 공략할까요?
          </h2>
          <p className="mt-2 text-pretty text-sm leading-6 text-text-secondary">
            곡의 완성도뿐 아니라 팬덤·대중·해외 성장 배율과 결과 변동성이 달라집니다.
            선택 후에는 변경할 수 없습니다.
          </p>
        </div>

        <RadioGroup
          aria-label="타이틀곡 후보"
          value={selectedTrackId ?? ""}
          onChange={setSelectedTrackId}
          isDisabled={isSaving}
          className="space-y-2"
        >
          {candidates.map((track) => {
            const strategy = TRACK_STRATEGY[track.type];
            return (
              <Radio
                key={track.id}
                value={track.id}
                className={({ isDisabled, isSelected, isPressed }) =>
                  [
                    "group min-h-11 cursor-pointer rounded-2xl bg-surface-shell/72 p-3 outline-none",
                    "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] transition-[scale,background-color,box-shadow] duration-150 ease-out",
                    isDisabled ? "cursor-not-allowed opacity-45" : "",
                    isPressed ? "scale-[0.96]" : "scale-100",
                    isSelected
                      ? "bg-action-secondary/12 shadow-[inset_0_0_0_2px_rgba(34,211,238,0.5)]"
                      : "",
                  ].join(" ")
                }
              >
                {({ isSelected }) => (
                  <div className="flex items-start gap-3">
                    <span
                      className={`relative mt-0.5 grid size-6 shrink-0 place-items-center overflow-hidden rounded-lg transition-[background-color,color] duration-150 ${
                        isSelected
                          ? "bg-action-secondary text-slate-950"
                          : "bg-white/[0.06] text-text-muted"
                      }`}
                      aria-hidden="true"
                    >
                      <Check
                        className={`absolute size-3.5 transition-[scale,opacity,filter] duration-300 [transition-timing-function:cubic-bezier(0.2,0,0,1)] ${
                          isSelected
                            ? "scale-100 opacity-100 blur-0"
                            : "scale-[0.25] opacity-0 blur-[4px]"
                        }`}
                        strokeWidth={3}
                      />
                      <Music2
                        className={`size-3.5 transition-[scale,opacity,filter] duration-300 [transition-timing-function:cubic-bezier(0.2,0,0,1)] ${
                          isSelected
                            ? "scale-[0.25] opacity-0 blur-[4px]"
                            : "scale-100 opacity-100 blur-0"
                        }`}
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-text-primary">
                          {track.name}
                        </span>
                        <span className="text-xs font-semibold tabular-nums text-cyan-100">
                          완성도 {track.quality}
                        </span>
                      </span>
                      <span className="mt-1 block text-pretty text-xs leading-5 text-text-muted">
                        {track.description}
                      </span>
                      <span className="mt-2 flex items-start gap-2">
                        <span
                          className={`shrink-0 rounded-lg px-2 py-1 text-[10px] font-semibold ${strategy.tone}`}
                        >
                          {strategy.label}
                        </span>
                        <span className="text-pretty text-[11px] leading-5 text-text-secondary">
                          {strategy.summary}
                        </span>
                      </span>
                    </span>
                  </div>
                )}
              </Radio>
            );
          })}
        </RadioGroup>

        {errorMessage ? (
          <p
            role="alert"
            className="rounded-xl bg-state-danger/12 px-3 py-2 text-pretty text-sm text-rose-200"
          >
            {errorMessage}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
