import { animalName, ANIMALS_BY_ID } from "../data/animals";
import { AnimalIcon } from "../components/AnimalIcon";
import { PlayableRow } from "../components/PlayableRow";
import { Confetti } from "../components/Confetti";
import { Leaderboard } from "../components/Leaderboard";
import { useLeaderboard } from "../realtime";
import { useI18n } from "../i18n";
import { getRecording } from "../game/localStore";
import type { AudioRef, GameSession } from "../game/session";

interface Props {
  session: GameSession;
  onRestart: () => void;
}

// Build a play resolver for either a server recording or a local blob.
function audioProps(audio: AudioRef | null) {
  if (!audio) return null;
  if (audio.kind === "server") return { url: `/api/recordings/${audio.id}` };
  return {
    resolve: async () => {
      const blob = await getRecording(audio.key);
      return blob ? URL.createObjectURL(blob) : null;
    },
  };
}

export function Results({ session, onRestart }: Props) {
  const { t, lang } = useI18n();
  const done = session.done;
  const total = done.reduce((s, r) => s + r.percent, 0);
  const avg = done.length ? Math.round(total / done.length) : 0;
  const isOnline = session.mode === "online";

  // Live leaderboard only matters online; the hook is a no-op visually otherwise.
  const rows = useLeaderboard();
  const place = isOnline && rows ? rows.findIndex((r) => r.id === session.user.id) + 1 : 0;

  return (
    <div className="results-screen">
      <Confetti />
      <h2>{t("results.done", { name: session.user.name })}</h2>

      {isOnline && place > 0 && (
        <div className="place-banner">
          {place === 1 ? t("results.first_place") : t("results.place", { n: place })}
        </div>
      )}
      {!isOnline && <div className="local-badge">{t("results.local_badge")}</div>}

      <div className="score-summary">
        <div>
          <div className="score-summary__big">{avg}%</div>
          <div className="score-summary__cap">{t("results.avg")}</div>
        </div>
        <div>
          <div className="score-summary__big">{total}</div>
          <div className="score-summary__cap">{t("results.total")}</div>
        </div>
      </div>

      {isOnline && rows && rows.length > 0 && (
        <div className="results-lb">
          <div className="results-lb__title">
            {t("results.table")} <span className="live-dot" />
          </div>
          <Leaderboard rows={rows} highlightId={session.user.id} />
        </div>
      )}

      <h3 className="results-sub">{t("results.your_animals")}</h3>
      <ul className="result-list">
        {done.map((r, i) => {
          const a = ANIMALS_BY_ID[r.animalId];
          return (
            <PlayableRow
              key={i}
              icon={<AnimalIcon animal={a} className="result-row__emoji" />}
              name={animalName(a, lang)}
              percent={r.percent}
              audio={audioProps(r.audio)}
            />
          );
        })}
      </ul>

      <button className="btn btn--primary" onClick={onRestart}>
        {t("results.new_player")}
      </button>
    </div>
  );
}
