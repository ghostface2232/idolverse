import { useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { FoundingFlow } from "@/pages/FoundingFlow";
import { GameDashboard } from "@/pages/GameDashboard";
import { MainMenu } from "@/pages/MainMenu";
import { NewGame } from "@/pages/NewGame";

type AppScreen = "menu" | "newGame" | "founding" | "game";

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
          return <GameDashboard userId={user.id} />;
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
