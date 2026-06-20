// The animal roster. `sound` is either "synth:<id>" (procedurally generated,
// see src/audio/synth.ts) or a "/sounds/<id>.mp3" path under /public for the
// realistic recordings. Switch a single entry to compare the two variants.
export interface Animal {
  id: string;
  name: string; // Russian display name
  emoji: string;
  sound: string; // "synth:<id>" or "/sounds/<id>.mp3"
  color: string; // card accent
}

export const ANIMALS: Animal[] = [
  { id: "sheep", name: "Овца", emoji: "🐑", sound: "/sounds/sheep.mp3", color: "#e0e7ff" },
  { id: "cow", name: "Корова", emoji: "🐄", sound: "/sounds/cow.mp3", color: "#fce7f3" },
  { id: "cat", name: "Кошка", emoji: "🐱", sound: "/sounds/cat.mp3", color: "#fef3c7" },
  { id: "dog", name: "Собака", emoji: "🐶", sound: "/sounds/dog.mp3", color: "#dcfce7" },
  { id: "rooster", name: "Петух", emoji: "🐓", sound: "/sounds/rooster.mp3", color: "#ffe4e6" },
  { id: "duck", name: "Утка", emoji: "🦆", sound: "/sounds/duck.mp3", color: "#cffafe" },
  { id: "goat", name: "Коза", emoji: "🐐", sound: "/sounds/goat.mp3", color: "#f3e8ff" },
  { id: "pig", name: "Свинья", emoji: "🐷", sound: "/sounds/pig.mp3", color: "#fae8ff" },
];
