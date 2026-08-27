"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AttendanceRecord, Employee } from "@/lib/types";

export default function AttendanceBoard({
  employees,
  records,
}: {
  employees: Employee[];
  records: AttendanceRecord[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const recordsByEmployee = new Map<string, AttendanceRecord[]>();
  for (const r of records) {
    const list = recordsByEmployee.get(r.employeeId) ?? [];
    list.push(r);
    recordsByEmployee.set(r.employeeId, list);
  }

  function draftValue(r: AttendanceRecord): string {
    return drafts[r.id] ?? r.observaciones;
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
      <div className="card overflow-x-auto p-0">
        <table className="table-base">
          <thead>
            <tr>
              <th>Empleado</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 && (
              <tr>
                <td colSpan={3} className="py-8 text-center text-slate-400">
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

              return (
                <tr key={emp.id}>
                  <td className="font-medium">{emp.nombre}</td>
                  <td>
                    {!last && <span className="badge-gray">Sin fichar hoy</span>}
                    {last && open && (
                      <span className="badge-green">En jornada desde {last.horaEntrada}</span>
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

      <div>
        <h2 className="mb-3 text-lg font-semibold">Fichajes de hoy</h2>
        <div className="card overflow-x-auto p-0">
          <table className="table-base">
            <thead>
              <tr>
                <th>Empleado</th>
                <th>Entrada</th>
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
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Todavía no hay fichajes hoy.
                  </td>
                </tr>
              )}
              {records.map((r) => {
                const emp = employees.find((e) => e.id === r.employeeId);
                const value = draftValue(r);
                return (
                  <tr key={r.id}>
                    <td className="font-medium">{emp?.nombre ?? r.registro}</td>
                    <td>{r.horaEntrada}</td>
                    <td>{r.horaSalida ?? "—"}</td>
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
                      <button
                        className="btn-secondary whitespace-nowrap"
                        disabled={!emp?.email || !value.trim() || sendingEmail === r.id}
                        title={!emp?.email ? "El empleado no tiene email cargado" : undefined}
                        onClick={() => enviarMail(r)}
                      >
                        {sendingEmail === r.id ? "Enviando..." : "Enviar mail"}
                      </button>
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
