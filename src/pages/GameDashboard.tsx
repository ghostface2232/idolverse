import { useState } from "react";
import { BadgeIcon } from "@/components/common/BadgeIcon";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { MoneyDisplay } from "@/components/common/MoneyDisplay";
import { PixelText } from "@/components/common/PixelText";
import { DecisionCardDeck } from "@/components/dashboard/DecisionCardDeck";
import { useGameStore } from "@/stores/gameStore";
import { useFinanceStore } from "@/stores/financeStore";
import { useTraineeStore } from "@/stores/traineeStore";
import type { GameSpeed } from "@/types/game";

const SEASON_LABELS: Record<string, string> = {
  spring: "봄",
  summer: "여름",
  fall: "가을",
  winter: "겨울",
};

const TABS = [
  { key: "dashboard", label: "대시보드" },
  { key: "training", label: "트레이닝" },
  { key: "album", label: "앨범" },
  { key: "activity", label: "활동" },
  { key: "settings", label: "설정" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

interface GameDashboardProps {
  userId: string;
}

export function GameDashboard({ userId: _userId }: GameDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");

  const currentWeek = useGameStore((s) => s.currentWeek);
  const currentYear = useGameStore((s) => s.currentYear);
  const currentSeason = useGameStore((s) => s.currentSeason);
  const gameSpeed = useGameStore((s) => s.gameSpeed);
  const setGameSpeed = useGameStore((s) => s.setGameSpeed);
  const advanceWeek = useGameStore((s) => s.advanceWeek);
  const notifications = useGameStore((s) => s.notifications);
  const weeklyDecisions = useGameStore((s) => s.weeklyDecisions);
  const money = useFinanceStore((s) => s.money);
  const trainees = useTraineeStore((s) => s.trainees);

  return (
    <main className="flex h-dvh flex-col overflow-hidden bg-slate-950 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
      <header className="flex items-center justify-between gap-2 border-b border-slate-700/60 bg-slate-900/80 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-300">
            Y{currentYear} W{currentWeek}
          </span>
          <BadgeIcon
            icon={SEASON_LABELS[currentSeason]}
            label={SEASON_LABELS[currentSeason]}
            tone="cyan"
          />
        </div>
        <MoneyDisplay amount={money} size="sm" />
        <div className="flex gap-1">
          {([0, 1, 2, 3] as GameSpeed[]).map((speed) => (
            <button
              key={speed}
              className={[
                "rounded-lg px-2 py-1 text-xs transition",
                gameSpeed === speed
                  ? "bg-brand-cyan/20 text-brand-cyan"
                  : "text-slate-500 hover:text-slate-300",
              ].join(" ")}
              onClick={() => setGameSpeed(speed)}
            >
              {speed === 0 ? "||" : `${speed}x`}
            </button>
          ))}
        </div>
      </header>

      <section className="flex-1 overflow-y-auto px-4 py-4">
        {activeTab === "dashboard" ? (
          <div className="space-y-4">
            <Card className="flex aspect-video max-h-[200px] items-center justify-center border-brand-cyan/30">
              <p className="text-sm text-slate-500">Phaser Canvas 영역</p>
            </Card>

            <DecisionCardDeck />

            <Card className="space-y-2">
              <p className="text-xs text-slate-400">멤버 현황</p>
              <div className="flex flex-wrap gap-2">
                {trainees.map((t) => (
                  <span
                    key={t.id}
                    className="rounded-full border border-slate-600 bg-slate-800 px-3 py-1 text-xs text-slate-200"
                  >
                    {t.name}
                  </span>
                ))}
              </div>
            </Card>

            {notifications.length > 0 && (
              <Card className="space-y-2">
                <p className="text-xs text-slate-400">알림</p>
                {notifications.slice(0, 5).map((n) => (
                  <p key={n.id} className="text-xs text-slate-300">
                    [{n.type}] {n.title}: {n.message}
                  </p>
                ))}
              </Card>
            )}

            <Button className="w-full" onClick={advanceWeek}>
              다음 주 진행
            </Button>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <Card className="px-8 py-12 text-center">
              <PixelText as="p" className="text-xl text-slate-500">
                준비 중
              </PixelText>
              <p className="mt-2 text-sm text-slate-400">
                이 기능은 다음 업데이트에서 개방됩니다.
              </p>
            </Card>
          </div>
        )}
      </section>

      <nav className="border-t border-slate-700/60 bg-slate-900/90 pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto grid max-w-md grid-cols-5">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={[
                "py-3 text-center text-[10px] transition",
                activeTab === tab.key
                  ? "text-brand-cyan"
                  : "text-slate-500 hover:text-slate-300",
              ].join(" ")}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>
    </main>
  );
}
