"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AttendanceRecord, Employee } from "@/lib/types";

interface TimeDraft {
  horaEntrada: string;
  horaSalida: string;
}

interface ScheduleInfo {
  horaEntrada: string;
  horaSalida: string;
  rotativo: boolean;
}

export default function AttendanceBoard({
  employees,
  records,
  isToday = true,
  dateLabel,
  schedules = {},
}: {
  employees: Employee[];
  records: AttendanceRecord[];
  isToday?: boolean;
  dateLabel?: string;
  schedules?: Record<string, ScheduleInfo>;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [savingTimes, setSavingTimes] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [timeDrafts, setTimeDrafts] = useState<Record<string, TimeDraft>>({});

  const recordsByEmployee = new Map<string, AttendanceRecord[]>();
  for (const r of records) {
    const list = recordsByEmployee.get(r.employeeId) ?? [];
    list.push(r);
    recordsByEmployee.set(r.employeeId, list);
  }

  function draftValue(r: AttendanceRecord): string {
    return drafts[r.id] ?? r.observaciones;
  }

  function timeDraftFor(r: AttendanceRecord): TimeDraft {
    return timeDrafts[r.id] ?? { horaEntrada: r.horaEntrada, horaSalida: r.horaSalida ?? "" };
  }

  function timeChanged(r: AttendanceRecord): boolean {
    const d = timeDraftFor(r);
    return d.horaEntrada !== r.horaEntrada || d.horaSalida !== (r.horaSalida ?? "");
  }

  async function fichar(kind: "checkin" | "checkout", body: Record<string, string>) {
    setPending(body.employeeId ?? body.recordId ?? null);
    try {
      const res = await fetch(`/api/attendance/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "No se pudo registrar el fichaje");
      }
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  async function guardarObservaciones(recordId: string, observaciones: string) {
    await fetch(`/api/attendance/${recordId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ observaciones }),
    });
    router.refresh();
  }

  async function guardarHorario(r: AttendanceRecord) {
    const draft = timeDraftFor(r);
    setSavingTimes(r.id);
    try {
      const res = await fetch(`/api/attendance/${r.id}/times`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          horaEntrada: draft.horaEntrada,
          horaSalida: draft.horaSalida || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "No se pudo guardar el horario");
        return;
      }
      setTimeDrafts((d) => {
        const next = { ...d };
        delete next[r.id];
        return next;
      });
      router.refresh();
    } finally {
      setSavingTimes(null);
    }
  }

  async function enviarMail(record: AttendanceRecord) {
    setSendingEmail(record.id);
    try {
      const current = draftValue(record);
      // Aseguramos que la observación recién tipeada quede guardada en Notion
      // antes de mandar el mail, para no mandar contenido viejo.
      if (current !== record.observaciones) {
        await guardarObservaciones(record.id, current);
      }
      const res = await fetch(`/api/attendance/${record.id}/email`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "No se pudo enviar el mail");
      } else {
        alert("Mail enviado");
      }
    } finally {
      setSendingEmail(null);
    }
  }

  return (
    <div className="space-y-8">
      {isToday && (
        <div className="card overflow-x-auto p-0">
          <table className="table-base">
            <thead>
              <tr>
                <th>Empleado</th>
                <th>Horario habitual</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    No hay empleados activos.
                  </td>
                </tr>
              )}
              {employees.map((emp) => {
                const empRecords = recordsByEmployee.get(emp.id) ?? [];
                const openRecord = empRecords.find((r) => !r.horaSalida);
                const latestClosed = [...empRecords].sort((a, b) =>
                  b.horaEntrada.localeCompare(a.horaEntrada)
                )[0];
                const last = openRecord ?? latestClosed;
                const open = !!openRecord;

                const schedule = schedules[emp.id];
                const horaEntrada = schedule?.horaEntrada || emp.horarioEntrada;
                const horaSalida = schedule?.horaSalida || emp.horarioSalida;

                return (
                  <tr key={emp.id}>
                    <td className="font-medium">{emp.nombre}</td>
                    <td className="font-mono text-xs text-slate-500 whitespace-nowrap">
                      {horaEntrada || "—"} a {horaSalida || "—"}
                      {schedule?.rotativo && (
                        <span className="badge ml-1.5 bg-indigo-100 text-indigo-700">Rotativo</span>
                      )}
                    </td>
                    <td>
                      {!last && <span className="badge-gray">Sin fichar hoy</span>}
                      {last && open && (
                        <span className="inline-flex items-center gap-2">
                          <span className="badge-green">En jornada desde {last.horaEntrada}</span>
                          {last.latitud !== null && last.longitud !== null && (
                            <a
                              href={`https://www.google.com/maps?q=${last.latitud},${last.longitud}`}
                              target="_blank"
                              rel="noreferrer"
                              title={
                                last.precision !== null
                                  ? `Ver ubicación (±${last.precision} m)`
                                  : "Ver ubicación del fichaje"
                              }
                              className="text-indigo-600 hover:underline"
                            >
                              📍
                            </a>
                          )}
                        </span>
                      )}
                      {last && !open && (
                        <span className="badge-gray">
                          Jornada {last.horaEntrada} – {last.horaSalida}
                        </span>
                      )}
                    </td>
                    <td>
                      {open ? (
                        <button
                          className="btn-secondary"
                          disabled={pending === last.id}
                          onClick={() => fichar("checkout", { recordId: last.id })}
                        >
                          {pending === last.id ? "..." : "Fichar salida"}
                        </button>
                      ) : (
                        <button
                          className="btn-primary"
                          disabled={pending === emp.id}
                          onClick={() => fichar("checkin", { employeeId: emp.id })}
                        >
                          {pending === emp.id ? "..." : "Fichar entrada"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-lg font-semibold">
          Fichajes {isToday ? "de hoy" : dateLabel ? `del ${dateLabel}` : ""}
        </h2>
        <div className="card overflow-x-auto p-0">
          <table className="table-base">
            <thead>
              <tr>
                <th>Empleado</th>
                <th>Entrada</th>
                <th>Ubicación</th>
                <th>Salida</th>
                <th>Hs. trabajadas</th>
                <th>Hs. extra</th>
                <th>Llegada tarde</th>
                <th>Observaciones</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No hay fichajes {isToday ? "hoy" : "en esta fecha"}.
                  </td>
                </tr>
              )}
              {records.map((r) => {
                const emp = employees.find((e) => e.id === r.employeeId);
                const value = draftValue(r);
                const timeDraft = timeDraftFor(r);
                const changed = timeChanged(r);
                return (
                  <tr key={r.id}>
                    <td className="font-medium">{emp?.nombre ?? r.registro}</td>
                    <td>
                      <input
                        type="time"
                        className="input"
                        value={timeDraft.horaEntrada}
                        onChange={(e) =>
                          setTimeDrafts((d) => ({
                            ...d,
                            [r.id]: { ...timeDraftFor(r), horaEntrada: e.target.value },
                          }))
                        }
                      />
                    </td>
                    <td>
                      {r.latitud !== null && r.longitud !== null ? (
                        <a
                          href={`https://www.google.com/maps?q=${r.latitud},${r.longitud}`}
                          target="_blank"
                          rel="noreferrer"
                          className="whitespace-nowrap text-xs font-medium text-indigo-600 hover:underline"
                        >
                          📍 Ver mapa
                          {r.precision !== null && (
                            <span className="ml-1 font-normal text-slate-400">
                              (±{r.precision} m)
                            </span>
                          )}
                        </a>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td>
                      <input
                        type="time"
                        className="input"
                        value={timeDraft.horaSalida}
                        onChange={(e) =>
                          setTimeDrafts((d) => ({
                            ...d,
                            [r.id]: { ...timeDraftFor(r), horaSalida: e.target.value },
                          }))
                        }
                      />
                    </td>
                    <td>{r.horasTrabajadas ?? "—"}</td>
                    <td>{r.horasExtra ?? "—"}</td>
                    <td>
                      {r.llegadaTarde ? (
                        <span className="badge-red">
                          Sí ({r.minutosTardanza ?? 0} min)
                        </span>
                      ) : (
                        <span className="badge-green">No</span>
                      )}
                    </td>
                    <td>
                      <input
                        className="input"
                        value={value}
                        onChange={(e) =>
                          setDrafts((d) => ({ ...d, [r.id]: e.target.value }))
                        }
                        onBlur={(e) => {
                          if (e.target.value !== r.observaciones) {
                            guardarObservaciones(r.id, e.target.value);
                          }
                        }}
                      />
                    </td>
                    <td>
                      <div className="flex flex-col gap-1.5">
                        {changed && (
                          <button
                            className="btn-primary whitespace-nowrap"
                            disabled={savingTimes === r.id}
                            onClick={() => guardarHorario(r)}
                          >
                            {savingTimes === r.id ? "Guardando..." : "Guardar horario"}
                          </button>
                        )}
                        <button
                          className="btn-secondary whitespace-nowrap"
                          disabled={!emp?.email || !value.trim() || sendingEmail === r.id}
                          title={!emp?.email ? "El empleado no tiene email cargado" : undefined}
                          onClick={() => enviarMail(r)}
                        >
                          {sendingEmail === r.id ? "Enviando..." : "Enviar mail"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
