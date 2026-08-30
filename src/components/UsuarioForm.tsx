"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Rol } from "@/lib/types";

export default function UsuarioForm({
  employees,
}: {
  employees: { id: string; nombre: string }[];
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<Rol>("Empleado");
  const [employeeId, setEmployeeId] = useState(employees[0]?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          rol,
          employeeId: rol === "Empleado" ? employeeId : null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Error al guardar");
      }
      setEmail("");
      setPassword("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      <p className="text-sm text-slate-500">
        Si ya existe un usuario con ese email, se le actualiza la contraseña y el rol.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Email *</label>
          <input
            type="email"
            required
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Contraseña *</label>
          <input
            type="password"
            required
            minLength={6}
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Rol *</label>
          <select
            className="input"
            value={rol}
            onChange={(e) => setRol(e.target.value as Rol)}
          >
            <option value="Empleado">Empleado</option>
            <option value="Admin">Admin</option>
          </select>
        </div>
        {rol === "Empleado" && (
          <div>
            <label className="label">Empleado vinculado *</label>
            <select
              className="input"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
            >
              {employees.length === 0 && <option value="">No hay empleados</option>}
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      <button type="submit" className="btn-primary" disabled={saving}>
        {saving ? "Guardando..." : "Guardar usuario"}
      </button>
    </form>
  );
}
