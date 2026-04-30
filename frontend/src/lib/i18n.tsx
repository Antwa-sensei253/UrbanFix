import * as React from "react";
import en from "@/locales/en";
import ar from "@/locales/ar";
import type { Translations } from "@/locales/en";

type Lang = "en" | "ar";

interface LangContextValue {
  lang: Lang;
  t: Translations;
  setLang: (l: Lang) => void;
  dir: "ltr" | "rtl";
}

const LangContext = React.createContext<LangContextValue>({
  lang: "en",
  t: en,
  setLang: () => {},
  dir: "ltr",
});

const LOCALES: Record<Lang, Translations> = { en, ar };

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = React.useState<Lang>(() => {
    if (typeof localStorage !== "undefined") {
      const stored = localStorage.getItem("lang") as Lang | null;
      if (stored === "ar" || stored === "en") return stored;
    }
    return "en";
  });

  const setLang = React.useCallback((l: Lang) => {
    setLangState(l);
    if (typeof localStorage !== "undefined") localStorage.setItem("lang", l);
  }, []);

  const dir: "ltr" | "rtl" = lang === "ar" ? "rtl" : "ltr";

  // Apply dir and lang to <html> element
  React.useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    if (lang === "ar") {
      document.body.style.fontFamily = "'Cairo', 'Segoe UI', sans-serif";
    } else {
      document.body.style.fontFamily = "";
    }
  }, [lang, dir]);

  return (
    <LangContext.Provider value={{ lang, t: LOCALES[lang], setLang, dir }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return React.useContext(LangContext);
}

export function useT() {
  return React.useContext(LangContext).t;
}
