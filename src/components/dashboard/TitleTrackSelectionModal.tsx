import { useState } from "react";
import { Check, Music2 } from "lucide-react";
import { Radio, RadioGroup } from "react-aria-components";
import { Alert } from "@/components/common/Alert";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { radioTileClasses } from "@/components/common/selectionTokens";
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

// 데뷔 앨범은 아직 팬덤이 없다. 같은 전략이라도 첫 무대 전제의 문구를 쓴다.
const DEBUT_TRACK_SUMMARY: Record<TitleTrack["type"], string> = {
  safe: "완성도가 고르게 나옵니다. 화제성은 낮은 편입니다.",
  bold: "대중의 시선을 단번에 끌 수 있지만 결과 편차가 큽니다.",
  fandom: "데뷔 후 코어 팬을 빠르게 모으는 곡입니다. 대중 확장은 느립니다.",
  global: "해외 리스너에게 먼저 닿는 곡입니다. 국내 반응은 완만합니다.",
};

interface TitleTrackSelectionModalProps {
  albumTitle: string;
  candidates: readonly TitleTrack[];
  isSaving: boolean;
  /** 데뷔 앨범이면 true. 아직 팬덤이 없는 전제의 전략 문구를 쓴다. */
  isDebut?: boolean;
  errorMessage?: string | null;
  onConfirm: (trackId: string) => void | Promise<void>;
}

export function TitleTrackSelectionModal({
  albumTitle,
  candidates,
  isSaving,
  isDebut = false,
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
          <p className="mt-2 text-pretty text-sm leading-6 text-text-secondary [word-break:keep-all]">
            {isDebut
              ? "데뷔곡 전략에 따라 첫 팬층과 대중 반응이 달라지고, 선택 후에는 되돌릴 수 없습니다."
              : "전략에 따라 팬덤, 대중, 해외 성장과 결과 변동성이 달라지고, 선택 후에는 되돌릴 수 없습니다."}
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
                    "group min-h-11 cursor-pointer rounded-2xl border-2 p-3 outline-none transition duration-150 ease-out",
                    isDisabled ? "cursor-not-allowed opacity-45" : "",
                    isPressed ? "scale-[0.96]" : "scale-100",
                    radioTileClasses(isSelected, selectedTrackId !== null),
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
                          완성도 {Math.round(track.quality)}
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
                          {isDebut
                            ? DEBUT_TRACK_SUMMARY[track.type]
                            : strategy.summary}
                        </span>
                      </span>
                    </span>
                  </div>
                )}
              </Radio>
            );
          })}
        </RadioGroup>

        {errorMessage ? <Alert message={errorMessage} /> : null}
      </div>
    </Modal>
  );
}
