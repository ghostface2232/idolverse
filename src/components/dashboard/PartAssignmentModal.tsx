import { useState } from "react";
import { Radio, RadioGroup } from "react-aria-components";
import { Alert } from "@/components/common/Alert";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import {
  checkTileClasses,
  radioTileClasses,
} from "@/components/common/selectionTokens";
import {
  ImpactChipRow,
  type ImpactChip,
} from "@/components/dashboard/DecisionImpactChips";
import { MemberPortrait } from "@/components/visual/MemberPortrait";
import { SceneThumb } from "@/components/visual/SceneThumb";
import { PART_ASSIGNMENT } from "@/data/balance";
import type { AlbumPartAssignment, Trainee } from "@/types/game";

// 기조별 트레이드오프 요약. 수치 원본은 PART_ASSIGNMENT(balance).
const MODE_EFFECT_CHIPS: Record<AlbumPartAssignment["mode"], ImpactChip[]> = {
  ace: [
    { id: "progress", label: "곡·안무 완성도 ↑↑", tone: "positive" },
    { id: "push", label: "푸시 멤버 인기 ↑", tone: "positive" },
    { id: "others", label: "소외 멤버 만족도 ↓", tone: "negative" },
  ],
  balanced: [
    { id: "team", label: "팀 만족도·케미 ↑", tone: "positive" },
    { id: "progress", label: "완성도 상승 완만", tone: "negative" },
  ],
};

interface PartAssignmentModalProps {
  albumTitle: string;
  trackTitle: string;
  trainees: readonly Trainee[];
  isSaving: boolean;
  errorMessage?: string | null;
  stepLabel?: string;
  onConfirm: (assignment: AlbumPartAssignment) => void | Promise<void>;
}

export function PartAssignmentModal({
  albumTitle,
  trackTitle,
  trainees,
  isSaving,
  errorMessage,
  stepLabel,
  onConfirm,
}: PartAssignmentModalProps) {
  const [mode, setMode] = useState<AlbumPartAssignment["mode"] | null>(null);
  const [pushIds, setPushIds] = useState<string[]>([]);

  const togglePush = (traineeId: string) => {
    setPushIds((current) =>
      current.includes(traineeId)
        ? current.filter((id) => id !== traineeId)
        : current.length < PART_ASSIGNMENT.ace.maxPush
          ? [...current, traineeId]
          : current,
    );
  };

  const canConfirm =
    mode === "balanced" ||
    (mode === "ace" &&
      pushIds.length >= PART_ASSIGNMENT.ace.minPush &&
      pushIds.length <= PART_ASSIGNMENT.ace.maxPush);

  return (
    <Modal
      title="파트·무대 노출 분배"
      forced
      stepLabel={stepLabel}
      footer={
        <Button
          className="w-full"
          isDisabled={!canConfirm || isSaving}
          onPress={() => {
            if (!mode) return;
            void onConfirm({
              mode,
              pushTraineeIds: mode === "ace" ? pushIds : [],
            });
          }}
        >
          {isSaving ? "저장 중…" : "이 분배로 확정"}
        </Button>
      }
    >
      <div className="space-y-4 text-sm [word-break:keep-all]">
        <div>
          <SceneThumb scene="practice" variant="banner" label={albumTitle} />
          <h2 className="mt-3 text-balance text-lg font-semibold text-text-primary">
            &lsquo;{trackTitle}&rsquo;의 파트, 누구에게 실을까요?
          </h2>
          <p className="mt-2 text-pretty leading-6 text-text-secondary">
            집중 분배는 완성도와 푸시 멤버의 개인 인기를 사지만 나머지의
            만족도를 깎습니다. 균등 분배는 팀을 지키지만 완성도 상승이
            완만합니다. 안전한 배분은 없습니다.
          </p>
        </div>

        <RadioGroup
          aria-label="분배 기조"
          value={mode ?? ""}
          onChange={(value) => setMode(value as AlbumPartAssignment["mode"])}
          isDisabled={isSaving}
          className="space-y-2"
        >
          <Radio
            value="ace"
            className={({ isSelected, isPressed }) =>
              [
                // block 필수 — react-aria Radio는 label(inline)로 렌더되어
                // border·패딩이 라인 박스 단위로 쪼개질 수 있다.
                "block min-h-11 cursor-pointer rounded-2xl border-2 p-3 outline-none transition duration-150 ease-out",
                isPressed ? "scale-[0.96]" : "scale-100",
                radioTileClasses(isSelected, mode !== null),
              ].join(" ")
            }
          >
            <span className="text-lg font-semibold leading-7 text-text-primary [word-break:keep-all]">
              에이스 집중
            </span>
            <span className="mt-1 block text-pretty text-xs leading-5 text-text-muted">
              킬링파트와 무대 동선을 1~2인에게 몰아줍니다.
            </span>
            <ImpactChipRow chips={MODE_EFFECT_CHIPS.ace} className="mt-2" />
          </Radio>
          <Radio
            value="balanced"
            className={({ isSelected, isPressed }) =>
              [
                "block min-h-11 cursor-pointer rounded-2xl border-2 p-3 outline-none transition duration-150 ease-out",
                isPressed ? "scale-[0.96]" : "scale-100",
                radioTileClasses(isSelected, mode !== null),
              ].join(" ")
            }
          >
            <span className="text-lg font-semibold leading-7 text-text-primary [word-break:keep-all]">
              균등 분배
            </span>
            <span className="mt-1 block text-pretty text-xs leading-5 text-text-muted">
              파트와 노출을 고르게 나눕니다. 화제의 중심이 될 얼굴은
              만들어지지 않습니다.
            </span>
            <ImpactChipRow chips={MODE_EFFECT_CHIPS.balanced} className="mt-2" />
          </Radio>
        </RadioGroup>

        {mode === "ace" ? (
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-action-secondary">
              푸시 멤버 선택 ({pushIds.length}/{PART_ASSIGNMENT.ace.maxPush})
            </h3>
            <div className="mt-2 space-y-1.5">
              {trainees.map((trainee) => {
                const selected = pushIds.includes(trainee.id);
                return (
                  <button
                    key={trainee.id}
                    type="button"
                    disabled={isSaving}
                    aria-pressed={selected}
                    className={[
                      "flex min-h-11 w-full items-center gap-2.5 rounded-xl border-2 px-3 py-2 text-left outline-none transition duration-150 ease-out active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-45",
                      checkTileClasses(selected),
                    ].join(" ")}
                    onClick={() => togglePush(trainee.id)}
                  >
                    <MemberPortrait
                      traineeId={trainee.id}
                      size="md"
                      outfit="stage"
                    />
                    <span className="min-w-0 flex-1 text-xs">
                      <span className="block truncate font-semibold text-text-primary">
                        {trainee.name}
                      </span>
                      <span className="mt-0.5 block tabular-nums text-text-muted">
                        보컬 {Math.round(trainee.stats.vocal)} · 댄스{" "}
                        {Math.round(trainee.stats.dance)} · 인기{" "}
                        {Math.round(trainee.popularity ?? 0)}
                      </span>
                    </span>
                    {selected ? (
                      <span className="shrink-0 rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
                        푸시
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {errorMessage ? <Alert message={errorMessage} /> : null}
      </div>
    </Modal>
  );
}
