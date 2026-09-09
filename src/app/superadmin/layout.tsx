import Link from "next/link";
import Logo from "@/components/Logo";
import SignOutButton from "@/components/SignOutButton";
import { auth } from "@/lib/auth";

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="min-h-screen">
      <header
        className="sticky top-0 z-40 border-b backdrop-blur-md"
        style={{ borderColor: "var(--border)", background: "color-mix(in srgb, var(--surface) 85%, transparent)" }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link href="/superadmin" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <Logo size="sm" />
            <span
              className="rounded-full px-2 py-0.5 text-xs font-medium"
              style={{ background: "var(--accent-soft)", color: "var(--accent-soft-text)" }}
            >
              Panel de control
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm sm:inline" style={{ color: "var(--foreground-secondary)" }}>
              {session?.user?.email}
            </span>
            <SignOutButton className="btn-secondary" />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
