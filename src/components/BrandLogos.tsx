import React from "react";
import amazonAsset from "@/assets/platforms/amazon.svg.asset.json";
import walmartAsset from "@/assets/platforms/walmart-compact.svg.asset.json";
import nikeAsset from "@/assets/platforms/nike.svg.asset.json";
import ebayAsset from "@/assets/platforms/ebay-compact.svg.asset.json";
import aliexpressAsset from "@/assets/platforms/aliexpress-compact.svg.asset.json";
import appleAsset from "@/assets/platforms/apple.svg.asset.json";
import zaraAsset from "@/assets/platforms/zara-compact.svg.asset.json";
import targetAsset from "@/assets/platforms/target.svg.asset.json";

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
  alt = "Prime Shipping",
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
  return <img src={amazonAsset.url} alt="Amazon" className={`${className} object-contain`} loading="lazy" />;
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
  return <img src={ebayAsset.url} alt="Ebay" className={`${className} object-contain`} loading="lazy" />;
}

export function WalmartSvgLogo({ className = "h-6 w-auto" }: { className?: string }) {
  return <img src={walmartAsset.url} alt="Walmart" className={`${className} object-contain`} loading="lazy" />;
}

export function AliexpressSvgLogo({ className = "h-6 w-auto" }: { className?: string }) {
  return <img src={aliexpressAsset.url} alt="Aliexpress" className={`${className} object-contain`} loading="lazy" />;
}

export function AppleSvgLogo({ className = "h-6 w-auto" }: { className?: string }) {
  return <img src={appleAsset.url} alt="Apple" className={`${className} object-contain`} loading="lazy" />;
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

export function NikeSvgLogo({ className = "h-6 w-auto" }: { className?: string }) {
  return <img src={nikeAsset.url} alt="Nike" className={`${className} object-contain`} loading="lazy" />;
}

export function ZaraSvgLogo({ className = "h-6 w-auto" }: { className?: string }) {
  return <img src={zaraAsset.url} alt="Zara" className={`${className} object-contain`} loading="lazy" />;
}

export function TargetSvgLogo({ className = "h-6 w-auto" }: { className?: string }) {
  return <img src={targetAsset.url} alt="Target" className={`${className} object-contain`} loading="lazy" />;
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

export function HomeB2BLogosShowcase({ className = "" }: { className?: string }) {
  const brands = [
    { name: "Amazon", logo: AmazonSvgLogo },
    { name: "SHEIN" },
    { name: "eBay", logo: EbaySvgLogo },
    { name: "Walmart", logo: WalmartSvgLogo },
    { name: "AliExpress", logo: AliexpressSvgLogo },
    { name: "Apple", logo: AppleSvgLogo },
    { name: "Fashion Nova" },
    { name: "Temu" },
    { name: "Nike", logo: NikeSvgLogo },
    { name: "Zara", logo: ZaraSvgLogo },
    { name: "Target", logo: TargetSvgLogo },
    { name: "Best Buy" },
  ];
  return (
    <div className={`space-y-3 text-forest-foreground ${className}`}>
      <p className="text-xs font-semibold">Plateformes internationales</p>
      <ul aria-label="Plateformes internationales" className="grid grid-cols-4 gap-x-3 gap-y-3 sm:grid-cols-6 lg:grid-cols-12">
        {brands.map(({ name, logo: Logo }) => (
          <li key={name} title={name} className="flex h-8 min-w-0 items-center justify-center">
            {Logo ? (
              <Logo className="h-6 w-full max-w-16" />
            ) : (
              <span className="text-center text-xs font-bold leading-tight">{name}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export const PartnerBrandsBar = HomeB2BLogosShowcase;
