import { animalName, ANIMALS_BY_ID } from "../data/animals";
import { AnimalIcon } from "./AnimalIcon";
import { AudioButton } from "./AudioButton";
import { useI18n } from "../i18n";
import type { PlayRow } from "../api";

interface Props {
  rows: PlayRow[];
  showAudio?: boolean; // admin can play back recordings
}

/** Flat live results table: who played, which animal they got, their score. */
export function PlaysTable({ rows, showAudio = false }: Props) {
  const { t, lang } = useI18n();
  return (
    <table className="lb">
      <thead>
        <tr>
          <th>#</th>
          <th>{t("table.name")}</th>
          <th>{t("table.animal")}</th>
          <th>{t("table.score")}</th>
          {showAudio && <th></th>}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => {
          const a = ANIMALS_BY_ID[r.animalId];
          return (
            <tr key={r.id} className="lb__row">
              <td className="lb__rank">{i + 1}</td>
              <td>
                <b>{r.name}</b>
              </td>
              <td>
                <AnimalIcon animal={a} className="table__emoji" />{" "}
                {animalName(a, lang) || r.animalId}
              </td>
              <td>
                <b className="table__pct">{r.percent}%</b>
              </td>
              {showAudio && (
                <td>
                  {r.audioUrl ? (
                    <AudioButton url={r.audioUrl} label="▶︎" className="btn-mini" />
                  ) : (
                    <span className="btn-mini btn-mini--off">—</span>
                  )}
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
