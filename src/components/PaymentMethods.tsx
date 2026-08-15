import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

function PaymentLogo({
  name,
  compact,
  children,
}: {
  name: string;
  compact: boolean;
  children: ReactNode;
}) {
  return (
    <li
      title={name}
      className={cn(
        "flex items-center justify-center rounded-sm bg-white",
        compact
          ? "h-6 px-1 shadow-none ring-0"
          : "h-8 px-2 shadow-sm ring-1 ring-tinta/10",
      )}
    >
      <span className="sr-only">{name}</span>
      {children}
    </li>
  );
}

function VisaLogo({ compact }: { compact: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={cn(compact ? "h-4 w-7" : "h-5 w-10", "fill-[#1a1f71]")}
    >
      <path d="M9.112 8.262 5.97 15.758H3.92L2.374 9.775c-.094-.368-.175-.503-.461-.658A9.313 9.313 0 0 0 0 8.479l.046-.217h3.3a.904.904 0 0 1 .894.764l.817 4.338 2.018-5.102zm8.033 5.049c.008-1.979-2.736-2.088-2.717-2.972.006-.269.262-.555.822-.628a3.66 3.66 0 0 1 1.913.336l.34-1.59a5.207 5.207 0 0 0-1.814-.333c-1.917 0-3.266 1.02-3.278 2.479-.012 1.079.963 1.68 1.698 2.04.756.367 1.01.603 1.006.931-.005.504-.602.725-1.16.734-.975.015-1.54-.263-1.992-.473l-.351 1.642c.453.208 1.289.39 2.156.398 2.037 0 3.37-1.006 3.377-2.564m5.061 2.447H24l-1.565-7.496h-1.656a.883.883 0 0 0-.826.55l-2.909 6.946h2.036l.405-1.12h2.488zm-2.163-2.656 1.02-2.815.588 2.815zm-8.16-4.84-1.603 7.496H8.34l1.605-7.496z" />
    </svg>
  );
}

function MastercardLogo({ compact }: { compact: boolean }) {
  return (
    <svg aria-hidden viewBox="0 0 38 24" className={compact ? "h-4 w-7" : "h-5 w-9"}>
      <circle cx="13" cy="12" r="10" fill="#eb001b" />
      <circle cx="25" cy="12" r="10" fill="#f79e1b" />
      <path
        d="M19 4.05A9.97 9.97 0 0 0 15 12a9.97 9.97 0 0 0 4 7.95A9.97 9.97 0 0 0 23 12a9.97 9.97 0 0 0-4-7.95Z"
        fill="#ff5f00"
      />
    </svg>
  );
}

function PseLogo({ compact }: { compact: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex items-center font-sans font-black italic text-[#33348e]",
        compact ? "gap-0.5 text-xs" : "gap-1 text-sm",
      )}
    >
      <span
        className={cn(
          "rotate-45 rounded-[2px] border-[#33348e]",
          compact ? "size-2.5 border-2" : "size-3 border-[3px]",
        )}
      />
      PSE
    </span>
  );
}

function NequiLogo({ compact }: { compact: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex items-center font-sans font-black tracking-tight text-[#200020]",
        compact ? "gap-0.5 text-xs" : "gap-1 text-sm",
      )}
    >
      <span className={cn(compact ? "size-2" : "size-2.5", "rounded-[2px] bg-[#da0081]")} />
      Nequi
    </span>
  );
}

function BancolombiaLogo({ compact }: { compact: boolean }) {
  return (
    <span
      aria-hidden
      className="flex items-center gap-1.5 font-sans text-[10px] font-bold tracking-tight text-black"
    >
      <span className="grid w-3 -rotate-12 gap-[2px]">
        <span className="h-[3px] rounded-full bg-[#fec803]" />
        <span className="h-[3px] rounded-full bg-[#e9241d]" />
        <span className="h-[3px] rounded-full bg-[#23307d]" />
      </span>
      {compact ? null : "Bancolombia"}
    </span>
  );
}

export function PaymentMethods({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <section
      aria-label="Métodos de pago disponibles"
      className={cn(
        compact
          ? "border-y border-dashed border-border py-2"
          : "rounded-md border border-tinta/10 bg-niebla/60 px-3 py-3.5",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center",
          compact ? "justify-between gap-2" : "flex-wrap justify-between gap-x-3 gap-y-2",
        )}
      >
        <p className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-tinta/60">
          {compact ? "Seguro · Wompi" : "Paga como prefieras"}
        </p>
        <ul
          className={cn("flex items-center", compact ? "gap-1" : "flex-wrap gap-1.5")}
          aria-label="Visa, Mastercard, PSE, Nequi y Bancolombia"
        >
          <PaymentLogo name="Visa" compact={compact}>
            <VisaLogo compact={compact} />
          </PaymentLogo>
          <PaymentLogo name="Mastercard" compact={compact}>
            <MastercardLogo compact={compact} />
          </PaymentLogo>
          <PaymentLogo name="PSE" compact={compact}>
            <PseLogo compact={compact} />
          </PaymentLogo>
          <PaymentLogo name="Nequi" compact={compact}>
            <NequiLogo compact={compact} />
          </PaymentLogo>
          <PaymentLogo name="Bancolombia" compact={compact}>
            <BancolombiaLogo compact={compact} />
          </PaymentLogo>
        </ul>
      </div>
      {compact ? null : (
        <p className="mt-2 font-mono text-[10px] uppercase tracking-wide text-tinta/45">
          Envíos a toda Colombia · Pago seguro procesado por Wompi
        </p>
      )}
    </section>
  );
}
