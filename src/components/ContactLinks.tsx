import { CONTACT_WHATSAPP_DISPLAY, CONTACT_WHATSAPP_NUMBER } from "@/lib/whatsapp";

const LINK_CLASS = "font-medium text-indigo-600 hover:underline dark:text-indigo-400";

/**
 * Los links de WhatsApp (wa.me) e Instagram (ig.me/m) abren directo el chat/DM,
 * no solo el perfil — para que contactarnos sea un solo click. Instagram va
 * primero y con ícono para que sea el más visible de los tres.
 */
export default function ContactLinks({ className }: { className?: string }) {
  return (
    <div
      className={
        className ?? "flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm"
      }
    >
      <a
        href="https://ig.me/m/puntual.servicio"
        target="_blank"
        rel="noreferrer"
        className={`${LINK_CLASS} inline-flex items-center gap-1.5`}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
        </svg>
        @puntual.servicio
      </a>
      <a
        href={`https://wa.me/${CONTACT_WHATSAPP_NUMBER}`}
        target="_blank"
        rel="noreferrer"
        className={LINK_CLASS}
      >
        {CONTACT_WHATSAPP_DISPLAY}
      </a>
      <a href="mailto:puntual.org@gmail.com" className={LINK_CLASS}>
        puntual.org@gmail.com
      </a>
    </div>
  );
}
