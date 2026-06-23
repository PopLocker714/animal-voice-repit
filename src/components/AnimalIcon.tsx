import type { Animal } from "../data/animals";

interface Props {
  animal: Animal | undefined;
  className?: string;
}

/**
 * Renders an animal's icon: a custom image when `image` is set (sized to 1em so
 * it scales with the surrounding font-size, just like an emoji), otherwise the
 * emoji glyph. Falls back to ❓ for an unknown animal.
 */
export function AnimalIcon({ animal, className }: Props) {
  if (!animal) return <span className={className}>❓</span>;
  if (animal.image) {
    return (
      <img
        src={animal.image}
        alt={animal.name}
        className={className}
        style={{ width: "1em", height: "1em", objectFit: "contain", verticalAlign: "middle" }}
      />
    );
  }
  return <span className={className}>{animal.emoji}</span>;
}
