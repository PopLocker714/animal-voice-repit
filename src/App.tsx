import { useState } from "react";
import { claimAnimal, loadBoard } from "./game/board";
import { Welcome } from "./screens/Welcome";
import { Board } from "./screens/Board";
import { Play } from "./screens/Play";
import { Admin } from "./screens/Admin";
import { NameModal } from "./components/NameModal";
import { useI18n } from "./i18n";
import { LangSelector } from "./components/LangSelector";

const isAdmin = window.location.pathname.startsWith("/admin");

type Screen = "start" | "naming" | "board" | "play";

export function App() {
  const [screen, setScreen] = useState<Screen>("start");
  const [playerName, setPlayerName] = useState("");
  const [claimed, setClaimed] = useState<string[]>(loadBoard);
  const [animalId, setAnimalId] = useState<string | null>(null);

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

  // A child taps Play → name themselves → the board appears.
  function confirmName(name: string) {
    setPlayerName(name);
    setClaimed(loadBoard()); // pick up cards claimed by previous children
    setScreen("board");
  }

  // They pick a blank card → reveal that animal and let them imitate it.
  function pick(id: string) {
    setAnimalId(id);
    setScreen("play");
  }

  // Turn done: claim the card (auto-resets the board when full) and go home.
  function finishTurn() {
    if (animalId) setClaimed(claimAnimal(animalId));
    setAnimalId(null);
    setScreen("start");
  }

  return (
    <div className="app">
      <Header />

      {(screen === "start" || screen === "naming") && (
        <Welcome onPlay={() => setScreen("naming")} />
      )}
      {screen === "naming" && (
        <NameModal onConfirm={confirmName} onCancel={() => setScreen("start")} />
      )}
      {screen === "board" && (
        <Board
          playerName={playerName}
          claimed={claimed}
          onPick={pick}
          onExit={() => setScreen("start")}
        />
      )}
      {screen === "play" && animalId && (
        <Play playerName={playerName} animalId={animalId} onDone={finishTurn} />
      )}
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
