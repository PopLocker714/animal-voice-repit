import { animalName, ANIMALS } from "../data/animals";
import { AnimalIcon } from "../components/AnimalIcon";
import { useI18n } from "../i18n";

interface Props {
  playerName: string;
  claimed: string[]; // animal ids already taken this round
  onPick: (animalId: string) => void;
  onExit: () => void;
}

/**
 * The card board. One card per animal. Cards already claimed this round are shown
 * open (animal revealed) and disabled; the rest are colored blanks the child can
 * pick from. Picking a blank reveals its animal on the next screen.
 */
export function Board({ playerName, claimed, onPick, onExit }: Props) {
  const { t, lang } = useI18n();
  const left = ANIMALS.length - claimed.length;

  return (
    <div className="board">
      <button className="link" onClick={onExit}>
        {t("admin.back")}
      </button>
      <h2 className="board__title">
        {t("board.pick", { name: playerName })}
      </h2>
      <p className="muted board__left">{t("board.left", { n: left, total: ANIMALS.length })}</p>

      <div className="grid">
        {ANIMALS.map((a) => {
          const open = claimed.includes(a.id);
          if (open) {
            return (
              <div key={a.id} className="card card--open" aria-disabled>
                <AnimalIcon animal={a} className="card__emoji" />
                <span className="card__name">{animalName(a, lang)}</span>
              </div>
            );
          }
          return (
            <button
              key={a.id}
              className="card card--blank"
              style={{ background: a.color }}
              onClick={() => onPick(a.id)}
            >
              <span className="card__q">?</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
