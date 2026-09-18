"use client";

import { useSyncExternalStore } from "react";

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  localStorage.setItem("puntual-theme", dark ? "dark" : "light");
}

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

function getSnapshot() {
  return document.documentElement.classList.contains("dark");
}

function getServerSnapshot() {
  return false;
}

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle(event: React.MouseEvent<HTMLButtonElement>) {
    const root = document.documentElement;
    const rect = event.currentTarget.getBoundingClientRect();
    root.style.setProperty("--theme-toggle-x", `${rect.left + rect.width / 2}px`);
    root.style.setProperty("--theme-toggle-y", `${rect.top + rect.height / 2}px`);

    const next = !dark;
    if (typeof document.startViewTransition === "function") {
      root.classList.add("theme-transitioning");
      const transition = document.startViewTransition(() => applyTheme(next));
      // ready/updateCallbackDone/finished rechazan juntas si el navegador aborta
      // la transición (pestaña oculta, otra transición encimada, etc.) — no es
      // un error real, solo se pierde la animación, así que se absorben todas
      // para que no queden promesas rechazadas sin capturar.
      transition.ready.catch(() => {});
      transition.updateCallbackDone.catch(() => {});
      transition.finished.catch(() => {}).finally(() => root.classList.remove("theme-transitioning"));
    } else {
      applyTheme(next);
    }
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      onClick={toggle}
      className={`relative inline-flex shrink-0 items-center rounded-full transition-colors duration-300 ${
        compact ? "h-8 w-14" : "h-9 w-16"
      } ${dark ? "bg-indigo-500" : "bg-slate-200"}`}
    >
      <span
        className={`absolute top-1 flex items-center justify-center rounded-full bg-white shadow-md transition-all duration-300 ${
          compact ? "h-6 w-6" : "h-7 w-7"
        } ${dark ? (compact ? "left-7" : "left-8") : "left-1"}`}
      >
        <svg
          viewBox="0 0 24 24"
          className={`${compact ? "h-3.5 w-3.5" : "h-4 w-4"} text-amber-500 transition-all duration-300 ${
            dark ? "scale-0 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"
          } absolute`}
          fill="currentColor"
        >
          <circle cx="12" cy="12" r="5" />
          <path
            strokeLinecap="round"
            strokeWidth={2}
            stroke="currentColor"
            d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"
          />
        </svg>
        <svg
          viewBox="0 0 24 24"
          className={`${compact ? "h-3.5 w-3.5" : "h-4 w-4"} text-indigo-600 transition-all duration-300 ${
            dark ? "scale-100 rotate-0 opacity-100" : "scale-0 -rotate-90 opacity-0"
          } absolute`}
          fill="currentColor"
        >
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      </span>
    </button>
  );
}
