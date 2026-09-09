import { Suspense } from "react";
import Link from "next/link";
import BrandHeroBackground from "@/components/BrandHeroBackground";
import LoginForm from "@/components/LoginForm";
import Logo from "@/components/Logo";

export default function LoginPage() {
  return (
    <div className="relative -mx-4 -my-6 flex min-h-[calc(100vh-1px)] flex-col items-center justify-center gap-8 overflow-hidden px-4 py-10 sm:-mx-6 sm:-my-8 sm:px-6">
      <div className="fixed inset-0 -z-10">
        <BrandHeroBackground />
      </div>

      <Link
        href="/"
        className="absolute top-6 left-4 inline-flex items-center gap-1.5 text-sm font-medium text-white/80 transition-colors hover:text-white sm:left-6"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
        </svg>
        Volver
      </Link>

      <div className="drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)]">
        <Logo invert size="lg" />
      </div>
      <p className="-mt-6 text-sm text-white/70">Ingresá con tu email y contraseña.</p>

      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
