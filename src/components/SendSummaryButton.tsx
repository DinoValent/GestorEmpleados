"use client";

import { useState } from "react";

export default function SendSummaryButton({
  employeeId,
  hasEmail,
  dateFrom,
  dateTo,
}: {
  employeeId: string;
  hasEmail: boolean;
  dateFrom: string;
  dateTo: string;
}) {
  const [sending, setSending] = useState(false);

  async function enviar() {
    setSending(true);
    try {
      const res = await fetch("/api/reportes/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, dateFrom, dateTo }),
      });
      const data = await res.json().catch(() => ({}));
      alert(res.ok ? "Mail enviado" : data.error || "No se pudo enviar el mail");
    } finally {
      setSending(false);
    }
  }

  return (
    <button
      className="btn-secondary whitespace-nowrap"
      disabled={!hasEmail || sending}
      title={!hasEmail ? "El empleado no tiene email cargado" : undefined}
      onClick={enviar}
    >
      {sending ? "Enviando..." : "Enviar resumen"}
    </button>
  );
}
