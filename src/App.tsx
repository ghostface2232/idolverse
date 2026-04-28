import { useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { GamePage } from "@/pages/GamePage";
import { MainMenu } from "@/pages/MainMenu";
import { NewGame } from "@/pages/NewGame";

type AppScreen = "menu" | "newGame" | "game";

export default function App() {
  const [screen, setScreen] = useState<AppScreen>("menu");

  return (
    <AuthGuard>
      {(user) => {
        if (screen === "newGame") {
          return (
            <NewGame
              onCancel={() => setScreen("menu")}
              onStartGame={() => setScreen("game")}
            />
          );
        }

        if (screen === "game") {
          return <GamePage userId={user.id} />;
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
