import React from "react";
import { clientStore } from "@/lib/store";

export function PrimeShippingLogo({
  className = "h-12 w-auto",
  alt = "Prime Express Shipping",
}: {
  className?: string;
  alt?: string;
}) {
  return (
    <img
      src="/logos/prime-shipping-logo.svg"
      alt={alt}
      className={className}
      loading="eager"
    />
  );
}

export function PrimeStoreLogo({
  className = "h-12 w-auto",
  alt = "Prime Store Boutique",
}: {
  className?: string;
  alt?: string;
}) {
  return <img src="/logos/prime-store-logo.svg" alt={alt} className={className} loading="eager" />;
}

export function PrimeEntrepriseLogo({
  className = "h-10 w-auto",
  alt = "Prime Entreprise",
}: {
  className?: string;
  alt?: string;
}) {
  return (
    <img
      src="/logos/prime-entreprise-logo.svg"
      alt={alt}
      className={className}
      loading="eager"
    />
  );
}

// ==========================================
// LOGOS PAIEMENTS OFFICIELS (HAÏTI & MONDE)
// ==========================================

export function MonCashLogo({ className = "h-7" }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E31837] text-white font-extrabold text-xs shadow-sm ${className}`}
      title="MonCash (Digicel Haïti)"
    >
      <svg viewBox="0 0 32 32" className="h-4 w-4 fill-current flex-shrink-0">
        <circle cx="16" cy="16" r="14" fill="#ffffff" />
        <path d="M10 21V11l4 5 4-5v10h-2.5v-5.5L14 17.5l-1.5-2V21H10z" fill="#E31837" />
      </svg>
      <span className="tracking-tight">MonCash</span>
    </div>
  );
}

export function NatcashLogo({ className = "h-7" }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#003B71] to-[#0066B2] text-white font-extrabold text-xs shadow-sm ${className}`}
      title="Natcash (Natcom Haïti)"
    >
      <svg viewBox="0 0 32 32" className="h-4 w-4 flex-shrink-0">
        <circle cx="16" cy="16" r="14" fill="#F37021" />
        <path d="M9 21V11h3l4.5 6.5V11H19v10h-3l-4.5-6.5V21H9z" fill="#ffffff" />
      </svg>
      <span className="tracking-tight">Natcash</span>
    </div>
  );
}

export function SogexpressLogo({ className = "h-7" }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00478F] text-white font-bold text-xs shadow-sm ${className}`}
      title="Sogexpress / Sogebank Haïti"
    >
      <span className="font-black text-amber-400">SOGE</span>
      <span className="tracking-tight text-white">XPRESS</span>
    </div>
  );
}

export function VisaLogo({ className = "h-7" }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-center px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-[#1434CB] font-black italic text-xs tracking-wider shadow-sm ${className}`}
      title="Visa International"
    >
      <span>VISA</span>
    </div>
  );
}

export function MastercardLogo({ className = "h-7" }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141414] text-white font-bold text-xs shadow-sm ${className}`}
      title="Mastercard"
    >
      <div className="flex -space-x-1.5">
        <div className="h-3.5 w-3.5 rounded-full bg-[#EB001B]" />
        <div className="h-3.5 w-3.5 rounded-full bg-[#F79E1B] opacity-90" />
      </div>
      <span className="text-[11px] font-semibold text-white/90">mastercard</span>
    </div>
  );
}

export function PayPalLogo({ className = "h-7" }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#003087] text-white font-bold text-xs shadow-sm ${className}`}
      title="PayPal"
    >
      <span className="text-[#0079C1] font-black italic">Pay</span>
      <span className="text-[#00457C] font-black italic">Pal</span>
    </div>
  );
}

export function ZelleLogo({ className = "h-7" }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#7414CA] text-white font-black text-xs shadow-sm ${className}`}
      title="Zelle USA"
    >
      <span>zelle</span>
    </div>
  );
}

export function WiseLogo({ className = "h-7" }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#9FE870] text-[#163300] font-black text-xs shadow-sm ${className}`}
      title="Wise Transfer"
    >
      <span>WISE</span>
    </div>
  );
}

export function CryptoLogo({ className = "h-7" }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#26A17B] text-white font-bold text-xs shadow-sm ${className}`}
      title="Tether USDT (Crypto)"
    >
      <span className="font-mono font-black">₮</span>
      <span>USDT</span>
    </div>
  );
}

export function BankTransferLogo({ className = "h-7" }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-white font-bold text-xs shadow-sm ${className}`}
      title="Virement bancaire (Unibank, Sogebank, BNC)"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-3.5 w-3.5 text-amber-400"
      >
        <path d="M3 21h18M3 10h18M5 10v11M9 10v11M15 10v11M19 10v11M12 2L2 7h20L12 2z" />
      </svg>
      <span>Banques Haïti</span>
    </div>
  );
}

export function PaymentMethodsBar({
  showTitle = true,
  className = "",
}: {
  showTitle?: boolean;
  className?: string;
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {showTitle && (
        <div className="flex items-center justify-between">
          <p className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Moyens de paiement acceptés
          </p>
          <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
            Transactions 100% sécurisées
          </span>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <MonCashLogo />
        <NatcashLogo />
        <SogexpressLogo />
        <ZelleLogo />
        <WiseLogo />
        <VisaLogo />
        <MastercardLogo />
        <PayPalLogo />
        <CryptoLogo />
        <BankTransferLogo />
      </div>
    </div>
  );
}

export const PaymentLogosBar = PaymentMethodsBar;

// ==========================================
// VÉRITABLES LOGOS GRAPHIQUES B2B (SANS NOM / DOMAINE)
// ==========================================

export function AmazonSvgLogo({ className = "h-6 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 32" className={className} fill="currentColor">
      <path
        d="M57.6 22.8c-7.3 5.4-17.9 8.2-26.9 8.2-12.7 0-24.1-4.7-32.8-12.5-.7-.6-.1-1.5.7-1 9.2 5.3 20.6 8.5 32.1 8.5 8 0 16.7-2 24.6-6.1 1.2-.7 2.3.5 1.4 1.4z"
        fill="#FF9900"
      />
      <path
        d="M59.9 20.3c-.9-1.2-6.1-.6-8.5-.3-.7.1-.8-.5-.2-.9 3.7-2.7 9.8-1.9 10.6-.9.8 1.1-.2 7.2-3.7 10.2-.5.5-1 .2-.8-.4.7-2.3 2.6-7.7 2.6-7.7z"
        fill="#FF9900"
      />
      <path d="M21.2 17.5c0 2.2-.4 3.9-1.1 5.1-.8 1.2-2.1 1.8-3.9 1.8-1.5 0-2.6-.5-3.3-1.6-.7-1.1-1.1-2.7-1.1-4.9 0-2.3.4-4 1.1-5.1.7-1.1 1.9-1.7 3.4-1.7 1.6 0 2.8.6 3.6 1.7.9 1.1 1.3 2.7 1.3 4.7zm4.2 0c0-3.3-.8-5.8-2.4-7.5-1.6-1.7-3.8-2.5-6.6-2.5-3 0-5.3.9-6.9 2.7V7.8h-4.1v23.5h4.1v-2.8c1.7 2 4.1 3 7.1 3 2.8 0 5-1 6.5-2.9 1.6-1.9 2.3-4.5 2.3-8.1zM42.8 15.6c0-2.4-.4-4.2-1.3-5.3-.9-1.1-2.3-1.7-4.1-1.7-1.6 0-2.9.6-3.8 1.7-.9 1.1-1.4 2.8-1.4 5.2 0 2.4.4 4.1 1.3 5.3.9 1.2 2.2 1.8 4 1.8 1.7 0 3-.6 3.9-1.7.9-1.2 1.4-3 1.4-5.3zm4.3 0c0 3.5-.9 6.2-2.6 8-1.7 1.8-4.1 2.7-7 2.7-3 0-5.3-.9-7-2.7-1.7-1.8-2.6-4.5-2.6-8s.9-6.2 2.6-8c1.7-1.8 4-2.7 7-2.7 3 0 5.3.9 7 2.7 1.7 1.8 2.6 4.5 2.6 8zM57.4 7.8v2.9c1.6-2.1 3.8-3.1 6.6-3.1 2.2 0 4 .7 5.2 2.1 1.3 1.4 1.9 3.4 1.9 6.2v11.4h-4.3V16.3c0-1.8-.4-3.1-1.1-3.9-.7-.8-1.8-1.2-3.1-1.2-1.5 0-2.6.5-3.5 1.5-.8 1-1.3 2.4-1.3 4.3v10.3h-4.3V7.8h3.9z" />
    </svg>
  );
}

export function SheinSvgLogo({ className = "h-5 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 24" className={className} fill="currentColor">
      <text
        x="50"
        y="19"
        fontFamily="Arial Black, Helvetica, sans-serif"
        fontWeight="900"
        fontSize="21"
        letterSpacing="6"
        textAnchor="middle"
      >
        SHEIN
      </text>
    </svg>
  );
}

export function EbaySvgLogo({ className = "h-6 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 32" className={className}>
      <text
        x="8"
        y="25"
        fontFamily="'Arial Black', sans-serif"
        fontWeight="900"
        fontSize="30"
        fill="#E53238"
      >
        e
      </text>
      <text
        x="24"
        y="25"
        fontFamily="'Arial Black', sans-serif"
        fontWeight="900"
        fontSize="30"
        fill="#0064D2"
      >
        b
      </text>
      <text
        x="42"
        y="25"
        fontFamily="'Arial Black', sans-serif"
        fontWeight="900"
        fontSize="30"
        fill="#F5AF02"
      >
        a
      </text>
      <text
        x="60"
        y="25"
        fontFamily="'Arial Black', sans-serif"
        fontWeight="900"
        fontSize="30"
        fill="#86B817"
      >
        y
      </text>
    </svg>
  );
}

export function WalmartSvgLogo({ className = "h-6 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 32" className={className} fill="none">
      <path
        d="M102 7l2 7-6-4 4-3zM102 25l2-7-6 4 4 3zM114 16l-7-2 4 6 3-4zM90 16l7-2-4 6-3-4zM111 8l-5 5 7 1-2-6zM93 24l5-5-7-1 2 6z"
        fill="#FFC220"
      />
      <text
        x="45"
        y="23"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="800"
        fontSize="22"
        fill="#0071DC"
        letterSpacing="-0.5"
      >
        Walmart
      </text>
    </svg>
  );
}

export function AliexpressSvgLogo({ className = "h-6 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 32" className={className} fill="none">
      <rect x="2" y="4" width="24" height="24" rx="6" fill="#FF4747" />
      <path d="M8 19l6-11 6 11h-3l-3-6-3 6H8z" fill="#ffffff" />
      <text
        x="32"
        y="22"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="900"
        fontSize="16"
        fill="#FF4747"
        letterSpacing="-0.5"
      >
        AliExpress
      </text>
    </svg>
  );
}

export function AppleSvgLogo({ className = "h-6 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="currentColor">
      <path d="M23.5 17.5c0-4 3.3-5.9 3.4-6-1.9-2.7-4.8-3.1-5.8-3.1-2.5-.3-4.9 1.5-6.1 1.5-1.3 0-3.3-1.4-5.3-1.4-2.7 0-5.3 1.6-6.7 4.1-2.9 5-0.7 12.3 2 16.3 1.4 2 3 4.2 5.1 4.1 2.1-.1 2.9-1.3 5.4-1.3 2.5 0 3.2 1.3 5.4 1.3 2.2 0 3.6-2 4.9-4 1.6-2.3 2.2-4.5 2.3-4.6-0.1 0-4.6-1.8-4.6-6.9zM19.8 6.4c1.1-1.4 1.9-3.3 1.7-5.2-1.6 0.1-3.6 1.1-4.7 2.4-1 1.2-1.9 3.1-1.6 5 1.8 0.1 3.6-0.9 4.6-2.2z" />
    </svg>
  );
}

export function FashionNovaSvgLogo({ className = "h-5 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 130 24" className={className} fill="currentColor">
      <text
        x="65"
        y="18"
        fontFamily="'Arial Black', sans-serif"
        fontWeight="900"
        fontSize="15"
        letterSpacing="3"
        textAnchor="middle"
      >
        FASHION NOVA
      </text>
    </svg>
  );
}

export function TemuSvgLogo({ className = "h-6 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 32" className={className} fill="none">
      <rect x="2" y="4" width="76" height="24" rx="8" fill="#FB7701" />
      <text
        x="40"
        y="22"
        fontFamily="'Arial Black', sans-serif"
        fontWeight="900"
        fontSize="16"
        fill="#ffffff"
        letterSpacing="1"
        textAnchor="middle"
      >
        TEMU
      </text>
    </svg>
  );
}

export function NikeSvgLogo({ className = "h-5 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 36" className={className} fill="currentColor">
      <path d="M98.2 5.4c-12.7 7.4-44.1 24.1-59.5 29.8-9 3.3-19.8 1.4-26.6-4.6-5.8-5.1-7.8-12.8-5-19.6 2.3-5.5 7.1-9.7 13-11.4 6.7-2 15.6-.2 25.4 5.3-15.3-4.5-26.7-1.1-30.8 7.3-3.1 6.3-.5 12.5 5.5 15.2 6.8 3.1 16.3 1.2 27.2-4.9C64.3 28.5 88.9 14.3 98.2 5.4z" />
    </svg>
  );
}

export function ZaraSvgLogo({ className = "h-5 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 110 32" className={className} fill="currentColor">
      <text
        x="55"
        y="24"
        fontFamily="'Times New Roman', Georgia, serif"
        fontWeight="900"
        fontSize="30"
        letterSpacing="-2"
        textAnchor="middle"
      >
        ZARA
      </text>
    </svg>
  );
}

export function TargetSvgLogo({ className = "h-6 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none">
      <circle cx="16" cy="16" r="14" fill="#CC0000" />
      <circle cx="16" cy="16" r="9" fill="#FFFFFF" />
      <circle cx="16" cy="16" r="4.5" fill="#CC0000" />
    </svg>
  );
}

export function BestBuySvgLogo({ className = "h-6 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 32" className={className} fill="none">
      <rect x="2" y="2" width="76" height="28" rx="6" fill="#0046BE" />
      <text
        x="40"
        y="21"
        fontFamily="Arial Black, sans-serif"
        fontWeight="900"
        fontSize="13"
        fill="#FFF200"
        textAnchor="middle"
      >
        BEST BUY
      </text>
    </svg>
  );
}

export function SephoraSvgLogo({ className = "h-5 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 28" className={className} fill="currentColor">
      <text
        x="60"
        y="20"
        fontFamily="'Century Gothic', sans-serif"
        fontWeight="700"
        fontSize="16"
        letterSpacing="6"
        textAnchor="middle"
      >
        SEPHORA
      </text>
    </svg>
  );
}

// Composant vitrine des véritables logos B2B épurés (STRICTEMENT SANS NOM / SANS DOMAINE)
export function HomeB2BLogosShowcase({ className = "" }: { className?: string }) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2.5">
          <span className="flex h-2.5 w-2.5 rounded-full bg-amber-400 animate-ping" />
          <p className="text-xs font-black uppercase tracking-widest text-amber-400">
            Plateformes Internationales B2B & E-Commerce Partenaires
          </p>
        </div>
        <span className="text-[11px] font-bold text-slate-300 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700/60 shadow-inner">
          Achetez partout • Livraison directe en Haïti
        </span>
      </div>

      {/* Grid of clean logos with ZERO text/domains */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2.5 items-center">
        {/* Amazon */}
        <div
          className="h-14 rounded-2xl bg-[#0b1329] border border-slate-800/80 text-white flex items-center justify-center p-2.5 shadow-sm hover:border-amber-400/50 hover:bg-slate-900 transition-all cursor-pointer group"
          title="Amazon"
        >
          <AmazonSvgLogo className="h-5 w-auto text-white group-hover:scale-105 transition-transform" />
        </div>
        {/* SHEIN */}
        <div
          className="h-14 rounded-2xl bg-[#0b1329] border border-slate-800/80 text-white flex items-center justify-center p-2.5 shadow-sm hover:border-amber-400/50 hover:bg-slate-900 transition-all cursor-pointer group"
          title="SHEIN"
        >
          <SheinSvgLogo className="h-4 w-auto text-white group-hover:scale-105 transition-transform" />
        </div>
        {/* eBay */}
        <div
          className="h-14 rounded-2xl bg-white border border-slate-300 flex items-center justify-center p-2.5 shadow-sm hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group"
          title="eBay"
        >
          <EbaySvgLogo className="h-5 w-auto group-hover:scale-105 transition-transform" />
        </div>
        {/* Walmart */}
        <div
          className="h-14 rounded-2xl bg-white border border-slate-300 flex items-center justify-center p-2.5 shadow-sm hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group"
          title="Walmart"
        >
          <WalmartSvgLogo className="h-5 w-auto group-hover:scale-105 transition-transform" />
        </div>
        {/* AliExpress */}
        <div
          className="h-14 rounded-2xl bg-white border border-slate-300 flex items-center justify-center p-2.5 shadow-sm hover:border-red-500 hover:shadow-md transition-all cursor-pointer group"
          title="AliExpress"
        >
          <AliexpressSvgLogo className="h-5 w-auto group-hover:scale-105 transition-transform" />
        </div>
        {/* Apple */}
        <div
          className="h-14 rounded-2xl bg-black border border-slate-800 text-white flex items-center justify-center p-2.5 shadow-sm hover:border-slate-500 transition-all cursor-pointer group"
          title="Apple"
        >
          <AppleSvgLogo className="h-5 w-auto group-hover:scale-105 transition-transform" />
        </div>
        {/* Fashion Nova */}
        <div
          className="h-14 rounded-2xl bg-[#0a0f1d] border border-slate-800 text-white flex items-center justify-center p-2.5 shadow-sm hover:border-amber-400/50 transition-all cursor-pointer group"
          title="Fashion Nova"
        >
          <FashionNovaSvgLogo className="h-4 w-auto group-hover:scale-105 transition-transform" />
        </div>
        {/* Temu */}
        <div
          className="h-14 rounded-2xl bg-[#FB7701]/15 border border-[#FB7701]/40 flex items-center justify-center p-2.5 shadow-sm hover:border-[#FB7701] transition-all cursor-pointer group"
          title="Temu"
        >
          <TemuSvgLogo className="h-5 w-auto group-hover:scale-105 transition-transform" />
        </div>
        {/* Nike */}
        <div
          className="h-14 rounded-2xl bg-black border border-slate-800 text-white flex items-center justify-center p-2.5 shadow-sm hover:border-white transition-all cursor-pointer group"
          title="Nike"
        >
          <NikeSvgLogo className="h-4 w-auto group-hover:scale-105 transition-transform" />
        </div>
        {/* Zara */}
        <div
          className="h-14 rounded-2xl bg-[#0a0f1d] border border-slate-800 text-white flex items-center justify-center p-2.5 shadow-sm hover:border-slate-400 transition-all cursor-pointer group"
          title="Zara"
        >
          <ZaraSvgLogo className="h-4 w-auto group-hover:scale-105 transition-transform" />
        </div>
        {/* Target */}
        <div
          className="h-14 rounded-2xl bg-white border border-slate-300 flex items-center justify-center p-2.5 shadow-sm hover:border-red-500 transition-all cursor-pointer group"
          title="Target"
        >
          <TargetSvgLogo className="h-6 w-auto group-hover:scale-105 transition-transform" />
        </div>
        {/* Best Buy */}
        <div
          className="h-14 rounded-2xl bg-[#0046BE] border border-blue-700 flex items-center justify-center p-2.5 shadow-sm hover:brightness-110 transition-all cursor-pointer group"
          title="Best Buy"
        >
          <BestBuySvgLogo className="h-5 w-auto group-hover:scale-105 transition-transform" />
        </div>
      </div>
    </div>
  );
}

export const PartnerBrandsBar = HomeB2BLogosShowcase;
