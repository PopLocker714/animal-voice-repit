import { useState } from "react";
import { ANIMALS, type Animal } from "./data/animals";
import { AnimalGrid } from "./screens/AnimalGrid";
import { Challenge } from "./screens/Challenge";

export function App() {
  const [selected, setSelected] = useState<Animal | null>(null);

  return (
    <div className="app">
      <header className="app__header">
        <h1>Повтори за животным</h1>
        <p className="app__subtitle">Выбери животное, послушай и повтори звук</p>
      </header>

      {selected ? (
        <Challenge animal={selected} onBack={() => setSelected(null)} />
      ) : (
        <AnimalGrid animals={ANIMALS} onPick={setSelected} />
      )}
    </div>
  );
}
