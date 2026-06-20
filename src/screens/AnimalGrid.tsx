import type { Animal } from "../data/animals";

interface Props {
  animals: Animal[];
  onPick: (animal: Animal) => void;
}

export function AnimalGrid({ animals, onPick }: Props) {
  return (
    <div className="grid">
      {animals.map((animal) => (
        <button
          key={animal.id}
          className="card"
          style={{ background: animal.color }}
          onClick={() => onPick(animal)}
        >
          <span className="card__emoji">{animal.emoji}</span>
          <span className="card__name">{animal.name}</span>
        </button>
      ))}
    </div>
  );
}
