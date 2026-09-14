"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CompanyWithStats } from "@/lib/notion";

type VencimientoFiltro = "todos" | "vencida" | "gracia" | "activa" | "sin";
type OrdenKey = "nombre" | "vencimiento" | "plan";

const VENCIMIENTO_OPTIONS: { value: VencimientoFiltro; label: string }[] = [
  { value: "todos", label: "Todos los estados" },
  { value: "vencida", label: "Vencidas" },
  { value: "gracia", label: "En gracia" },
  { value: "activa", label: "Al día" },
  { value: "sin", label: "Sin vencimiento" },
];

const ORDEN_OPTIONS: { value: OrdenKey; label: string }[] = [
  { value: "nombre", label: "Ordenar por nombre" },
  { value: "vencimiento", label: "Ordenar por vencimiento" },
  { value: "plan", label: "Ordenar por plan" },
];

function coincideVencimiento(e: CompanyWithStats, filtro: VencimientoFiltro): boolean {
  switch (filtro) {
    case "vencida":
      return e.vencida;
    case "gracia":
      return e.pagoVencido && !e.vencida;
    case "activa":
      return !e.pagoVencido;
    case "sin":
      return !e.fechaVencimiento;
    default:
      return true;
  }
}

export default function EmpresasTable({ empresas }: { empresas: CompanyWithStats[] }) {
  const [busqueda, setBusqueda] = useState("");
  const [plan, setPlan] = useState("todos");
  const [vencimiento, setVencimiento] = useState<VencimientoFiltro>("todos");
  const [orden, setOrden] = useState<OrdenKey>("nombre");

  const planes = useMemo(() => {
    const set = new Set(empresas.map((e) => e.planNombre).filter((p): p is string => !!p));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es"));
  }, [empresas]);

  const empresasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const filtradas = empresas.filter((e) => {
      if (q && !e.nombre.toLowerCase().includes(q)) return false;
      if (plan !== "todos" && e.planNombre !== plan) return false;
      if (!coincideVencimiento(e, vencimiento)) return false;
      return true;
    });

    return [...filtradas].sort((a, b) => {
      if (orden === "plan") return (a.planNombre ?? "").localeCompare(b.planNombre ?? "", "es");
      if (orden === "vencimiento") {
        if (!a.fechaVencimiento && !b.fechaVencimiento) return 0;
        if (!a.fechaVencimiento) return 1;
        if (!b.fechaVencimiento) return -1;
        return a.fechaVencimiento.localeCompare(b.fechaVencimiento);
      }
      return a.nombre.localeCompare(b.nombre, "es");
    });
  }, [empresas, busqueda, plan, vencimiento, orden]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <svg
            viewBox="0 0 24 24"
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
            fill="none"
            stroke="var(--foreground-muted)"
            strokeWidth={2}
          >
            <circle cx="11" cy="11" r="7" />
            <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            className="input pl-9"
            placeholder="Buscar empresa..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <select className="input w-auto" value={plan} onChange={(e) => setPlan(e.target.value)}>
          <option value="todos">Todos los planes</option>
          {planes.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          className="input w-auto"
          value={vencimiento}
          onChange={(e) => setVencimiento(e.target.value as VencimientoFiltro)}
        >
          {VENCIMIENTO_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select className="input w-auto" value={orden} onChange={(e) => setOrden(e.target.value as OrdenKey)}>
          {ORDEN_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="table-base">
          <thead>
            <tr>
              <th>Empresa</th>
              <th>Estado</th>
              <th>Plan</th>
              <th>Empleados</th>
              <th>Admins</th>
              <th>Vencimiento</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {empresasFiltradas.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  {empresas.length === 0
                    ? "Todavía no hay empresas cargadas."
                    : "Ninguna empresa coincide con la búsqueda o los filtros."}
                </td>
              </tr>
            )}
            {empresasFiltradas.map((e) => (
              <tr key={e.id}>
                <td className="font-medium">
                  {e.color && (
                    <span
                      className="mr-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full align-middle"
                      style={{ background: e.color }}
                    />
                  )}
                  {e.nombre}
                  {e.grupoId && (
                    <span className="badge bg-purple-100 text-purple-800 ml-2 dark:bg-purple-500/15 dark:text-purple-300">
                      Sucursal
                    </span>
                  )}
                  {e.direccion && <p className="text-xs font-normal text-slate-400">{e.direccion}</p>}
                </td>
                <td>
                  {e.vencida ? (
                    <span className="badge-red">Vencida</span>
                  ) : e.pagoVencido ? (
                    <span className="badge bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                      En gracia
                    </span>
                  ) : (
                    <span className={e.estado === "Activo" ? "badge-green" : "badge-gray"}>
                      {e.estado}
                    </span>
                  )}
                </td>
                <td>{e.planNombre ?? "—"}</td>
                <td>
                  {e.totalEmpleadosActivos} / {e.maxEmpleados >= 999999 ? "∞" : e.maxEmpleados}
                </td>
                <td>
                  {e.totalAdmins} / {e.maxAdmins >= 999999 ? "∞" : e.maxAdmins}
                </td>
                <td>{e.fechaVencimiento ?? "Sin vencimiento"}</td>
                <td className="whitespace-nowrap">
                  <Link
                    href={`/superadmin/empresas/${e.id}`}
                    className="text-sm font-medium text-indigo-600 hover:underline"
                  >
                    Gestionar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
