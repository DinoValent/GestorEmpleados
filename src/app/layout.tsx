import type { Metadata } from "next";
import { Fustat } from "next/font/google";
import AppWatermark from "@/components/AppWatermark";
import AuthSessionProvider from "@/components/AuthSessionProvider";
import NavBar from "@/components/NavBar";
import PageTransition from "@/components/PageTransition";
import "./globals.css";

const THEME_INIT_SCRIPT = `
(function () {
  try {
    if (localStorage.getItem("puntual-theme") === "dark") {
      document.documentElement.classList.add("dark");
    }
  } catch (e) {}
})();
`;

const fustat = Fustat({
  variable: "--font-fustat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Puntual",
  description: "Sistema de control de horas, asistencia y fichas de empleados",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${fustat.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <AppWatermark />
        <AuthSessionProvider>
          <NavBar />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
            <PageTransition>{children}</PageTransition>
          </main>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
