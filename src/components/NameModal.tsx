import { useState } from "react";
import { useI18n } from "../i18n";

interface Props {
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

/** Asks who's playing before showing the board. New child every turn. */
export function NameModal({ onConfirm, onCancel }: Props) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const trimmed = name.trim();

  function confirm() {
    if (trimmed) onConfirm(trimmed);
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{t("name.title")}</h2>
        <input
          className="input"
          value={name}
          maxLength={40}
          placeholder={t("name.ph")}
          autoFocus
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && confirm()}
        />
        <button className="btn btn--primary" disabled={!trimmed} onClick={confirm}>
          {t("name.start")}
        </button>
        <button className="link link--center" onClick={onCancel}>
          {t("name.cancel")}
        </button>
      </div>
    </div>
  );
}
