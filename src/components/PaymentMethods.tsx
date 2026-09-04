import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

function PaymentLogo({ name, children }: { name: string; children: ReactNode }) {
  return (
    <li
      title={name}
      className="flex h-8 items-center justify-center rounded-sm bg-white px-2 shadow-sm ring-1 ring-tinta/10"
    >
      <span className="sr-only">{name}</span>
      {children}
    </li>
  );
}

function VisaLogo() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-10 fill-[#1a1f71]">
      <path d="M9.112 8.262 5.97 15.758H3.92L2.374 9.775c-.094-.368-.175-.503-.461-.658A9.313 9.313 0 0 0 0 8.479l.046-.217h3.3a.904.904 0 0 1 .894.764l.817 4.338 2.018-5.102zm8.033 5.049c.008-1.979-2.736-2.088-2.717-2.972.006-.269.262-.555.822-.628a3.66 3.66 0 0 1 1.913.336l.34-1.59a5.207 5.207 0 0 0-1.814-.333c-1.917 0-3.266 1.02-3.278 2.479-.012 1.079.963 1.68 1.698 2.04.756.367 1.01.603 1.006.931-.005.504-.602.725-1.16.734-.975.015-1.54-.263-1.992-.473l-.351 1.642c.453.208 1.289.39 2.156.398 2.037 0 3.37-1.006 3.377-2.564m5.061 2.447H24l-1.565-7.496h-1.656a.883.883 0 0 0-.826.55l-2.909 6.946h2.036l.405-1.12h2.488zm-2.163-2.656 1.02-2.815.588 2.815zm-8.16-4.84-1.603 7.496H8.34l1.605-7.496z" />
    </svg>
  );
}

function MastercardLogo() {
  return (
    <svg aria-hidden viewBox="0 0 38 24" className="h-5 w-9">
      <circle cx="13" cy="12" r="10" fill="#eb001b" />
      <circle cx="25" cy="12" r="10" fill="#f79e1b" />
      <path
        d="M19 4.05A9.97 9.97 0 0 0 15 12a9.97 9.97 0 0 0 4 7.95A9.97 9.97 0 0 0 23 12a9.97 9.97 0 0 0-4-7.95Z"
        fill="#ff5f00"
      />
    </svg>
  );
}

function PseLogo() {
  return (
    <span
      aria-hidden
      className="flex items-center gap-1 font-sans text-sm font-black italic text-[#33348e]"
    >
      <span className="size-3 rotate-45 rounded-[2px] border-[3px] border-[#33348e]" />
      PSE
    </span>
  );
}

function NequiLogo() {
  return (
    <span
      aria-hidden
      className="flex items-center gap-1 font-sans text-sm font-black tracking-tight text-[#200020]"
    >
      <span className="size-2.5 rounded-[2px] bg-[#da0081]" />
      Nequi
    </span>
  );
}

function BancolombiaLogo() {
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
      Bancolombia
    </span>
  );
}

function AddiLogo() {
  return (
    <span
      aria-hidden
      className="font-sans text-sm font-black lowercase tracking-tight text-[#1c67d8]"
    >
      addi
    </span>
  );
}

export function PaymentMethods({
  className,
}: {
  className?: string;
}) {
  return (
    <section
      aria-label="Métodos de pago disponibles"
      className={cn(
        "rounded-md border border-tinta/10 bg-niebla/60 px-3 py-3.5",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-tinta/60">
          Paga como prefieras
        </p>
        <ul
          className="flex flex-wrap items-center gap-1.5"
          aria-label="Visa, Mastercard, PSE, Nequi, Bancolombia y Addi"
        >
          <PaymentLogo name="Visa">
            <VisaLogo />
          </PaymentLogo>
          <PaymentLogo name="Mastercard">
            <MastercardLogo />
          </PaymentLogo>
          <PaymentLogo name="PSE">
            <PseLogo />
          </PaymentLogo>
          <PaymentLogo name="Nequi">
            <NequiLogo />
          </PaymentLogo>
          <PaymentLogo name="Bancolombia">
            <BancolombiaLogo />
          </PaymentLogo>
          <PaymentLogo name="Addi">
            <AddiLogo />
          </PaymentLogo>
        </ul>
      </div>
    </section>
  );
}
