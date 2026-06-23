import { useEffect, useState } from "react";
import {
  fetchBestByAnimal,
  fetchUserDetail,
  resetGame,
  type AnimalBest,
  type ApiResult,
  type Player,
} from "../api";
import { useLeaderboard } from "../realtime";
import { animalName, ANIMALS, ANIMALS_BY_ID } from "../data/animals";
import { AnimalIcon } from "../components/AnimalIcon";
import { AudioButton } from "../components/AudioButton";
import { PlayableRow } from "../components/PlayableRow";
import { Leaderboard } from "../components/Leaderboard";
import { useI18n } from "../i18n";

type View = "players" | "animals";

export function Admin() {
  const { t, lang } = useI18n();
  const rows = useLeaderboard(); // live, auto-updating
  const [view, setView] = useState<View>("players");
  const [best, setBest] = useState<AnimalBest[] | null>(null);
  const [detail, setDetail] = useState<{ user: Player; results: ApiResult[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Keep the per-animal view fresh: refetch when shown and on every live update.
  useEffect(() => {
    if (view !== "animals") return;
    fetchBestByAnimal().then(setBest).catch(() => setError(t("admin.err_load")));
  }, [view, rows]);

  async function openUser(id: number) {
    setError(null);
    try {
      setDetail(await fetchUserDetail(id));
    } catch {
      setError(t("admin.err_open"));
    }
  }

  async function doReset() {
    if (!confirm(t("admin.reset_confirm"))) return;
    try {
      await resetGame();
      setDetail(null);
      setBest(null);
    } catch {
      setError(t("admin.err_reset"));
    }
  }

  // --- Detail view ---
  if (detail) {
    const avg = detail.results.length
      ? Math.round(detail.results.reduce((s, r) => s + r.percent, 0) / detail.results.length)
      : 0;
    return (
      <div className="admin">
        <button className="link" onClick={() => setDetail(null)}>
          {t("admin.back")}
        </button>
        <h2>{detail.user.name}</h2>
        <p className="muted">{t("admin.avg_result", { n: avg })}</p>
        <ul className="result-list">
          {detail.results.map((r) => {
            const a = ANIMALS_BY_ID[r.animalId];
            return (
              <PlayableRow
                key={r.id}
                icon={<AnimalIcon animal={a} className="result-row__emoji" />}
                name={animalName(a, lang) || r.animalId}
                percent={r.percent}
                audio={r.audioUrl ? { url: r.audioUrl } : null}
              />
            );
          })}
          {detail.results.length === 0 && <li className="muted">{t("admin.no_results")}</li>}
        </ul>
      </div>
    );
  }

  // --- Main admin (players / animals) ---
  return (
    <div className="admin">
      <div className="admin__head">
        <h2>
          {t("admin.title")} <span className="live-dot" />
        </h2>
        <button className="btn-danger" onClick={doReset}>
          {t("admin.reset")}
        </button>
      </div>

      <div className="tabs">
        <button
          className={view === "players" ? "tab tab--on" : "tab"}
          onClick={() => setView("players")}
        >
          {t("admin.tab_players")}
        </button>
        <button
          className={view === "animals" ? "tab tab--on" : "tab"}
          onClick={() => setView("animals")}
        >
          {t("admin.tab_animals")}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {view === "players" && (
        <>
          {!rows && <p className="muted">{t("admin.connecting")}</p>}
          {rows && rows.length === 0 && <p className="muted">{t("admin.no_players")}</p>}
          {rows && rows.length > 0 && <Leaderboard rows={rows} onRowClick={openUser} />}
        </>
      )}

      {view === "animals" && (
        <ul className="result-list">
          {ANIMALS.map((a) => ({ a, win: best?.find((b) => b.animalId === a.id) }))
            // Highest record first; animals with no record sink to the bottom.
            .sort((x, y) => (y.win?.percent ?? -1) - (x.win?.percent ?? -1))
            .map(({ a, win }) => {
            return (
              <li
                key={a.id}
                className={`result-row${win ? " result-row--click" : ""}`}
                onClick={win ? () => openUser(win.userId) : undefined}
              >
                <AnimalIcon animal={a} className="result-row__emoji" />
                <span className="result-row__name">{animalName(a, lang)}</span>
                {win ? (
                  <>
                    <span className="best-winner">👑 {win.name}</span>
                    <span className="result-row__pct">{win.percent}%</span>
                    {win.audioUrl ? (
                      // stopPropagation so playing doesn't also open the profile
                      <span onClick={(e) => e.stopPropagation()}>
                        <AudioButton url={win.audioUrl} label="▶︎" className="btn-mini" />
                      </span>
                    ) : (
                      <span className="btn-mini btn-mini--off">—</span>
                    )}
                  </>
                ) : (
                  <span className="muted best-empty">{t("admin.nobody")}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
