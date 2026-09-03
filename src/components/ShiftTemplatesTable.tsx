"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ShiftTemplate, ShiftTemplateInput } from "@/lib/types";

export default function ShiftTemplatesTable({ shifts }: { shifts: ShiftTemplate[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Omit<ShiftTemplateInput, "empresaId">>({
    nombre: "",
    horaEntrada: "",
    horaSalida: "",
  });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function startEdit(s: ShiftTemplate) {
    setEditingId(s.id);
    setDraft({ nombre: s.nombre, horaEntrada: s.horaEntrada, horaSalida: s.horaSalida });
    setError(null);
  }

  async function saveEdit(id: string) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/turnos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al guardar");
      }
      setEditingId(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar este turno? Los empleados que lo tengan asignado van a volver a su horario fijo.")) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await fetch(`/api/turnos/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al eliminar");
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="card overflow-x-auto p-0">
      {error && <p className="m-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <table className="table-base">
        <thead>
          <tr>
            <th>Turno</th>
            <th>Entrada</th>
            <th>Salida</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {shifts.length === 0 && (
            <tr>
              <td colSpan={4} className="py-8 text-center text-slate-400">
                Todavía no hay turnos cargados.
              </td>
            </tr>
          )}
          {shifts.map((s) => {
            const isEditing = editingId === s.id;
            return (
              <tr key={s.id}>
                {isEditing ? (
                  <>
                    <td>
                      <input
                        className="input"
                        value={draft.nombre}
                        onChange={(e) => setDraft((d) => ({ ...d, nombre: e.target.value }))}
                      />
                    </td>
                    <td>
                      <input
                        type="time"
                        className="input"
                        value={draft.horaEntrada}
                        onChange={(e) => setDraft((d) => ({ ...d, horaEntrada: e.target.value }))}
                      />
                    </td>
                    <td>
                      <input
                        type="time"
                        className="input"
                        value={draft.horaSalida}
                        onChange={(e) => setDraft((d) => ({ ...d, horaSalida: e.target.value }))}
                      />
                    </td>
                    <td className="whitespace-nowrap">
                      <button
                        className="mr-2 text-sm font-medium text-indigo-600 hover:underline"
                        disabled={saving}
                        onClick={() => saveEdit(s.id)}
                      >
                        {saving ? "Guardando..." : "Guardar"}
                      </button>
                      <button
                        className="text-sm font-medium text-slate-500 hover:underline"
                        onClick={() => setEditingId(null)}
                      >
                        Cancelar
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="font-medium">{s.nombre}</td>
                    <td className="font-mono tabular-nums">{s.horaEntrada}</td>
                    <td className="font-mono tabular-nums">{s.horaSalida}</td>
                    <td className="whitespace-nowrap">
                      <button
                        className="mr-3 text-sm font-medium text-indigo-600 hover:underline"
                        onClick={() => startEdit(s)}
                      >
                        Editar
                      </button>
                      <button
                        className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
                        disabled={deletingId === s.id}
                        onClick={() => remove(s.id)}
                      >
                        {deletingId === s.id ? "Eliminando..." : "Eliminar"}
                      </button>
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
