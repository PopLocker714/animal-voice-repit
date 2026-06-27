import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "ru" | "en";

const STORE_KEY = "avg.lang";

/** Device language → app language. RU for Russian, EN for everything else. */
function detectLang(): Lang {
  const n = (typeof navigator !== "undefined" && navigator.language ? navigator.language : "ru").toLowerCase();
  if (n.startsWith("ru")) return "ru";
  if (n.startsWith("en")) return "en";
  return "en";
}

function loadLang(): Lang {
  try {
    const saved = localStorage.getItem(STORE_KEY);
    if (saved === "ru" || saved === "en") return saved;
  } catch {
    /* ignore */
  }
  return detectLang();
}

type Dict = Record<string, string>;

const RU: Dict = {
  "app.title": "Повтори за животным",
  "welcome.tagline": "Выбери карточку и повтори за животным! 🐾",
  "welcome.play": "▶️ Играть",
  "welcome.view_table": "📊 Таблица игры",
  "welcome.table_title": "Таблица игры",
  "name.title": "Кто играет?",
  "name.ph": "Имя",
  "name.start": "Начать 🎲",
  "name.cancel": "Отмена",
  "board.pick": "{name}, выбери карточку 👇",
  "board.left": "Осталось карточек: {n} из {total}",
  "game.listen_again": "🔊 Послушать ещё раз",
  "game.listening": "🔊 Слушай звук…",
  "game.repeat": "🎤 Повторить",
  "game.stop": "⏹ Стоп",
  "game.scoring": "Слушаю… 🧠",
  "game.retry_hint": "Почти не слышно — давай ещё разок 🎤",
  "game.retry": "🎤 Ещё раз",
  "game.skip": "Всё равно записать →",
  "game.done": "Готово 🏁",
  "game.err_mic_unsupported": "Микрофон недоступен. Нужен https или localhost.",
  "game.err_mic_denied": "Нет доступа к микрофону.",
  "game.err_record": "Не получилось записать. Попробуй ещё раз.",
  "verdict.perfect": "Идеально! 🌟",
  "verdict.veryClose": "Супер! 🎉",
  "verdict.notBad": "Здорово! 👍",
  "verdict.couldBetter": "Молодец! 😊",
  "verdict.tryAgain": "Хорошая попытка! 💪",
  "verdict.nothingHeard": "Тебя не слышно 🎤",
  "admin.title": "👑 Админ",
  "admin.reset": "Сбросить игру",
  "admin.fullscreen": "⛶ Во весь экран",
  "admin.connecting": "Подключаюсь…",
  "admin.no_players": "Пока никто не играл.",
  "admin.back": "← Назад",
  "admin.avg_result": "Средний результат: {n}%",
  "admin.total_plays": "Всего ходов: {n}",
  "admin.reset_confirm": "Сбросить игру? Все записи будут удалены.",
  "admin.err_reset": "Сброс не удался.",
  "table.name": "Имя",
  "table.animal": "Животное",
  "table.score": "Оценка",
  "table.time": "Время",
  "common.dots": "…",
};

const EN: Dict = {
  "app.title": "Repeat after the animal",
  "welcome.tagline": "Pick a card and repeat after the animal! 🐾",
  "welcome.play": "▶️ Play",
  "welcome.view_table": "📊 Results table",
  "welcome.table_title": "Results table",
  "name.title": "Who's playing?",
  "name.ph": "Name",
  "name.start": "Start 🎲",
  "name.cancel": "Cancel",
  "board.pick": "{name}, pick a card 👇",
  "board.left": "Cards left: {n} of {total}",
  "game.listen_again": "🔊 Listen again",
  "game.listening": "🔊 Listen to the sound…",
  "game.repeat": "🎤 Repeat",
  "game.stop": "⏹ Stop",
  "game.scoring": "Listening… 🧠",
  "game.retry_hint": "Could barely hear you — let's try again 🎤",
  "game.retry": "🎤 Again",
  "game.skip": "Record it anyway →",
  "game.done": "Done 🏁",
  "game.err_mic_unsupported": "Microphone unavailable. Needs https or localhost.",
  "game.err_mic_denied": "No microphone access.",
  "game.err_record": "Recording failed. Try again.",
  "verdict.perfect": "Perfect! 🌟",
  "verdict.veryClose": "Awesome! 🎉",
  "verdict.notBad": "Great job! 👍",
  "verdict.couldBetter": "Nice try! 😊",
  "verdict.tryAgain": "Good effort! 💪",
  "verdict.nothingHeard": "I can't hear you 🎤",
  "admin.title": "👑 Admin",
  "admin.reset": "Reset game",
  "admin.fullscreen": "⛶ Fullscreen",
  "admin.connecting": "Connecting…",
  "admin.no_players": "Nobody has played yet.",
  "admin.back": "← Back",
  "admin.avg_result": "Average score: {n}%",
  "admin.total_plays": "Total plays: {n}",
  "admin.reset_confirm": "Reset game? All records will be deleted.",
  "admin.err_reset": "Reset failed.",
  "table.name": "Name",
  "table.animal": "Animal",
  "table.score": "Score",
  "table.time": "Time",
  "common.dots": "…",
};

const DICT: Record<Lang, Dict> = { ru: RU, en: EN };

export type TParams = Record<string, string | number>;
export type TFn = (key: string, params?: TParams) => string;

function format(s: string, params?: TParams): string {
  if (!params) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? ""));
}

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: TFn;
}

const I18nContext = createContext<Ctx>({ lang: "ru", setLang: () => {}, t: (k) => k });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(loadLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = `${DICT[lang]["app.title"]} 🐑`;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    try {
      localStorage.setItem(STORE_KEY, l);
    } catch {
      /* ignore */
    }
    setLangState(l);
  }, []);

  const t = useCallback<TFn>(
    (key, params) => format(DICT[lang][key] ?? DICT.ru[key] ?? key, params),
    [lang]
  );

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
