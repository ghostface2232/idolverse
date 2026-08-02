import { useState } from "react";
import { Radio, RadioGroup } from "react-aria-components";
import { Alert } from "@/components/common/Alert";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { MoneyDisplay } from "@/components/common/MoneyDisplay";
import { radioTileClasses } from "@/components/common/selectionTokens";
import { SceneThumb } from "@/components/visual/SceneThumb";
import { MV_DIRECTIONS } from "@/data/balance";
import type { MvDirectionId } from "@/types/game";

// 방향별 제작 진행도·발매 효과의 요약. 수치 원본은 MV_DIRECTIONS(balance).
const DIRECTION_EFFECT_HINTS: Record<MvDirectionId, string> = {
  practical: "제작 진행도 소폭 상승",
  performance: "안무 완성도 크게 상승 · 발매 주 대중·업계 반응",
  cinematic: "비주얼 완성도 크게 상승 · 발매 주 코어 팬덤 결집",
  viral: "마케팅 완성도 크게 상승 · 발매 주 글로벌 반응",
};

interface MvDirectionModalProps {
  albumTitle: string;
  money: number;
  isSaving: boolean;
  errorMessage?: string | null;
  onConfirm: (directionId: MvDirectionId) => void | Promise<void>;
}

export function MvDirectionModal({
  albumTitle,
  money,
  isSaving,
  errorMessage,
  onConfirm,
}: MvDirectionModalProps) {
  const [selectedId, setSelectedId] = useState<MvDirectionId | null>(null);

  return (
    <Modal
      title="MV 제작 방향"
      onClose={() => undefined}
      isCloseDisabled
      footer={
        <Button
          className="w-full"
          isDisabled={!selectedId || isSaving}
          onPress={() => {
            if (selectedId) void onConfirm(selectedId);
          }}
        >
          {isSaving ? "저장 중…" : "이 방향으로 촬영 확정"}
        </Button>
      }
    >
      <div className="space-y-4 text-sm [word-break:keep-all]">
        <div>
          <SceneThumb scene="pictorial" variant="banner" label={albumTitle} />
          <h2 className="mt-3 text-balance text-lg font-semibold text-text-primary">
            이번 뮤직비디오, 누구에게 보여줄 영상인가요?
          </h2>
          <p className="mt-2 text-pretty leading-6 text-text-secondary">
            방향에 따라 제작 완성도의 축과 발매 주에 반응하는 시장이
            달라지고, 촬영 후에는 되돌릴 수 없습니다.
          </p>
        </div>

        <RadioGroup
          aria-label="MV 제작 방향"
          value={selectedId ?? ""}
          onChange={(value) => setSelectedId(value as MvDirectionId)}
          isDisabled={isSaving}
          className="space-y-2"
        >
          {MV_DIRECTIONS.map((direction) => {
            const affordable = direction.cost <= money;
            return (
              <Radio
                key={direction.id}
                value={direction.id}
                isDisabled={!affordable}
                className={({ isSelected, isPressed, isDisabled }) =>
                  [
                    // block 필수 — react-aria Radio는 label(inline)로 렌더되어
                    // border·패딩이 라인 박스 단위로 쪼개질 수 있다.
                    "block min-h-11 cursor-pointer rounded-2xl border-2 p-3 outline-none transition duration-150 ease-out",
                    isDisabled ? "cursor-not-allowed opacity-45" : "",
                    isPressed ? "scale-[0.97]" : "scale-100",
                    radioTileClasses(isSelected, selectedId !== null),
                  ].join(" ")
                }
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-text-primary">
                    {direction.label}
                  </span>
                  {direction.cost > 0 ? (
                    <MoneyDisplay amount={direction.cost} size="sm" />
                  ) : (
                    <span className="text-xs font-semibold text-emerald-200">
                      추가 비용 없음
                    </span>
                  )}
                </span>
                <span className="mt-1 block text-pretty text-xs leading-5 text-text-muted">
                  {direction.summary}
                </span>
                <span className="mt-1.5 inline-block rounded-lg bg-white/[0.05] px-2 py-1 text-[11px] font-semibold text-text-secondary">
                  {DIRECTION_EFFECT_HINTS[direction.id]}
                </span>
              </Radio>
            );
          })}
        </RadioGroup>

        {errorMessage ? <Alert message={errorMessage} /> : null}
      </div>
    </Modal>
  );
}
