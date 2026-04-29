import { useEffect, useState } from "react";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Modal } from "@/components/common/Modal";
import { PixelText } from "@/components/common/PixelText";
import {
  deleteSave,
  listSaves,
  loadGame,
  type SaveSlotSummary,
} from "@/lib/saveSystem";

interface SaveSlotsProps {
  userId: string;
  onLoadGame: () => void;
  onNewGame: () => void;
  embedded?: boolean;
}

function formatSavedAt(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatPhase(value: string | null) {
  const labels: Record<string, string> = {
    prologue: "프롤로그",
    founding: "창업기",
    training: "트레이닝",
    debut: "데뷔",
    growth: "성장기",
    peak: "전성기",
  };

  return value ? labels[value] ?? value : "-";
}

export function SaveSlots({
  userId,
  onLoadGame,
  onNewGame,
  embedded = false,
}: SaveSlotsProps) {
  const [saves, setSaves] = useState<SaveSlotSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SaveSlotSummary | null>(null);

  useEffect(() => {
    let isMounted = true;

    setIsLoading(true);
    void listSaves(userId)
      .then((items) => {
        if (isMounted) {
          setSaves(items);
          setMessage(null);
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setMessage(
            error instanceof Error ? error.message : "세이브 목록을 불러오지 못했습니다.",
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const handleLoad = async (slotNumber: number) => {
    setMessage(null);

    try {
      const loaded = await loadGame(userId, slotNumber);

      if (!loaded) {
        setMessage("해당 슬롯에는 세이브 데이터가 없습니다.");
        return;
      }

      onLoadGame();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "로드에 실패했습니다.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await deleteSave(userId, deleteTarget.slotNumber);
      setSaves(await listSaves(userId));
      setDeleteTarget(null);
      setMessage("세이브 슬롯을 삭제했습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "삭제에 실패했습니다.");
    }
  };

  return (
    <main
      className={[
        "mx-auto flex w-full max-w-md flex-col gap-4",
        embedded ? "px-1 py-1" : "min-h-screen px-4 py-6",
      ].join(" ")}
    >
      {!embedded ? (
        <header className="space-y-2 text-center">
          <PixelText as="h1" className="text-3xl text-slate-50">
            SAVE SLOTS
          </PixelText>
          <p className="text-sm text-slate-400">프로듀서 계정당 3개의 클라우드 슬롯</p>
        </header>
      ) : null}

      {message ? (
        <p className="rounded-2xl border border-brand-cyan/40 bg-brand-cyan/10 px-4 py-3 text-sm text-cyan-100">
          {message}
        </p>
      ) : null}

      <section className="space-y-4">
        {isLoading ? (
          <Card className="text-center text-sm text-slate-300">세이브 슬롯 확인 중...</Card>
        ) : (
          saves.map((save) => (
            <Card key={save.slotNumber} className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-brand-cyan">
                    Slot {save.slotNumber}
                  </p>
                  <h2 className="mt-1 text-xl text-slate-50">
                    {save.hasData ? save.groupName : "빈 슬롯"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {save.hasData
                      ? save.companyName ?? "회사명 정보 없음"
                      : "새로운 프로듀싱을 시작할 수 있습니다."}
                  </p>
                </div>
                <span className="rounded-full border border-slate-500 bg-slate-950/60 px-3 py-1 text-xs text-slate-200">
                  {save.hasData ? formatPhase(save.currentPhase) : "EMPTY"}
                </span>
              </div>

              {save.hasData ? (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-slate-950/50 p-3">
                    <p className="text-slate-500">진행 주차</p>
                    <p className="mt-1 text-slate-100">
                      {save.playedWeeks?.toLocaleString("ko-KR")}주
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-950/50 p-3">
                    <p className="text-slate-500">마지막 저장</p>
                    <p className="mt-1 text-slate-100">
                      {formatSavedAt(save.updatedAt)}
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-3">
                {save.hasData ? (
                  <>
                    <Button onClick={() => void handleLoad(save.slotNumber)}>
                      로드
                    </Button>
                    <Button tone="danger" onClick={() => setDeleteTarget(save)}>
                      삭제
                    </Button>
                  </>
                ) : (
                  <Button className="col-span-2" onClick={onNewGame}>
                    새 게임 시작
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </section>

      {deleteTarget ? (
        <Modal
          title={`Slot ${deleteTarget.slotNumber} 삭제`}
          onClose={() => setDeleteTarget(null)}
          footer={
            <div className="grid grid-cols-2 gap-3">
              <Button tone="ghost" onClick={() => setDeleteTarget(null)}>
                취소
              </Button>
              <Button tone="danger" onClick={() => void handleDelete()}>
                삭제 확정
              </Button>
            </div>
          }
        >
          <p className="text-sm leading-6 text-slate-300">
            이 세이브 슬롯을 삭제하면 복구할 수 없습니다. 정말 삭제하시겠습니까?
          </p>
        </Modal>
      ) : null}
    </main>
  );
}
