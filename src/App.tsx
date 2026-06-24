import { useState } from "react";
import {
  clearSession,
  loadSession,
  saveSession,
  type GameSession,
  type RoundResult,
} from "./game/session";
import { Welcome } from "./screens/Welcome";
import { Game } from "./screens/Game";
import { Results } from "./screens/Results";
import { Admin } from "./screens/Admin";
import { useI18n } from "./i18n";
import { LangSelector } from "./components/LangSelector";

const isAdmin = window.location.pathname.startsWith("/admin");

export function App() {
  const [session, setSession] = useState<GameSession | null>(() => loadSession());

  if (isAdmin) {
    return (
      <div className="app">
        <Header />
        <div className="lang-bar">
          <LangSelector />
        </div>
        <Admin />
      </div>
    );
  }

  function start(s: GameSession) {
    saveSession(s);
    setSession(s);
  }

  function advance(round: RoundResult) {
    setSession((prev) => {
      if (!prev) return prev;
      const next: GameSession = {
        ...prev,
        index: prev.index + 1,
        done: [...prev.done, round],
      };
      saveSession(next);
      return next;
    });
  }

  function restart() {
    clearSession();
    setSession(null);
  }

  const finished = session && session.index >= session.order.length;

  return (
    <div className="app">
      <Header />
      {!session && <Welcome onStart={start} />}
      {session && !finished && <Game session={session} onAdvance={advance} />}
      {session && finished && <Results session={session} onRestart={restart} />}
    </div>
  );
}

function Header() {
  const { t } = useI18n();
  return (
    <header className="app__header">
      <h1>{t("app.title")}</h1>
    </header>
  );
}
