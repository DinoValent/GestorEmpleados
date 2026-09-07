"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton({ className }: { className?: string }) {
  return (
    <button type="button" onClick={() => signOut({ callbackUrl: "/" })} className={className}>
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 8H5a2 2 0 01-2-2V6a2 2 0 012-2h8"
        />
      </svg>
      Cerrar sesión
    </button>
  );
}
