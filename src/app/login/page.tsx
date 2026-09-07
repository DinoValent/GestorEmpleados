import { Suspense } from "react";
import BrandHeroBackground from "@/components/BrandHeroBackground";
import LoginForm from "@/components/LoginForm";
import Logo from "@/components/Logo";

export default function LoginPage() {
  return (
    <div className="relative -mx-4 -my-6 flex min-h-[calc(100vh-1px)] flex-col items-center justify-center gap-8 overflow-hidden px-4 py-10 sm:-mx-6 sm:-my-8 sm:px-6">
      <div className="fixed inset-0 -z-10">
        <BrandHeroBackground />
      </div>

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
