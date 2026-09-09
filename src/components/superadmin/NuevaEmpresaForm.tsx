"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NuevaEmpresaForm() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [plan, setPlan] = useState("");
  const [maxEmpleados, setMaxEmpleados] = useState(4);
  const [maxAdmins, setMaxAdmins] = useState(1);
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/superadmin/empresas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          plan: plan || null,
          maxEmpleados,
          maxAdmins,
          fechaVencimiento: fechaVencimiento || null,
          adminEmail,
          adminPassword,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Error al crear la empresa");
      }
      router.push("/superadmin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la empresa");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card max-w-2xl space-y-4">
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div>
        <label className="label">Nombre de la empresa *</label>
        <input required className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Plan (etiqueta)</label>
          <input
            className="input"
            placeholder="Inicial, Premium, A medida..."
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Vencimiento de la suscripción</label>
          <input
            type="date"
            className="input"
            value={fechaVencimiento}
            onChange={(e) => setFechaVencimiento(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Máximo de empleados</label>
          <input
            type="number"
            min={0}
            className="input"
            value={maxEmpleados}
            onChange={(e) => setMaxEmpleados(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="label">Máximo de administradores</label>
          <input
            type="number"
            min={0}
            className="input"
            value={maxAdmins}
            onChange={(e) => setMaxAdmins(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="border-t pt-4" style={{ borderColor: "var(--border)" }}>
        <p className="mb-3 text-sm font-medium" style={{ color: "var(--foreground)" }}>
          Primer administrador de la empresa
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Email *</label>
            <input
              type="email"
              required
              className="input"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Contraseña *</label>
            <input
              type="password"
              required
              minLength={6}
              className="input"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
            />
          </div>
        </div>
      </div>

      <button type="submit" className="btn-primary" disabled={saving}>
        {saving ? "Creando..." : "Crear empresa"}
      </button>
    </form>
  );
}
