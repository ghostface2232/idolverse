import { useState } from "react";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
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

      <Card className="relative z-10 w-full max-w-[360px] space-y-6 border-brand-cyan/50 bg-slate-900/86 p-5 text-center">
        <div className="neon-sign rounded-[28px] border-2 border-brand-pink/70 bg-slate-950/70 px-4 py-7 shadow-[inset_0_0_28px_rgba(236,72,153,0.16)]">
          <p className="text-xs font-black uppercase tracking-[0.34em] text-brand-cyan">
            K-POP Manager Sim
          </p>
          <PixelText as="h1" className="mt-3 text-5xl leading-none text-pink-200">
            IDOLVERSE
          </PixelText>
          <p className="mt-3 text-xs font-bold text-slate-400">
            Pixel neon title placeholder
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
          <p className="font-black text-slate-200">Manager Note</p>
          <p>3-4개의 핵심 카드로 한 주를 운영하고, 나머지는 매니저 AI가 처리합니다.</p>
        </div>
      </Card>

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
          <div className="space-y-4 text-sm leading-6 text-slate-300">
            <p>사운드, 알림, 접근성 옵션은 이후 단계에서 연결할 예정입니다.</p>
            <div className="rounded-2xl border border-slate-600 bg-slate-950/50 p-4">
              <p className="font-black text-slate-100">현재 설정</p>
              <p>다크 테마: ON</p>
              <p>모바일 기준 폭: 360px</p>
              <p>소셜 로그인: 1차 범위 제외</p>
            </div>
          </div>
        </Modal>
      ) : null}
    </main>
  );
}
