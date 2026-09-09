"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AppUser, Rol } from "@/lib/types";

interface Draft {
  email: string;
  rol: Rol;
  employeeId: string;
  password: string;
}

export default function UsuariosTable({
  users,
  employees,
  apiBase = "/api/usuarios",
}: {
  users: AppUser[];
  employees: { id: string; nombre: string }[];
  apiBase?: string;
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({
    email: "",
    rol: "Empleado",
    employeeId: "",
    password: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEdit(u: AppUser) {
    setEditingId(u.id);
    setDraft({
      email: u.email,
      rol: u.rol,
      employeeId: u.employeeId ?? employees[0]?.id ?? "",
      password: "",
    });
    setError(null);
  }

  async function saveEdit(id: string) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: draft.email,
          rol: draft.rol,
          employeeId: draft.rol === "Empleado" ? draft.employeeId : null,
          ...(draft.password ? { password: draft.password } : {}),
        }),
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

  const employeeName = new Map(employees.map((e) => [e.id, e.nombre]));

  return (
    <div className="card overflow-x-auto p-0">
      {error && <p className="m-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <table className="table-base">
        <thead>
          <tr>
            <th>Email</th>
            <th>Rol</th>
            <th>Empleado vinculado</th>
            <th>Contraseña</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 && (
            <tr>
              <td colSpan={5} className="py-8 text-center text-slate-400">
                Todavía no hay usuarios cargados.
              </td>
            </tr>
          )}
          {users.map((u) => {
            const isEditing = editingId === u.id;
            return (
              <tr key={u.id}>
                {isEditing ? (
                  <>
                    <td>
                      <input
                        type="email"
                        className="input"
                        value={draft.email}
                        onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
                      />
                    </td>
                    <td>
                      <select
                        className="input"
                        value={draft.rol}
                        onChange={(e) => setDraft((d) => ({ ...d, rol: e.target.value as Rol }))}
                      >
                        <option value="Empleado">Empleado</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      {draft.rol === "Empleado" ? (
                        <select
                          className="input"
                          value={draft.employeeId}
                          onChange={(e) => setDraft((d) => ({ ...d, employeeId: e.target.value }))}
                        >
                          {employees.length === 0 && <option value="">No hay empleados</option>}
                          {employees.map((e) => (
                            <option key={e.id} value={e.id}>
                              {e.nombre}
                            </option>
                          ))}
                        </select>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <input
                        type="password"
                        className="input"
                        placeholder="Dejar vacío para no cambiarla"
                        minLength={6}
                        value={draft.password}
                        onChange={(e) => setDraft((d) => ({ ...d, password: e.target.value }))}
                      />
                    </td>
                    <td className="whitespace-nowrap">
                      <button
                        className="mr-2 text-sm font-medium text-indigo-600 hover:underline"
                        disabled={saving}
                        onClick={() => saveEdit(u.id)}
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
                    <td className="font-medium">{u.email}</td>
                    <td>
                      <span className={u.rol === "Admin" ? "badge-red" : "badge-gray"}>{u.rol}</span>
                    </td>
                    <td>{u.employeeId ? (employeeName.get(u.employeeId) ?? "—") : "—"}</td>
                    <td className="text-slate-400">••••••••</td>
                    <td className="whitespace-nowrap">
                      <button
                        className="text-sm font-medium text-indigo-600 hover:underline"
                        onClick={() => startEdit(u)}
                      >
                        Editar
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
