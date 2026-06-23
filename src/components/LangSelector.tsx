import { useI18n, type Lang } from "../i18n";

const OPTIONS: { lang: Lang; flag: string; label: string }[] = [
  { lang: "ru", flag: "🇷🇺", label: "Русский" },
  { lang: "en", flag: "🇺🇸", label: "English" },
];

/** Segmented language picker (shown on the welcome screen, before the game). */
export function LangSelector() {
  const { lang, setLang } = useI18n();
  return (
    <div className="lang-seg" role="group" aria-label="Language">
      {OPTIONS.map((o) => (
        <button
          key={o.lang}
          className={`lang-seg__opt${lang === o.lang ? " lang-seg__opt--on" : ""}`}
          onClick={() => setLang(o.lang)}
          aria-pressed={lang === o.lang}
        >
          <span className="lang-seg__flag">{o.flag}</span>
          {o.label}
        </button>
      ))}
    </div>
  );
}
