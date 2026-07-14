import { lazy, Suspense, useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { FoundingFlow } from "@/pages/FoundingFlow";
import { MainMenu } from "@/pages/MainMenu";
import { NewGame } from "@/pages/NewGame";

type AppScreen = "menu" | "newGame" | "founding" | "game";

const GameDashboard = lazy(() =>
  import("@/pages/GameDashboard").then((module) => ({
    default: module.GameDashboard,
  })),
);

export default function App() {
  const [screen, setScreen] = useState<AppScreen>("menu");

  return (
    <AuthGuard>
      {(user) => {
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
              onComplete={() => setScreen("game")}
              onCancel={() => setScreen("menu")}
            />
          );
        }

        if (screen === "game") {
          return (
            <Suspense fallback={<GameLoadingScreen />}>
              <GameDashboard userId={user.id} />
            </Suspense>
          );
        }

        return (
          <MainMenu
            userId={user.id}
            onNewGame={() => setScreen("newGame")}
            onLoadGame={() => setScreen("game")}
          />
        );
      }}
    </AuthGuard>
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
