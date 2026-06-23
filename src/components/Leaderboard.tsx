import type { LeaderRow } from "../api";
import { useI18n } from "../i18n";

interface Props {
  rows: LeaderRow[];
  highlightId?: number; // a player's row to emphasize (their own)
  onRowClick?: (id: number) => void;
}

export function Leaderboard({ rows, highlightId, onRowClick }: Props) {
  const { t } = useI18n();
  return (
    <table className="lb">
      <thead>
        <tr>
          <th>#</th>
          <th>{t("lb.name")}</th>
          <th>{t("lb.points")}</th>
          <th>{t("lb.avg")}</th>
          <th>{t("lb.played")}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => {
          const me = r.id === highlightId;
          return (
            <tr
              key={r.id}
              onClick={onRowClick ? () => onRowClick(r.id) : undefined}
              className={`lb__row${onRowClick ? " lb__row--click" : ""}${me ? " lb__row--me" : ""}`}
            >
              <td className={i === 0 ? "lb__rank lb__rank--top" : "lb__rank"}>
                {i === 0 ? "🥇" : i + 1}
              </td>
              <td>
                {r.name}
                {me && <span className="lb__you">{t("lb.you")}</span>}
              </td>
              <td>
                <b>{r.total}</b>
              </td>
              <td>{r.avg}%</td>
              <td>{r.count}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
