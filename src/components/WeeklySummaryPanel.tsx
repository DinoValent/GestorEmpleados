"use client";

import { useState } from "react";

interface EmployeeOption {
  id: string;
  nombre: string;
}

export default function WeeklySummaryPanel({
  employees,
  defaultDateFrom,
  defaultDateTo,
}: {
  employees: EmployeeOption[];
  defaultDateFrom: string;
  defaultDateTo: string;
}) {
  const [open, setOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState(defaultDateFrom);
  const [dateTo, setDateTo] = useState(defaultDateTo);
  const [selected, setSelected] = useState<Set<string>>(new Set(employees.map((e) => e.id)));
  const [sending, setSending] = useState(false);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function enviar() {
    if (selected.size === 0) {
      alert("Elegí al menos un empleado");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/reportes/weekly-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateFrom,
          dateTo,
          employeeIds: Array.from(selected),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        alert("Resumen enviado a tu mail");
        setOpen(false);
      } else {
        alert(data.error || "No se pudo enviar");
      }
    } finally {
      setSending(false);
    }
  }

  if (!open) {
    return (
      <button className="btn-secondary" onClick={() => setOpen(true)}>
        Enviar resumen por mail
      </button>
    );
  }

  return (
    <div className="card w-full max-w-md space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Resumen de horas por mail</h3>
        <button
          className="text-sm text-slate-400 hover:text-slate-600"
          onClick={() => setOpen(false)}
        >
          Cerrar
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Desde</label>
          <input
            type="date"
            className="input"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Hasta</label>
          <input
            type="date"
            className="input"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="label mb-0">Empleados</label>
          <div className="flex gap-3 text-xs text-slate-500">
            <button
              type="button"
              className="hover:text-slate-800"
              onClick={() => setSelected(new Set(employees.map((e) => e.id)))}
            >
              Todos
            </button>
            <button
              type="button"
              className="hover:text-slate-800"
              onClick={() => setSelected(new Set())}
            >
              Ninguno
            </button>
          </div>
        </div>
        <div className="max-h-44 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
          {employees.length === 0 && (
            <p className="py-2 text-center text-sm text-slate-400">No hay empleados.</p>
          )}
          {employees.map((e) => (
            <label
              key={e.id}
              className="flex items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-slate-50"
            >
              <input
                type="checkbox"
                checked={selected.has(e.id)}
                onChange={() => toggle(e.id)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              {e.nombre}
            </label>
          ))}
        </div>
      </div>

      <button className="btn-primary w-full" disabled={sending} onClick={enviar}>
        {sending ? "Enviando..." : `Enviar a ${selected.size} empleado${selected.size === 1 ? "" : "s"}`}
      </button>
    </div>
  );
}
