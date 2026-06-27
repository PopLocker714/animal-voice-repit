import { useState } from "react";
import { resetGame } from "../api";
import { usePlays } from "../realtime";
import { PlaysTable } from "../components/PlaysTable";
import { useI18n } from "../i18n";

export function Admin() {
  const { t } = useI18n();
  const rows = usePlays(); // live, auto-updating
  const [error, setError] = useState<string | null>(null);

  async function doReset() {
    if (!confirm(t("admin.reset_confirm"))) return;
    try {
      await resetGame();
    } catch {
      setError(t("admin.err_reset"));
    }
  }

  function fullscreen() {
    const el = document.documentElement;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  }

  const count = rows?.length ?? 0;
  const avg = rows && rows.length
    ? Math.round(rows.reduce((s, r) => s + r.percent, 0) / rows.length)
    : 0;

  return (
    <div className="admin">
      <div className="admin__head">
        <h2>
          {t("admin.title")} <span className="live-dot" />
        </h2>
        <div className="admin__actions">
          <button className="btn-ghost-mini" onClick={fullscreen}>
            {t("admin.fullscreen")}
          </button>
          <button className="btn-danger" onClick={doReset}>
            {t("admin.reset")}
          </button>
        </div>
      </div>

      <div className="admin__stats">
        <span>{t("admin.total_plays", { n: count })}</span>
        {count > 0 && <span>{t("admin.avg_result", { n: avg })}</span>}
      </div>

      {error && <p className="error">{error}</p>}

      {!rows && <p className="muted">{t("admin.connecting")}</p>}
      {rows && rows.length === 0 && <p className="muted">{t("admin.no_players")}</p>}
      {rows && rows.length > 0 && <PlaysTable rows={rows} showAudio />}
    </div>
  );
}
