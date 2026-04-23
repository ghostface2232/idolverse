import { AuthGuard } from "@/components/auth/AuthGuard";
import { GamePage } from "@/pages/GamePage";

export default function App() {
  return (
    <AuthGuard>
      {(user) => <GamePage userId={user.id} />}
    </AuthGuard>
  );
}
