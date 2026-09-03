import { Suspense } from "react";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="relative -mx-4 -my-6 flex min-h-[calc(100vh-1px)] flex-col items-center justify-center gap-8 overflow-hidden px-4 py-10 sm:-mx-6 sm:-my-8 sm:px-6">
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: `
            radial-gradient(circle at 80% 12%, rgba(0,0,0,0.55) 0%, transparent 45%),
            radial-gradient(ellipse 60% 48% at 32% 76%, #ffffff 0%, #e2e2ff 16%, rgba(226,226,255,0) 55%),
            linear-gradient(155deg, #030014 0%, #100d5e 28%, #2c3af0 58%, #050318 100%)
          `,
        }}
      />

      <div className="flex items-center gap-2.5 text-center">
        <span className="text-4xl font-bold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)]">
          Puntual
        </span>
        <svg viewBox="0 0 40 22" className="h-5 w-9 drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]">
          <rect width="40" height="22" rx="11" fill="#0a0a1a" />
          <circle cx="29" cy="11" r="8" fill="#ffffff" />
        </svg>
      </div>
      <p className="-mt-6 text-sm text-white/70">Ingresá con tu email y contraseña.</p>

      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
