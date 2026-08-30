"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type RangoTipo = "semana" | "mes" | "custom";

export default function HoursRangePicker({
  rango,
  from,
  to,
}: {
  rango: RangoTipo;
  from: string;
  to: string;
}) {
  const router = useRouter();
  const [tipo, setTipo] = useState<RangoTipo>(rango);
  const [desde, setDesde] = useState(from);
  const [hasta, setHasta] = useState(to);

  function ver() {
    const params = new URLSearchParams({ rango: tipo });
    if (tipo === "custom") {
      params.set("from", desde);
      params.set("to", hasta);
    }
    router.push(`/mi-fichaje?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="label">Período</label>
        <select
          className="input"
          value={tipo}
          onChange={(e) => setTipo(e.target.value as RangoTipo)}
        >
          <option value="semana">Esta semana</option>
          <option value="mes">Este mes</option>
          <option value="custom">Elegir fechas</option>
        </select>
      </div>
      {tipo === "custom" && (
        <>
          <div>
            <label className="label">Desde</label>
            <input
              type="date"
              className="input"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Hasta</label>
            <input
              type="date"
              className="input"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
            />
          </div>
        </>
      )}
      <button className="btn-primary" onClick={ver}>
        Ver
      </button>
    </div>
  );
}
