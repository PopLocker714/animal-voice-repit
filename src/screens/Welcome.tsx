import { useEffect, useState } from "react";
import { checkName, createUser, NameTakenError } from "../api";
import {
  getLastName,
  newSession,
  setLastName,
  type GameSession,
} from "../game/session";
import { useI18n } from "../i18n";
import { LangSelector } from "../components/LangSelector";

interface Props {
  onStart: (session: GameSession) => void;
}

type NameStatus = "idle" | "checking" | "free" | "taken";

export function Welcome({ onStart }: Props) {
  const { t } = useI18n();
  // Prefill the previous name (after a reset / new round) — still editable.
  const [name, setName] = useState(getLastName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<NameStatus>("idle");

  const trimmed = name.trim();

  // Live availability check while typing (debounced).
  useEffect(() => {
    if (!trimmed) {
      setStatus("idle");
      return;
    }
    setStatus("checking");
    let cancelled = false;
    const id = setTimeout(async () => {
      try {
        const taken = await checkName(trimmed);
        if (!cancelled) setStatus(taken ? "taken" : "free");
      } catch {
        // Can't reach the server (e.g. offline) — don't block; local still works.
        if (!cancelled) setStatus("idle");
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [trimmed]);

  async function startOnline() {
    if (!trimmed || status === "taken") return;
    setBusy(true);
    setError(null);
    setLastName(trimmed);
    try {
      const user = await createUser(trimmed);
      onStart(newSession({ id: user.id, name: user.name }, "online"));
    } catch (e) {
      if (e instanceof NameTakenError) {
        setStatus("taken");
      } else {
        setError(t("welcome.server_err"));
      }
      setBusy(false);
    }
  }

  function startLocal() {
    if (!trimmed) return;
    setLastName(trimmed);
    // Local id never leaves the device; no server contact at all.
    onStart(newSession({ id: Date.now(), name: trimmed }, "local"));
  }

  return (
    <div className="welcome">
      <LangSelector />
      <div className="welcome__art">🐮🐔🐸🦁🐝</div>
      <h2>{t("welcome.name_q")}</h2>

      {/* Status banner above the input so it's seen immediately */}
      {status === "checking" && <p className="name-status">{t("welcome.name_checking")}</p>}
      {status === "free" && <p className="name-status name-status--ok">{t("welcome.name_free")}</p>}
      {status === "taken" && (
        <p className="name-status name-status--bad">{t("welcome.name_taken_short")}</p>
      )}

      <input
        className={`input${status === "taken" ? " input--bad" : ""}`}
        value={name}
        maxLength={40}
        placeholder={t("welcome.name_ph")}
        autoFocus
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && startOnline()}
      />

      <button
        className="btn btn--primary"
        disabled={!trimmed || busy || status === "taken"}
        onClick={startOnline}
      >
        {t("welcome.online")}
      </button>
      <button className="btn btn--ghost" disabled={!trimmed || busy} onClick={startLocal}>
        {t("welcome.local")}
      </button>

      <p className="hint">{t("welcome.hint")}</p>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
