"use client";

import { useLocalToggle } from "@/lib/useLocalToggle";
import MiniSwitch from "./MiniSwitch";
import ThemeToggle from "./ThemeToggle";

export default function PreferencesCard() {
  const [tutorial, setTutorial] = useLocalToggle("puntual-tutorial", true);

  return (
    <div className="card space-y-4">
      <h2 className="font-semibold">Preferencias</h2>

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Modo oscuro</p>
          <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
            Se guarda en este dispositivo.
          </p>
        </div>
        <ThemeToggle compact />
      </div>

      <div className="flex items-center justify-between gap-4 border-t pt-4" style={{ borderColor: "var(--border-subtle)" }}>
        <div>
          <p className="text-sm font-medium">Modo tutorial</p>
          <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
            Íconos de ayuda (?) en cada pantalla de la app.
          </p>
        </div>
        <MiniSwitch checked={tutorial} onChange={setTutorial} />
      </div>
    </div>
  );
}
