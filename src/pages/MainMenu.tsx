import { useState } from "react";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { PixelText } from "@/components/common/PixelText";
import { SaveSlots } from "@/pages/SaveSlots";

interface MainMenuProps {
  userId: string;
  onNewGame: () => void;
  onLoadGame: () => void;
}

const starClasses = [
  "left-[12%] top-[12%]",
  "left-[78%] top-[10%] [animation-delay:450ms]",
  "left-[18%] top-[42%] [animation-delay:900ms]",
  "left-[84%] top-[48%] [animation-delay:250ms]",
  "left-[62%] top-[74%] [animation-delay:700ms]",
];

export function MainMenu({ userId, onNewGame, onLoadGame }: MainMenuProps) {
  const [isSaveOpen, setIsSaveOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <main className="pixel-grid-bg relative flex h-dvh items-center justify-center overflow-hidden px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(2rem+env(safe-area-inset-top))]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(236,72,153,0.24),transparent_28%),radial-gradient(circle_at_82%_78%,rgba(6,182,212,0.2),transparent_30%),linear-gradient(180deg,#0f172a_0%,#111827_52%,#1e293b_100%)]" />
      <div className="absolute inset-x-0 top-10 mx-auto h-20 w-56 rounded-full bg-brand-pink/20 blur-3xl" />
      {starClasses.map((className, index) => (
        <span
          key={index}
          className={[
            "pixel-star absolute h-2 w-2 bg-cyan-200 shadow-[0_0_12px_rgba(103,232,249,0.9)]",
            className,
          ].join(" ")}
        />
      ))}

      <section className="relative z-10 w-full max-w-[360px] space-y-6 rounded-[36px] border-2 border-brand-cyan/50 bg-slate-900/86 p-5 text-center shadow-[0_10px_0_rgba(15,23,42,0.72),0_20px_48px_rgba(15,23,42,0.34)] backdrop-blur-md">
        <div className="neon-sign rounded-2xl border-2 border-brand-pink/70 bg-slate-950/70 px-4 py-7 shadow-[inset_0_0_28px_rgba(236,72,153,0.16)]">
          <p className="text-xs uppercase tracking-[0.34em] text-brand-cyan">
            K-POP Agency
          </p>
          <PixelText as="h1" className="mt-3 text-5xl leading-none text-pink-200">
            IDOLVERSE
          </PixelText>
          <p className="mt-3 text-xs text-slate-400 [word-break:keep-all]">
            나만의 그룹을 데뷔시키고 차트를 정복하세요
          </p>
        </div>

        <div className="space-y-3">
          <Button className="w-full text-base" onClick={onNewGame}>
            새 게임 시작
          </Button>
          <Button
            tone="secondary"
            className="w-full text-base"
            onClick={() => setIsSaveOpen(true)}
          >
            이어하기
          </Button>
          <Button
            tone="ghost"
            className="w-full text-base"
            onClick={() => setIsSettingsOpen(true)}
          >
            설정
          </Button>
        </div>

        <div className="rounded-2xl border border-slate-600 bg-slate-950/55 px-4 py-3 text-left text-xs leading-5 text-slate-400">
          <p className="text-slate-200">매니저 노트</p>
          <p className="[word-break:keep-all]">
            한 주에 꼭 필요한 3~4가지 방향만 정하세요. 세부 일정은 매니저가 맡습니다.
          </p>
        </div>
      </section>

      {isSaveOpen ? (
        <Modal
          title="이어하기"
          onClose={() => setIsSaveOpen(false)}
          className="max-w-md"
        >
          <div className="-mx-4 -my-6">
            <SaveSlots
              userId={userId}
              onNewGame={onNewGame}
              onLoadGame={onLoadGame}
              embedded
            />
          </div>
        </Modal>
      ) : null}

      {isSettingsOpen ? (
        <Modal title="설정" onClose={() => setIsSettingsOpen(false)}>
          <p className="text-center text-sm leading-6 text-slate-300 [word-break:keep-all]">
            사운드·알림·접근성 설정은 향후 업데이트에서 제공될 예정입니다.
          </p>
        </Modal>
      ) : null}
    </main>
  );
}
