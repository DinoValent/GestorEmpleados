import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AuthSessionProvider from "@/components/AuthSessionProvider";
import NavBar from "@/components/NavBar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Control de Empleados",
  description: "Sistema de control de horas, asistencia y fichas de empleados",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <AuthSessionProvider>
          <NavBar />
          <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
