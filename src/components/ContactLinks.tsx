const LINK_CLASS = "font-medium text-indigo-600 hover:underline dark:text-indigo-400";

/**
 * Los links de WhatsApp (wa.me) e Instagram (ig.me/m) abren directo el chat/DM,
 * no solo el perfil — para que contactarnos sea un solo click.
 */
export default function ContactLinks({ className }: { className?: string }) {
  return (
    <div
      className={
        className ?? "flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm"
      }
    >
      <a href="mailto:puntual.org@gmail.com" className={LINK_CLASS}>
        puntual.org@gmail.com
      </a>
      <a href="https://wa.me/5493400446008" target="_blank" rel="noreferrer" className={LINK_CLASS}>
        +54 9 3400 44-6008
      </a>
      <a href="https://wa.me/5493364693823" target="_blank" rel="noreferrer" className={LINK_CLASS}>
        +54 9 3364 69-3823
      </a>
      <a
        href="https://ig.me/m/puntual.servicio"
        target="_blank"
        rel="noreferrer"
        className={LINK_CLASS}
      >
        @puntual.servicio
      </a>
    </div>
  );
}
