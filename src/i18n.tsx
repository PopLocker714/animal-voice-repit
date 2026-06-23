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
  "welcome.name_q": "Как тебя зовут?",
  "welcome.name_ph": "Имя",
  "welcome.online": "🌍 Играть онлайн",
  "welcome.local": "📴 Играть локально (без интернета)",
  "welcome.hint":
    "Онлайн — результат попадает в общую таблицу. Локально — всё хранится только на этом устройстве.",
  "welcome.server_err": "Сервер недоступен. Можно сыграть локально 📴",
  "welcome.name_taken": "Это имя уже занято. Выбери другое 🙂",
  "welcome.name_checking": "Проверяю имя…",
  "welcome.name_free": "Имя свободно ✓",
  "welcome.name_taken_short": "Имя уже занято ✗",
  "welcome.view_table": "📊 Таблица игры",
  "welcome.table_title": "Таблица игры",
  "game.progress": "Животное {n} из {total} · {name}",
  "game.listen_again": "🔊 Послушать ещё раз",
  "game.listening": "🔊 Слушай звук…",
  "game.repeat": "🎤 Повторить",
  "game.stop": "⏹ Стоп",
  "game.scoring": "Слушаю… 🧠",
  "game.retry_hint": "Почти не слышно — давай ещё разок 🎤",
  "game.retry": "🎤 Ещё раз",
  "game.skip": "Всё равно дальше →",
  "game.next": "Дальше →",
  "game.finish": "Посмотреть результат 🏁",
  "game.err_mic_unsupported": "Микрофон недоступен. Нужен https или localhost.",
  "game.err_mic_denied": "Нет доступа к микрофону.",
  "game.err_record": "Не получилось записать. Попробуй ещё раз.",
  "verdict.perfect": "Идеально! 🌟",
  "verdict.veryClose": "Супер! 🎉",
  "verdict.notBad": "Здорово! 👍",
  "verdict.couldBetter": "Молодец! 😊",
  "verdict.tryAgain": "Хорошая попытка! 💪",
  "verdict.nothingHeard": "Тебя не слышно 🎤",
  "results.done": "🏁 Готово, {name}!",
  "results.first_place": "🥇 Ты на 1 месте!",
  "results.place": "Ты на {n} месте",
  "results.local_badge": "📴 Локальная игра — только на этом устройстве",
  "results.avg": "в среднем",
  "results.total": "всего очков",
  "results.table": "Таблица",
  "results.your_animals": "Твои звери",
  "results.new_player": "👤 Новый игрок",
  "admin.title": "👑 Админ",
  "admin.reset": "Сбросить игру",
  "admin.tab_players": "🏆 По игрокам",
  "admin.tab_animals": "🐾 По животным",
  "admin.connecting": "Подключаюсь…",
  "admin.no_players": "Пока нет игроков.",
  "admin.back": "← Назад",
  "admin.avg_result": "Средний результат: {n}%",
  "admin.no_results": "Пока нет результатов.",
  "admin.nobody": "ещё никто",
  "admin.reset_confirm": "Сбросить игру? Все игроки и записи будут удалены.",
  "admin.err_open": "Не удалось открыть игрока.",
  "admin.err_reset": "Сброс не удался.",
  "admin.err_load": "Не удалось загрузить.",
  "lb.name": "Имя",
  "lb.points": "Очки",
  "lb.avg": "Сред.",
  "lb.played": "Сыграно",
  "lb.you": " — ты",
  "common.dots": "…",
};

const EN: Dict = {
  "app.title": "Repeat after the animal",
  "welcome.name_q": "What's your name?",
  "welcome.name_ph": "Name",
  "welcome.online": "🌍 Play online",
  "welcome.local": "📴 Play offline (local)",
  "welcome.hint":
    "Online — your result joins the shared table. Local — everything stays only on this device.",
  "welcome.server_err": "Server unavailable. You can play offline 📴",
  "welcome.name_taken": "That name is taken. Pick another 🙂",
  "welcome.name_checking": "Checking name…",
  "welcome.name_free": "Name available ✓",
  "welcome.name_taken_short": "Name already taken ✗",
  "welcome.view_table": "📊 Game leaderboard",
  "welcome.table_title": "Game leaderboard",
  "game.progress": "Animal {n} of {total} · {name}",
  "game.listen_again": "🔊 Listen again",
  "game.listening": "🔊 Listen to the sound…",
  "game.repeat": "🎤 Repeat",
  "game.stop": "⏹ Stop",
  "game.scoring": "Listening… 🧠",
  "game.retry_hint": "Could barely hear you — let's try again 🎤",
  "game.retry": "🎤 Again",
  "game.skip": "Continue anyway →",
  "game.next": "Next →",
  "game.finish": "See results 🏁",
  "game.err_mic_unsupported": "Microphone unavailable. Needs https or localhost.",
  "game.err_mic_denied": "No microphone access.",
  "game.err_record": "Recording failed. Try again.",
  "verdict.perfect": "Perfect! 🌟",
  "verdict.veryClose": "Awesome! 🎉",
  "verdict.notBad": "Great job! 👍",
  "verdict.couldBetter": "Nice try! 😊",
  "verdict.tryAgain": "Good effort! 💪",
  "verdict.nothingHeard": "I can't hear you 🎤",
  "results.done": "🏁 Done, {name}!",
  "results.first_place": "🥇 You're in 1st place!",
  "results.place": "You're #{n}",
  "results.local_badge": "📴 Local game — only on this device",
  "results.avg": "average",
  "results.total": "total points",
  "results.table": "Leaderboard",
  "results.your_animals": "Your animals",
  "results.new_player": "👤 New player",
  "admin.title": "👑 Admin",
  "admin.reset": "Reset game",
  "admin.tab_players": "🏆 By players",
  "admin.tab_animals": "🐾 By animals",
  "admin.connecting": "Connecting…",
  "admin.no_players": "No players yet.",
  "admin.back": "← Back",
  "admin.avg_result": "Average score: {n}%",
  "admin.no_results": "No results yet.",
  "admin.nobody": "nobody yet",
  "admin.reset_confirm": "Reset game? All players and recordings will be deleted.",
  "admin.err_open": "Couldn't open player.",
  "admin.err_reset": "Reset failed.",
  "admin.err_load": "Couldn't load.",
  "lb.name": "Name",
  "lb.points": "Points",
  "lb.avg": "Avg",
  "lb.played": "Played",
  "lb.you": " — you",
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
