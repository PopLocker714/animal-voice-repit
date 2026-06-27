import { useState } from "react";
import { useI18n } from "../i18n";
import { usePlays } from "../realtime";
import { LangSelector } from "../components/LangSelector";
import { PlaysTable } from "../components/PlaysTable";

interface Props {
  onPlay: () => void;
}

// Read-only live view of the results table — no playing involved.
function Standings({ onBack }: { onBack: () => void }) {
  const { t } = useI18n();
  const rows = usePlays();
  return (
    <div className="standings">
      <button className="link" onClick={onBack}>
        {t("admin.back")}
      </button>
      <h2>
        {t("welcome.table_title")} <span className="live-dot" />
      </h2>
      {!rows && <p className="muted">{t("admin.connecting")}</p>}
      {rows && rows.length === 0 && <p className="muted">{t("admin.no_players")}</p>}
      {rows && rows.length > 0 && <PlaysTable rows={rows} />}
    </div>
  );
}

/** Start screen: a big Play button. Each tap starts a turn for the next child. */
export function Welcome({ onPlay }: Props) {
  const { t } = useI18n();
  const [showTable, setShowTable] = useState(false);

  if (showTable) return <Standings onBack={() => setShowTable(false)} />;

  return (
    <div className="welcome">
      <LangSelector />
      <div className="welcome__art">🐮🐔🐸🦁🐝</div>
      <h2>{t("welcome.tagline")}</h2>

      <button className="btn btn--primary btn--big" onClick={onPlay}>
        {t("welcome.play")}
      </button>

      <button className="link link--center" onClick={() => setShowTable(true)}>
        {t("welcome.view_table")}
      </button>
    </div>
  );
}
