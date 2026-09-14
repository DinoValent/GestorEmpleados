"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CompanyWithStats } from "@/lib/notion";

type VencimientoFiltro = "todos" | "vencida" | "gracia" | "activa" | "sin";
type OrdenKey = "nombre" | "vencimiento" | "plan";
type OrdenDir = "asc" | "desc";
type MenuAbierto = "buscar" | "plan" | "vencimiento" | null;

const VENCIMIENTO_OPTIONS: { value: VencimientoFiltro; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "vencida", label: "Vencidas" },
  { value: "gracia", label: "En gracia" },
  { value: "activa", label: "Al día" },
  { value: "sin", label: "Sin vencimiento" },
];

function diasRelativos(fechaISO: string): string {
  const dias = Math.ceil((new Date(fechaISO).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (dias >= 0) return `en ${dias} ${dias === 1 ? "día" : "días"}`;
  return `hace ${Math.abs(dias)} ${Math.abs(dias) === 1 ? "día" : "días"}`;
}

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

function SortIcon({ dir }: { dir: OrdenDir | null }) {
  return (
    <svg viewBox="0 0 24 24" className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5}>
      {dir !== "desc" && <path strokeLinecap="round" strokeLinejoin="round" d="M6 15l6-6 6 6" opacity={dir === "asc" ? 1 : 0.35} />}
      {dir !== "asc" && <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" opacity={dir === "desc" ? 1 : 0.35} />}
    </svg>
  );
}

function FilterIcon({ activo }: { activo: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5 shrink-0"
      fill={activo ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h16l-6 7.5V19l-4 2v-8.5L4 5z" />
    </svg>
  );
}

/** Popover flotante fuera del flujo de la tabla (portal a body, position: fixed
 * calculado desde el botón que lo abre) — así no lo recorta el contenedor con
 * overflow-x-auto de la tabla ni se rompe el layout cuando quedan pocas filas. */
function Popover({
  pos,
  onRequestClose,
  children,
}: {
  pos: { top: number; left: number };
  onRequestClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onRequestClose();
    }
    function onScrollOrResize() {
      onRequestClose();
    }
    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [onRequestClose]);

  return createPortal(
    <div
      ref={ref}
      className="fixed z-50 rounded-lg border shadow-lg"
      style={{ top: pos.top, left: pos.left, background: "var(--surface)", borderColor: "var(--border)" }}
    >
      {children}
    </div>,
    document.body
  );
}

export default function EmpresasTable({ empresas }: { empresas: CompanyWithStats[] }) {
  const [busqueda, setBusqueda] = useState("");
  const [plan, setPlan] = useState("todos");
  const [vencimiento, setVencimiento] = useState<VencimientoFiltro>("todos");
  const [orden, setOrden] = useState<{ key: OrdenKey; dir: OrdenDir }>({ key: "nombre", dir: "asc" });
  const [menuAbierto, setMenuAbierto] = useState<MenuAbierto>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  const planes = useMemo(() => {
    const set = new Set(empresas.map((e) => e.planNombre).filter((p): p is string => !!p));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es"));
  }, [empresas]);

  function toggleOrden(key: OrdenKey) {
    setOrden((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
    );
  }

  function toggleMenu(m: Exclude<MenuAbierto, null>, boton: HTMLButtonElement) {
    if (menuAbierto === m) {
      setMenuAbierto(null);
      return;
    }
    const r = boton.getBoundingClientRect();
    setMenuPos({ top: r.bottom + 6, left: r.left });
    setMenuAbierto(m);
  }

  const hayFiltrosActivos = busqueda !== "" || plan !== "todos" || vencimiento !== "todos";

  function quitarFiltros() {
    setBusqueda("");
    setPlan("todos");
    setVencimiento("todos");
    setMenuAbierto(null);
  }

  const empresasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const filtradas = empresas.filter((e) => {
      if (q && !e.nombre.toLowerCase().includes(q)) return false;
      if (plan !== "todos" && e.planNombre !== plan) return false;
      if (!coincideVencimiento(e, vencimiento)) return false;
      return true;
    });

    const dirMul = orden.dir === "asc" ? 1 : -1;
    return [...filtradas].sort((a, b) => {
      if (orden.key === "plan") return dirMul * (a.planNombre ?? "").localeCompare(b.planNombre ?? "", "es");
      if (orden.key === "vencimiento") {
        if (!a.fechaVencimiento && !b.fechaVencimiento) return 0;
        if (!a.fechaVencimiento) return 1;
        if (!b.fechaVencimiento) return -1;
        return dirMul * a.fechaVencimiento.localeCompare(b.fechaVencimiento);
      }
      return dirMul * a.nombre.localeCompare(b.nombre, "es");
    });
  }, [empresas, busqueda, plan, vencimiento, orden]);

  return (
    <div className="card overflow-x-auto p-0">
      <table className="table-base">
        <thead>
          <tr>
            <th>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => toggleOrden("nombre")}
                  className="inline-flex items-center gap-1 hover:opacity-70"
                >
                  Empresa
                  <SortIcon dir={orden.key === "nombre" ? orden.dir : null} />
                </button>
                <button
                  type="button"
                  onClick={(e) => toggleMenu("buscar", e.currentTarget)}
                  aria-label="Buscar empresa"
                  className="rounded p-0.5 hover:opacity-70"
                  style={{ color: busqueda ? "var(--accent)" : "inherit" }}
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle cx="11" cy="11" r="7" />
                    <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
                  </svg>
                </button>
              </div>
              {menuAbierto === "buscar" && (
                <Popover pos={menuPos} onRequestClose={() => setMenuAbierto(null)}>
                  <div className="p-2">
                    <input
                      autoFocus
                      type="text"
                      className="input w-56 text-sm normal-case"
                      placeholder="Buscar por nombre..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                    />
                  </div>
                </Popover>
              )}
            </th>
            <th>
              <div className="flex items-center gap-1.5">
                <span>Estado</span>
                <button
                  type="button"
                  onClick={(e) => toggleMenu("vencimiento", e.currentTarget)}
                  aria-label="Filtrar por estado"
                  className="rounded p-0.5 hover:opacity-70"
                  style={{ color: vencimiento !== "todos" ? "var(--accent)" : "inherit" }}
                >
                  <FilterIcon activo={vencimiento !== "todos"} />
                </button>
              </div>
              {menuAbierto === "vencimiento" && (
                <Popover pos={menuPos} onRequestClose={() => setMenuAbierto(null)}>
                  <div className="w-40 p-1">
                    {VENCIMIENTO_OPTIONS.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => {
                          setVencimiento(o.value);
                          setMenuAbierto(null);
                        }}
                        className="block w-full rounded-md px-2 py-1.5 text-left text-xs font-normal normal-case hover:bg-[var(--surface-hover)]"
                        style={{
                          color: o.value === vencimiento ? "var(--accent)" : "var(--foreground)",
                          fontWeight: o.value === vencimiento ? 600 : 400,
                        }}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </Popover>
              )}
            </th>
            <th>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => toggleOrden("plan")}
                  className="inline-flex items-center gap-1 hover:opacity-70"
                >
                  Plan
                  <SortIcon dir={orden.key === "plan" ? orden.dir : null} />
                </button>
                <button
                  type="button"
                  onClick={(e) => toggleMenu("plan", e.currentTarget)}
                  aria-label="Filtrar por plan"
                  className="rounded p-0.5 hover:opacity-70"
                  style={{ color: plan !== "todos" ? "var(--accent)" : "inherit" }}
                >
                  <FilterIcon activo={plan !== "todos"} />
                </button>
              </div>
              {menuAbierto === "plan" && (
                <Popover pos={menuPos} onRequestClose={() => setMenuAbierto(null)}>
                  <div className="w-48 p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setPlan("todos");
                        setMenuAbierto(null);
                      }}
                      className="block w-full rounded-md px-2 py-1.5 text-left text-xs font-normal normal-case hover:bg-[var(--surface-hover)]"
                      style={{
                        color: plan === "todos" ? "var(--accent)" : "var(--foreground)",
                        fontWeight: plan === "todos" ? 600 : 400,
                      }}
                    >
                      Todos
                    </button>
                    {planes.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          setPlan(p);
                          setMenuAbierto(null);
                        }}
                        className="block w-full rounded-md px-2 py-1.5 text-left text-xs font-normal normal-case hover:bg-[var(--surface-hover)]"
                        style={{
                          color: p === plan ? "var(--accent)" : "var(--foreground)",
                          fontWeight: p === plan ? 600 : 400,
                        }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </Popover>
              )}
            </th>
            <th>Empleados</th>
            <th>Admins</th>
            <th>
              <button
                type="button"
                onClick={() => toggleOrden("vencimiento")}
                className="inline-flex items-center gap-1 hover:opacity-70"
              >
                Vencimiento
                <SortIcon dir={orden.key === "vencimiento" ? orden.dir : null} />
              </button>
            </th>
            <th className="text-right">
              {hayFiltrosActivos && (
                <button
                  type="button"
                  onClick={quitarFiltros}
                  aria-label="Quitar filtros"
                  title="Quitar filtros"
                  className="rounded p-0.5 normal-case opacity-60 hover:opacity-100"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              )}
            </th>
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
                {e.notas && (
                  <svg
                    viewBox="0 0 24 24"
                    className="ml-1.5 inline-block h-3.5 w-3.5 shrink-0 align-middle"
                    fill="none"
                    stroke="var(--foreground-muted)"
                    strokeWidth={2}
                  >
                    <title>{e.notas}</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7 8h10M7 12h6m-6 8-3-3H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-7l-3 3Z"
                    />
                  </svg>
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
              <td>
                {e.fechaVencimiento ? (
                  <>
                    {e.fechaVencimiento}{" "}
                    <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                      ({diasRelativos(e.fechaVencimiento)})
                    </span>
                  </>
                ) : (
                  "Sin vencimiento"
                )}
              </td>
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
  );
}
