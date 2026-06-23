// The animal roster — the pool the game draws from. `sound` points at a file
// under /public/sounds/. Order here is the canonical list; the game shuffles it.
export interface Animal {
  id: string;
  name: string; // Russian display name
  nameEn: string; // English display name
  emoji: string; // shown unless `image` is set
  image?: string; // optional custom icon (e.g. for animals with no emoji)
  sound: string; // "/sounds/<id>.mp3"
  color: string; // card accent
}

/** Localized display name for an animal. */
export const animalName = (a: Animal | undefined, lang: "ru" | "en"): string =>
  a ? (lang === "en" ? a.nameEn : a.name) : "";

export const ANIMALS: Animal[] = [
  { id: "rooster", name: "Петух", nameEn: "Rooster", emoji: "🐓", sound: "/sounds/rooster.mp3", color: "#ffe4e6" },
  { id: "sheep", name: "Овечка", nameEn: "Sheep", emoji: "🐑", sound: "/sounds/sheep.mp3", color: "#e0e7ff" },
  { id: "dog", name: "Собака", nameEn: "Dog", emoji: "🐶", sound: "/sounds/dog.mp3", color: "#dcfce7" },
  { id: "cow", name: "Корова", nameEn: "Cow", emoji: "🐄", sound: "/sounds/cow.mp3", color: "#fce7f3" },
  { id: "horse", name: "Лошадь", nameEn: "Horse", emoji: "🐴", sound: "/sounds/horse.mp3", color: "#fef9c3" },
  { id: "pig", name: "Свинья", nameEn: "Pig", emoji: "🐷", sound: "/sounds/pig.mp3", color: "#fae8ff" },
  { id: "hen", name: "Курица", nameEn: "Hen", emoji: "🐔", sound: "/sounds/hen.mp3", color: "#fee2e2" },
  { id: "goat", name: "Коза", nameEn: "Goat", emoji: "🐐", sound: "/sounds/goat.mp3", color: "#f3e8ff" },
  { id: "duck", name: "Утка", nameEn: "Duck", emoji: "🦆", sound: "/sounds/duck.mp3", color: "#cffafe" },
  { id: "goose", name: "Гусь", nameEn: "Goose", emoji: "🦢", sound: "/sounds/goose.mp3", color: "#ecfeff" },
  { id: "wolf", name: "Волк", nameEn: "Wolf", emoji: "🐺", sound: "/sounds/wolf.mp3", color: "#e2e8f0" },
  { id: "lion", name: "Лев", nameEn: "Lion", emoji: "🦁", sound: "/sounds/lion.mp3", color: "#fef3c7" },
  { id: "frog", name: "Лягушка", nameEn: "Frog", emoji: "🐸", sound: "/sounds/frog.mp3", color: "#dcfce7" },
  { id: "cuckoo", name: "Кукушка", nameEn: "Cuckoo", emoji: "🐦", image: "/cuckoo.svg", sound: "/sounds/cuckoo.mp3", color: "#e0f2fe" },
  { id: "crow", name: "Ворона", nameEn: "Crow", emoji: "🐦‍⬛", sound: "/sounds/crow.mp3", color: "#e5e7eb" },
  { id: "sparrow", name: "Воробей", nameEn: "Sparrow", emoji: "🐦", sound: "/sounds/sparrow.mp3", color: "#fef3c7" },
  { id: "turkey", name: "Индюк", nameEn: "Turkey", emoji: "🦃", sound: "/sounds/turkey.mp3", color: "#ffedd5" },
  { id: "pigeon", name: "Голубь", nameEn: "Pigeon", emoji: "🕊️", sound: "/sounds/pigeon.mp3", color: "#f1f5f9" },
  { id: "donkey", name: "Осёл", nameEn: "Donkey", emoji: "🫏", sound: "/sounds/donkey.mp3", color: "#f5f5f4" },
  { id: "bee", name: "Пчела", nameEn: "Bee", emoji: "🐝", sound: "/sounds/bee.mp3", color: "#fef9c3" },
];

export const ANIMALS_BY_ID: Record<string, Animal> = Object.fromEntries(
  ANIMALS.map((a) => [a.id, a])
);
