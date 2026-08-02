import { lazy, Suspense, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { AuthGuard } from "@/components/auth/AuthGuard";
import {
  captureGameState,
  DEFAULT_AUTO_SAVE_SLOT,
  loadGame,
  prepareSlotForNewCampaign,
  saveGame,
} from "@/lib/saveSystem";
import {
  clearActiveSession,
  readActiveSession,
  rememberActiveSession,
} from "@/lib/sessionResume";
import { FoundingFlow } from "@/pages/FoundingFlow";
import { MainMenu } from "@/pages/MainMenu";
import { NewGame } from "@/pages/NewGame";

type AppScreen = "resuming" | "menu" | "newGame" | "founding" | "game";

const GameDashboard = lazy(() =>
  import("@/pages/GameDashboard").then((module) => ({
    default: module.GameDashboard,
  })),
);

export default function App() {
  // key=user.id: 계정이 바뀌면 화면·활성 슬롯·복원 시도 여부를 전부 초기화한다.
  return <AuthGuard>{(user) => <AppShell key={user.id} user={user} />}</AuthGuard>;
}

function AppShell({ user }: { user: User }) {
  // 새로고침 시 진행 중이던 세션을 복원할 수 있게, 복원 포인터가 있으면
  // 메뉴 대신 복원 화면에서 시작한다.
  const [screen, setScreen] = useState<AppScreen>(() =>
    readActiveSession(user.id) !== null ? "resuming" : "menu",
  );
  const [activeSlot, setActiveSlot] = useState(DEFAULT_AUTO_SAVE_SLOT);
  const resumeAttemptedRef = useRef(false);

  useEffect(() => {
    if (screen !== "resuming" || resumeAttemptedRef.current) return;
    resumeAttemptedRef.current = true;

    const slotNumber = readActiveSession(user.id);
    if (slotNumber === null) {
      setScreen("menu");
      return;
    }

    // StrictMode의 mount→cleanup→재실행에서도 한 번만 시도하도록 ref로
    // 선점하고, cleanup 취소는 두지 않는다 — 취소하면 재실행이 조기 반환된
    // 채 복원 화면에 갇힌다. 완료 콜백의 setState는 unmount 후엔 무해하다.
    void loadGame(user.id, slotNumber)
      .then((loaded) => {
        if (!loaded) {
          clearActiveSession();
          setScreen("menu");
          return;
        }
        setActiveSlot(slotNumber);
        setScreen("game");
      })
      .catch((error: unknown) => {
        console.error("Session resume failed.", error);
        setScreen("menu");
      });
  }, [screen, user.id]);

  const enterGame = (slotNumber: number) => {
    setActiveSlot(slotNumber);
    rememberActiveSession(user.id, slotNumber);
    setScreen("game");
  };

  const exitToMenu = () => {
    clearActiveSession();
    setScreen("menu");
  };

  if (screen === "resuming") {
    return <GameLoadingScreen />;
  }

  if (screen === "newGame") {
    return (
      <NewGame
        onCancel={() => setScreen("menu")}
        onStartGame={() => setScreen("founding")}
      />
    );
  }

  if (screen === "founding") {
    return (
      <FoundingFlow
        onComplete={() => {
          // 창단 직후에도 새로고침으로 진행이 날아가지 않게 즉시 1회 저장한다.
          // 새 캠페인은 revision 0에서 시작하므로, 기존 세이브가 남은 슬롯이면
          // 서버 revision을 먼저 시드해야 이 저장(과 이후 저장)이 거부되지
          // 않는다. 실패해도 게임 진입은 막지 않는다.
          const foundedState = captureGameState();
          void prepareSlotForNewCampaign(user.id, activeSlot)
            .then(() => saveGame(user.id, activeSlot, foundedState))
            .catch((error: unknown) => {
              console.error("Post-founding save failed.", error);
            });
          enterGame(activeSlot);
        }}
        onCancel={() => setScreen("menu")}
      />
    );
  }

  if (screen === "game") {
    return (
      <Suspense fallback={<GameLoadingScreen />}>
        <GameDashboard
          userId={user.id}
          slotNumber={activeSlot}
          onExit={exitToMenu}
        />
      </Suspense>
    );
  }

  return (
    <MainMenu
      userId={user.id}
      onNewGame={(slotNumber) => {
        const target = slotNumber ?? DEFAULT_AUTO_SAVE_SLOT;
        setActiveSlot(target);
        // 창단 완료 시점의 시드를 미리 데워둔다. 실패는 무시한다 —
        // 창단 완료 저장 직전에 한 번 더 시드한다.
        void prepareSlotForNewCampaign(user.id, target).catch(() => undefined);
        setScreen("newGame");
      }}
      onLoadGame={enterGame}
    />
  );
}

function GameLoadingScreen() {
  return (
    <main className="grid h-dvh place-items-center bg-surface-shell px-6 text-center">
      <div role="status">
        <p className="text-sm font-semibold text-text-primary">회사를 여는 중</p>
        <p className="mt-2 text-xs text-text-muted">이번 주 운영 현황을 준비하고 있어요.</p>
      </div>
    </main>
  );
}
