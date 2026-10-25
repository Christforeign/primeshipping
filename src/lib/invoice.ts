// Printable multi-style invoices for Prime Shipping (Browser "Save as PDF" & Print)

export type InvoiceTemplate =
  "global-express" | "minimalist" | "pos-receipt" | "store-retail" | "corporate-b2b" | "custom";

export type InvoiceBrand = "shipping" | "store" | "entreprise";
export type InvoiceStatus = "payee" | "non_payee" | "partielle" | "annulee";

export type InvoicePaymentRecord = {
  date?: string | undefined;
  method?: string | undefined; // Espèces USD, Espèces HTG, MonCash, Natcash, Virement, Carte
  amount_usd?: number | undefined;
  amount_htg?: number | undefined;
  reference?: string | undefined;
};

export type InvoiceLine = {
  num?: number | undefined;
  tracking_or_sku?: string | undefined;
  label: string;
  customs_fee_usd?: number | undefined;
  weight_lbs?: number | undefined;
  qty?: number | undefined;
  unit?: number | undefined;
  total: number;
  image_url?: string | undefined;
  product_id?: string | undefined;
  variant_id?: string | undefined;
};

export type InvoiceShippingDetails = {
  package_count?: number | undefined;
  total_weight_lbs?: number | undefined;
  rate_per_lb?: number | undefined;
  destination?: string | undefined;
};

export type InvoiceData = {
  brand: InvoiceBrand;
  template?: InvoiceTemplate | undefined;
  number: string;
  date?: string | undefined;
  dueDate?: string | undefined;
  title?: string | undefined;
  status?: InvoiceStatus | undefined;
  client: {
    name?: string | undefined;
    code?: string | undefined; // ex: PS-0012
    email?: string | undefined;
    phone?: string | undefined;
    address?: string | undefined;
    city?: string | undefined;
  };
  shipping_details?: InvoiceShippingDetails | undefined;
  lines: InvoiceLine[];
  subtotal_usd?: number | undefined;
  service_fee_usd?: number | undefined;
  customs_total_usd?: number | undefined;
  discount_usd?: number | undefined;
  paid?: number | undefined; // total paid in USD
  paid_htg?: number | undefined; // total paid in HTG
  payment_history?: InvoicePaymentRecord[] | undefined;
  warning_box_text?: string | undefined;
  note?: string | undefined;
  rate?: number | undefined; // USD to HTG conversion rate
  accentColor?: string | undefined; // used for "custom" template
  company?:
    | {
        name?: string | undefined;
        phone?: string | undefined;
        whatsapp?: string | undefined;
        email?: string | undefined;
        address?: string | undefined;
        city?: string | undefined;
        footer?: string | undefined;
        logo?: string | undefined;
        bank_accounts?: string | undefined;
      }
    | undefined;
};

export const INVOICE_TEMPLATES: { id: InvoiceTemplate; name: string; description: string }[] = [
  {
    id: "global-express",
    name: "Global Express Fret",
    description: "Modèle bordereau de fret officiel avec double devise, détails colis et reçu",
  },
  {
    id: "minimalist",
    name: "Minimaliste Moderne",
    description: "Design contemporain épuré, noir et blanc, typographie soignée",
  },
  {
    id: "pos-receipt",
    name: "Ticket de Caisse POS 80mm",
    description: "Format ticket thermique de caisse pour imprimante rouleau de comptoir",
  },
  {
    id: "store-retail",
    name: "Prime Store Retail",
    description: "Facture boutique commerciale avec références SKU, visuels et réductions",
  },
  {
    id: "corporate-b2b",
    name: "Corporate B2B / Entreprise",
    description: "Facture institutionnelle avec coordonnées bancaires et cadre d'approbation",
  },
  {
    id: "custom",
    name: "Personnalisé Couleurs",
    description: "Modèle modulable avec palette de couleur au choix",
  },
];

const LOGOS: Record<InvoiceBrand, string> = {
  shipping: "/assets/aistudio/WhatsApp_Image_2026-10-14_at_20.12.29_c1b1b367.jpeg",
  store: "/assets/aistudio/WhatsApp_Image_2026-10-14_at_20.12.29_c1b1b367.jpeg",
  entreprise: "/assets/aistudio/WhatsApp_Image_2026-10-14_at_20.12.29_c1b1b367.jpeg",
};

const esc = (s: unknown) =>
  String(s ?? "").replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!,
  );

export function invoiceTotals(
  d: Partial<InvoiceData> & { lines: Array<{ total: number; [key: string]: any }> },
) {
  const lineSum = d.lines.reduce((a, l) => a + (Number(l.total) || 0), 0);
  const subtotal = d.subtotal_usd != null ? d.subtotal_usd : lineSum;
  const serviceFee = Number(d.service_fee_usd) || 0;
  const customsFee = Number(d.customs_total_usd) || 0;
  const discount = Number(d.discount_usd) || 0;

  const total = Math.max(0, subtotal + serviceFee + customsFee - discount);
  const rate = d.rate || 132;
  const totalHtg = Math.round(total * rate);

  const paid = Number(d.paid) || 0;
  const paidHtg = d.paid_htg != null ? d.paid_htg : Math.round(paid * rate);

  const balance = Math.max(0, total - paid);
  const balanceHtg = Math.round(balance * rate);

  const change = paid > total ? paid - total : 0;
  const changeHtg = Math.round(change * rate);

  return {
    subtotal,
    serviceFee,
    customsFee,
    discount,
    total,
    totalHtg,
    paid,
    paidHtg,
    balance,
    balanceHtg,
    change,
    changeHtg,
    rate,
  };
}

const statusBadge = (status?: InvoiceStatus) => {
  switch (status) {
    case "payee":
      return {
        label: "PAYÉE",
        bg: "#dcfce7",
        color: "#15803d",
        border: "#86efac",
      };
    case "partielle":
      return {
        label: "PARTIELLE",
        bg: "#ffedd5",
        color: "#c2410c",
        border: "#fdba74",
      };
    case "annulee":
      return {
        label: "ANNULÉE",
        bg: "#f3f4f6",
        color: "#4b5563",
        border: "#d1d5db",
      };
    case "non_payee":
    default:
      return {
        label: "NON PAYÉE",
        bg: "#fee2e2",
        color: "#b91c1c",
        border: "#fca5a5",
      };
  }
};

export function renderInvoiceHtml(d: InvoiceData): string {
  const template = d.template || "global-express";
  const totals = invoiceTotals(d);
  const logo =
    d.company?.logo ||
    (typeof window !== "undefined" ? window.location.origin : "") + LOGOS[d.brand];
  const c = d.company || {};
  const client = d.client || {};
  const status = statusBadge(d.status);
  const dateStr =
    d.date ||
    new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  const warningText =
    d.warning_box_text ||
    "Veuillez vérifier votre colis avant de partir. Aucun retour ne sera accepté après votre départ.";

  if (template === "pos-receipt") {
    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reçu ${esc(d.number)}</title>
  <style>
    @page { size: 80mm auto; margin: 3mm; }
    body {
      font-family: 'Courier New', Courier, monospace;
      width: 74mm;
      margin: 0 auto;
      padding: 6px 2px;
      font-size: 11px;
      color: #000;
      line-height: 1.35;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .bold { font-weight: bold; }
    .divider { border-top: 1px dashed #000; margin: 6px 0; }
    .double-divider { border-top: 2px dashed #000; margin: 6px 0; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    th { text-align: left; border-bottom: 1px dashed #000; padding: 2px 0; }
    td { padding: 2px 0; vertical-align: top; }
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border: 1px solid #000;
      font-size: 9px;
      font-weight: bold;
      text-transform: uppercase;
      margin: 3px 0;
    }
    .print-btn {
      display: block;
      width: 100%;
      padding: 8px;
      background: #000;
      color: #fff;
      border: none;
      font-family: inherit;
      font-weight: bold;
      cursor: pointer;
      margin-bottom: 12px;
    }
    @media print { .print-btn { display: none; } }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">IMPRIMER LE TICKET</button>
  
  <div class="text-center">
    <div class="bold" style="font-size: 14px; text-transform: uppercase;">${esc(c.name || "PRIME ENTREPRISE")}</div>
    <div>${esc(c.address || "Delmas 33 & Pétion-Ville")}</div>
    <div>Tél: ${esc(c.phone || "+509 3700-1122")}</div>
    <div class="divider"></div>
    <div class="bold" style="font-size: 12px;">TICKET DE CAISSE</div>
    <div>N° ${esc(d.number)}</div>
    <div>Date : ${esc(dateStr)}</div>
    <div class="badge">${status.label}</div>
  </div>

  <div class="divider"></div>
  <div>
    <div><b>Client :</b> ${esc(client.name || "Client Comptoir")}</div>
    ${client.code ? `<div><b>Code :</b> ${esc(client.code)}</div>` : ""}
    ${client.phone ? `<div><b>Tél :</b> ${esc(client.phone)}</div>` : ""}
  </div>

  <div class="divider"></div>
  <table>
    <thead>
      <tr>
        <th>ART</th>
        <th class="text-right">QTÉ</th>
        <th class="text-right">P.U</th>
        <th class="text-right">TOTAL</th>
      </tr>
    </thead>
    <tbody>
      ${d.lines
        .map(
          (l) => `
        <tr>
          <td>${esc(l.label)}</td>
          <td class="text-right">${l.qty || 1}</td>
          <td class="text-right">${l.unit != null ? Number(l.unit).toFixed(2) : "-"}</td>
          <td class="text-right bold">${Number(l.total).toFixed(2)} $</td>
        </tr>`,
        )
        .join("")}
    </tbody>
  </table>

  <div class="divider"></div>
  <table style="font-size: 11px;">
    <tr>
      <td>Sous-total :</td>
      <td class="text-right">${totals.subtotal.toFixed(2)} $</td>
    </tr>
    ${totals.serviceFee > 0 ? `<tr><td>Frais service :</td><td class="text-right">+${totals.serviceFee.toFixed(2)} $</td></tr>` : ""}
    ${totals.customsFee > 0 ? `<tr><td>Frais douane :</td><td class="text-right">+${totals.customsFee.toFixed(2)} $</td></tr>` : ""}
    ${totals.discount > 0 ? `<tr><td>Remise :</td><td class="text-right">-${totals.discount.toFixed(2)} $</td></tr>` : ""}
    <tr class="bold" style="font-size: 13px;">
      <td>TOTAL USD :</td>
      <td class="text-right">${totals.total.toFixed(2)} USD</td>
    </tr>
    <tr class="bold">
      <td>TOTAL HTG :</td>
      <td class="text-right">${totals.totalHtg.toLocaleString("fr-FR")} HTG</td>
    </tr>
    <tr>
      <td>Montant payé :</td>
      <td class="text-right">${totals.paid.toFixed(2)} $</td>
    </tr>
    ${
      totals.balance > 0
        ? `<tr class="bold"><td>RESTE À PAYER :</td><td class="text-right">${totals.balance.toFixed(2)} $ (${totals.balanceHtg.toLocaleString("fr-FR")} HTG)</td></tr>`
        : totals.change > 0
          ? `<tr><td>Monnaie rendue :</td><td class="text-right">${totals.change.toFixed(2)} $</td></tr>`
          : ""
    }
  </table>

  <div class="double-divider"></div>
  <div class="text-center" style="font-size: 9px;">
    <div>${esc(warningText)}</div>
    <div style="margin-top: 6px;" class="bold">*** MERCI DE VOTRE VISITE ***</div>
    <div>${esc(c.footer || "Prime Shipping - Haïti")}</div>
  </div>
</body>
</html>`;
  }

  if (template === "minimalist") {
    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Facture ${esc(d.number)}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      margin: 0;
      padding: 30px;
      line-height: 1.5;
      font-size: 13px;
    }
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 24px; border-bottom: 1px solid #e5e7eb; }
    .logo { height: 48px; object-contain: contain; }
    .title { font-size: 26px; font-weight: 300; letter-spacing: -0.5px; margin: 0; }
    .badge { display: inline-block; padding: 4px 10px; font-size: 11px; font-weight: 600; text-transform: uppercase; border-radius: 4px; background: ${status.bg}; color: ${status.color}; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin: 28px 0; }
    .label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 12px; }
    th { text-align: left; padding: 10px 8px; border-bottom: 1px solid #111827; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #111827; }
    td { padding: 10px 8px; border-bottom: 1px solid #f3f4f6; }
    .text-right { text-align: right; }
    .totals { margin-left: auto; width: 280px; }
    .totals-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 12px; }
    .totals-row.grand { font-size: 16px; font-weight: 700; border-top: 1px solid #111827; margin-top: 6px; padding-top: 8px; }
    .balance-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; margin-top: 14px; text-align: right; }
    .btn { float: right; padding: 9px 18px; background: #111827; color: #fff; border: 0; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; }
    .footer { margin-top: 50px; padding-top: 18px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: center; }
    @media print { .btn { display: none; } }
  </style>
</head>
<body>
  <button class="btn" onclick="window.print()">Télécharger / Imprimer PDF</button>
  
  <div class="header">
    <div>
      <img src="${esc(logo)}" alt="" class="logo">
      <div style="font-weight: 600; font-size: 14px; margin-top: 8px;">${esc(c.name || "PRIME ENTREPRISE")}</div>
      <div style="color: #6b7280;">${esc(c.address || "Haïti")}</div>
      <div style="color: #6b7280;">${esc(c.phone || "")} ${esc(c.email || "")}</div>
    </div>
    <div style="text-align: right;">
      <h1 class="title">FACTURE</h1>
      <div style="font-family: monospace; font-size: 13px; color: #4b5563; margin-top: 4px;">${esc(d.number)}</div>
      <div style="color: #6b7280; font-size: 12px; margin-top: 2px;">${esc(dateStr)}</div>
      <div style="margin-top: 8px;"><span class="badge">${status.label}</span></div>
    </div>
  </div>

  <div class="grid">
    <div>
      <div class="label">Facturé à</div>
      <div style="font-size: 15px; font-weight: 600;">${esc(client.name || "Client comptoir")}</div>
      ${client.code ? `<div style="font-family: monospace; font-size: 12px; color: #4b5563;">Code : ${esc(client.code)}</div>` : ""}
      ${client.phone ? `<div>Tél : ${esc(client.phone)}</div>` : ""}
      ${client.email ? `<div>Email : ${esc(client.email)}</div>` : ""}
      ${client.address ? `<div>Adresse : ${esc(client.address)}</div>` : ""}
    </div>
    ${
      d.shipping_details
        ? `
    <div>
      <div class="label">Détails Logistiques</div>
      <div>Nombre de colis : <b>${d.shipping_details.package_count || d.lines.length}</b></div>
      <div>Poids total : <b>${d.shipping_details.total_weight_lbs || 0} lbs</b></div>
      <div>Taux fret : <b>${d.shipping_details.rate_per_lb || 4.5} $/lb</b></div>
      <div>Taux de change : <b>1 USD = ${totals.rate} HTG</b></div>
    </div>`
        : `
    <div>
      <div class="label">Modalités</div>
      <div>Devise de facturation : <b>USD & HTG</b></div>
      <div>Taux de change : <b>1 USD = ${totals.rate} HTG</b></div>
      <div>Paiement : <b>Comptoir / En ligne</b></div>
    </div>`
    }
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 40px;">#</th>
        <th>Description / Réf</th>
        <th class="text-right" style="width: 80px;">Qté</th>
        <th class="text-right" style="width: 100px;">Prix Unit.</th>
        <th class="text-right" style="width: 110px;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${d.lines
        .map(
          (l, i) => `
        <tr>
          <td>${l.num || i + 1}</td>
          <td>
            <div style="font-weight: 600;">${esc(l.label)}</div>
            ${l.tracking_or_sku ? `<div style="font-family: monospace; font-size: 11px; color: #6b7280;">Réf: ${esc(l.tracking_or_sku)}</div>` : ""}
          </td>
          <td class="text-right">${l.qty || 1}</td>
          <td class="text-right">${l.unit != null ? `$${Number(l.unit).toFixed(2)}` : "-"}</td>
          <td class="text-right" style="font-weight: 600;">$${Number(l.total).toFixed(2)}</td>
        </tr>`,
        )
        .join("")}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row">
      <span style="color: #6b7280;">Sous-total :</span>
      <span>$${totals.subtotal.toFixed(2)}</span>
    </div>
    ${totals.serviceFee > 0 ? `<div class="totals-row"><span style="color: #6b7280;">Frais de service :</span><span>+$${totals.serviceFee.toFixed(2)}</span></div>` : ""}
    ${totals.customsFee > 0 ? `<div class="totals-row"><span style="color: #6b7280;">Douane & taxes :</span><span>+$${totals.customsFee.toFixed(2)}</span></div>` : ""}
    ${totals.discount > 0 ? `<div class="totals-row"><span style="color: #6b7280;">Remise :</span><span>-$${totals.discount.toFixed(2)}</span></div>` : ""}
    <div class="totals-row grand">
      <span>Total Facture :</span>
      <span>$${totals.total.toFixed(2)}</span>
    </div>
    <div class="totals-row" style="font-size: 12px; color: #6b7280;">
      <span>Équivalent Gourdes :</span>
      <span style="font-weight: 600;">${totals.totalHtg.toLocaleString("fr-FR")} HTG</span>
    </div>
    
    <div class="balance-box">
      <div style="font-size: 11px; color: #6b7280;">Montant versé : $${totals.paid.toFixed(2)}</div>
      <div style="font-size: 14px; font-weight: 700; color: ${totals.balance > 0 ? "#dc2626" : "#16a34a"}; margin-top: 2px;">
        ${totals.balance > 0 ? `Reste dû : $${totals.balance.toFixed(2)}` : "Solde Soldé (0.00 $)"}
      </div>
      <div style="font-size: 11px; color: #6b7280;">
        ${totals.balance > 0 ? `(${totals.balanceHtg.toLocaleString("fr-FR")} HTG)` : ""}
      </div>
    </div>
  </div>

  ${d.note ? `<div style="margin-top: 20px; font-size: 12px; color: #4b5563;"><b>Note :</b> ${esc(d.note)}</div>` : ""}

  <div class="footer">
    <div>${esc(warningText)}</div>
    <div style="margin-top: 4px;">${esc(c.footer || "Prime Shipping - Haïti - Page 1/1")}</div>
  </div>
</body>
</html>`;
  }

  // DEFAULT / EXACT FREIGHT SPECIFICATION: "global-express"
  // (Also used as baseline for corporate-b2b, store-retail, and custom with tuned styling)
  const isCorporate = template === "corporate-b2b";
  const isStore = template === "store-retail";
  const isCustom = template === "custom";

  const themeColor =
    isCustom && d.accentColor
      ? d.accentColor
      : d.brand === "shipping"
        ? "#ea580c"
        : d.brand === "store"
          ? "#d97706"
          : "#0f766e";

  const headerDarkBg = isCorporate ? "#0f172a" : "#0B132B";

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Facture ${esc(d.number)} - ${esc(c.name || "Prime Shipping")}</title>
  <style>
    @page {
      size: A4;
      margin: 10mm;
    }
    *, *:before, *:after { box-sizing: border-box; }
    body {
      font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
      color: #1f2937;
      margin: 0;
      padding: 24px;
      background: #ffffff;
      font-size: 12px;
      line-height: 1.45;
    }
    .print-bar {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-bottom: 16px;
    }
    .btn-print {
      padding: 9px 18px;
      background: ${themeColor};
      color: #ffffff;
      border: 0;
      border-radius: 8px;
      font-weight: bold;
      font-size: 12px;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    @media print {
      .print-bar { display: none; }
      body { padding: 0; }
    }

    /* TOP HEADER */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid ${themeColor};
      padding-bottom: 14px;
    }
    .brand-block {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .brand-logo {
      height: 60px;
      max-width: 170px;
      object-fit: contain;
    }
    .company-title {
      font-size: 18px;
      font-weight: 800;
      color: #111827;
      text-transform: uppercase;
      letter-spacing: -0.3px;
    }
    .company-sub {
      color: #4b5563;
      font-size: 11px;
      margin-top: 2px;
    }
    .invoice-title-block {
      text-align: right;
    }
    .invoice-title {
      margin: 0;
      font-size: 28px;
      font-weight: 900;
      letter-spacing: 1px;
      color: ${themeColor};
    }
    .invoice-num {
      font-family: monospace;
      font-size: 13px;
      font-weight: bold;
      color: #1f2937;
      margin-top: 3px;
    }
    .invoice-date {
      color: #6b7280;
      font-size: 11px;
      margin-top: 2px;
    }
    .status-badge {
      display: inline-block;
      margin-top: 6px;
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      background: ${status.bg};
      color: ${status.color};
      border: 1px solid ${status.border};
    }

    /* 2 COLUMNS CLIENT & EXPEDITION BLOCKS */
    .info-boxes {
      display: flex;
      gap: 16px;
      margin-top: 16px;
    }
    .info-card {
      flex: 1;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 12px 14px;
    }
    .info-header {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      color: ${themeColor};
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 4px;
      margin-bottom: 8px;
      letter-spacing: 0.5px;
    }
    .client-name {
      font-size: 14px;
      font-weight: bold;
      color: #111827;
      margin-bottom: 3px;
    }
    .client-meta {
      font-size: 11px;
      color: #4b5563;
      line-height: 1.4;
    }
    .client-code {
      display: inline-block;
      background: #e5e7eb;
      padding: 1px 6px;
      border-radius: 4px;
      font-family: monospace;
      font-weight: bold;
      font-size: 11px;
      color: #111827;
      margin-top: 2px;
    }

    /* TABLE */
    table.invoice-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 18px;
      font-size: 11.5px;
    }
    table.invoice-table th {
      background: #f3f4f6;
      color: #111827;
      padding: 8px 10px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      border-top: 1px solid #d1d5db;
      border-bottom: 2px solid #9ca3af;
    }
    table.invoice-table td {
      padding: 8px 10px;
      border-bottom: 1px solid #e5e7eb;
      vertical-align: middle;
    }
    table.invoice-table tr:nth-child(even) td {
      background: #fafafa;
    }
    .col-num { width: 35px; text-align: center; }
    .col-right { text-align: right; }
    .item-desc { font-weight: bold; color: #111827; }
    .item-sku { font-family: monospace; font-size: 10px; color: #6b7280; }

    /* WARNING BOX & SETTLEMENT HISTORY */
    .middle-section {
      display: flex;
      gap: 16px;
      margin-top: 16px;
      align-items: flex-start;
    }
    .warning-box {
      flex: 1.2;
      background: #fffbeb;
      border-left: 4px solid #f59e0b;
      border-top: 1px solid #fef3c7;
      border-right: 1px solid #fef3c7;
      border-bottom: 1px solid #fef3c7;
      border-radius: 0 8px 8px 0;
      padding: 10px 12px;
      font-size: 11px;
      color: #92400e;
      line-height: 1.4;
    }
    .history-box {
      flex: 1.2;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 11px;
    }
    .history-title {
      font-weight: 800;
      text-transform: uppercase;
      font-size: 10px;
      color: #475569;
      margin-bottom: 4px;
    }
    .history-entry {
      display: flex;
      justify-content: space-between;
      color: #334155;
      font-size: 10.5px;
      padding: 2px 0;
      border-bottom: 1px dashed #e2e8f0;
    }

    /* TOTALS & BALANCES */
    .totals-container {
      flex: 1.1;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 12px;
    }
    .total-line {
      display: flex;
      justify-content: space-between;
      padding: 3px 0;
      font-size: 11.5px;
      color: #4b5563;
    }
    .total-line.main {
      border-top: 1px solid #d1d5db;
      padding-top: 6px;
      margin-top: 4px;
      font-size: 13.5px;
      font-weight: 800;
      color: #111827;
    }
    .htg-line {
      font-size: 11px;
      font-weight: bold;
      color: #4b5563;
    }

    /* COLORED BALANCE CARD (BLUE / FOREST) */
    .balance-card {
      background: ${headerDarkBg};
      color: #ffffff;
      border-radius: 8px;
      padding: 10px 12px;
      margin-top: 8px;
      text-align: right;
    }
    .balance-title {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      opacity: 0.8;
    }
    .balance-usd {
      font-size: 17px;
      font-weight: 900;
      color: #38bdf8;
      letter-spacing: -0.3px;
    }
    .balance-htg {
      font-size: 11.5px;
      font-weight: 700;
      color: #facc15;
      margin-top: 1px;
    }

    /* BANK WIRE INSTRUCTIONS IF CORPORATE */
    .bank-box {
      margin-top: 14px;
      padding: 10px 12px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 11px;
      font-family: monospace;
      color: #1e293b;
    }

    /* FOOTER */
    .footer {
      margin-top: 32px;
      padding-top: 10px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      color: #9ca3af;
      font-size: 10.5px;
    }
  </style>
</head>
<body>
  <div class="print-bar">
    <button class="btn-print" onclick="window.print()">IMPRIMER / ENREGISTRER EN PDF</button>
  </div>

  <!-- HEADER -->
  <header class="header">
    <div class="brand-block">
      <img src="${esc(logo)}" alt="Logo" class="brand-logo">
      <div>
        <div class="company-title">${esc(c.name || "PRIME ENTREPRISE")}</div>
        <div class="company-sub">${esc(c.address || "Delmas 33 & Pétion-Ville, Haïti")}</div>
        <div class="company-sub">
          ${c.phone ? `Tél : ${esc(c.phone)} · ` : ""}
          ${c.whatsapp ? `WhatsApp : ${esc(c.whatsapp)} · ` : ""}
          ${c.email ? `${esc(c.email)}` : ""}
        </div>
      </div>
    </div>
    <div class="invoice-title-block">
      <h1 class="invoice-title">FACTURE</h1>
      <div class="invoice-num">N° ${esc(d.number)}</div>
      <div class="invoice-date">Date : ${esc(dateStr)}</div>
      <div><span class="status-badge">${status.label}</span></div>
    </div>
  </header>

  <!-- BLOCS FACTURÉ À & EXPÉDITION -->
  <section class="info-boxes">
    <!-- BLOC 1: FACTURÉ À -->
    <div class="info-card">
      <div class="info-header">Facturé à</div>
      <div class="client-name">${esc(client.name || "Client Comptoir / Vente directe")}</div>
      <div class="client-meta">
        ${client.code ? `<div>Code client : <span class="client-code">${esc(client.code)}</span></div>` : ""}
        ${client.phone ? `<div>Téléphone : <b>${esc(client.phone)}</b></div>` : ""}
        ${client.email ? `<div>Email : ${esc(client.email)}</div>` : ""}
        ${client.address || client.city ? `<div>Adresse : ${esc(client.address || "")} ${esc(client.city || "")}</div>` : ""}
      </div>
    </div>

    <!-- BLOC 2: DÉTAILS EXPÉDITION / COMMANDE -->
    <div class="info-card">
      <div class="info-header">Détails Logistiques & Commande</div>
      <div class="client-meta" style="font-size: 11.5px;">
        <div style="display: flex; justify-content: space-between; padding: 2px 0;">
          <span>Nombre de colis/articles :</span>
          <b>${d.shipping_details?.package_count || d.lines.length}</b>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 2px 0;">
          <span>Poids total estimé :</span>
          <b>${d.shipping_details?.total_weight_lbs != null ? `${d.shipping_details.total_weight_lbs} lbs` : "-"}</b>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 2px 0;">
          <span>Taux au lb :</span>
          <b>${d.shipping_details?.rate_per_lb != null ? `$${d.shipping_details.rate_per_lb} / lb` : "$4.50 / lb"}</b>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 2px 0;">
          <span>Taux de change appliqué :</span>
          <b>1 USD = ${totals.rate} HTG</b>
        </div>
      </div>
    </div>
  </section>

  <!-- TABLEAU DES ARTICLES / COLIS -->
  <table class="invoice-table">
    <thead>
      <tr>
        <th class="col-num">N°</th>
        <th>N° de suivi / Description</th>
        <th class="col-right" style="width: 100px;">Douane/Frais</th>
        <th class="col-right" style="width: 80px;">Poids (lbs)</th>
        <th class="col-right" style="width: 110px;">Transport/P.U</th>
        <th class="col-right" style="width: 110px;">Total USD</th>
      </tr>
    </thead>
    <tbody>
      ${d.lines
        .map(
          (l, idx) => `
        <tr>
          <td class="col-num">${l.num || idx + 1}</td>
          <td>
            <div class="item-desc">${esc(l.label)}</div>
            ${l.tracking_or_sku ? `<div class="item-sku">N° Suivi / Réf : ${esc(l.tracking_or_sku)}</div>` : ""}
          </td>
          <td class="col-right">${l.customs_fee_usd != null && l.customs_fee_usd > 0 ? `$${Number(l.customs_fee_usd).toFixed(2)}` : "-"}</td>
          <td class="col-right">${l.weight_lbs != null && l.weight_lbs > 0 ? `${Number(l.weight_lbs).toFixed(1)} lbs` : l.qty && l.qty > 1 ? `x${l.qty}` : "-"}</td>
          <td class="col-right">${l.unit != null ? `$${Number(l.unit).toFixed(2)}` : "-"}</td>
          <td class="col-right" style="font-weight: 800; color: #111827;">$${Number(l.total).toFixed(2)}</td>
        </tr>`,
        )
        .join("")}
    </tbody>
  </table>

  <!-- SECTION INFÉRIEURE : AVERTISSEMENT, HISTORIQUE, TOTAUX -->
  <div class="middle-section">
    <!-- GAUCHE : AVERTISSEMENT & HISTORIQUE DES RÈGLEMENTS -->
    <div style="flex: 1.4; display: flex; flex-direction: column; gap: 10px;">
      <!-- AVERTISSEMENT -->
      <div class="warning-box">
        <div style="font-weight: 800; text-transform: uppercase; margin-bottom: 2px;">⚠️ Condition de retrait :</div>
        ${esc(warningText)}
      </div>

      <!-- HISTORIQUE DES RÈGLEMENTS -->
      ${
        d.payment_history && d.payment_history.length > 0
          ? `
      <div class="history-box">
        <div class="history-title">Historique des règlements :</div>
        ${d.payment_history
          .map(
            (p) => `
          <div class="history-entry">
            <span>${esc(p.date || dateStr)} · <b>${esc(p.method || "Paiement")}</b> ${p.reference ? `(${esc(p.reference)})` : ""}</span>
            <span style="font-weight: 700;">$${Number(p.amount_usd || 0).toFixed(2)} ${p.amount_htg ? `(${p.amount_htg.toLocaleString("fr-FR")} HTG)` : ""}</span>
          </div>`,
          )
          .join("")}
      </div>`
          : `
      <div class="history-box">
        <div class="history-title">Moyens de paiement acceptés :</div>
        <div style="color: #64748b; font-size: 10.5px;">
          Espèces (USD / Gourdes au taux du jour), MonCash, Natcash, Sogexpress, Virement bancaire.
        </div>
      </div>`
      }

      ${
        c.bank_accounts && isCorporate
          ? `
      <div class="bank-box">
        <div style="font-weight: bold; margin-bottom: 3px;">Coordonnées bancaires pour virement :</div>
        ${esc(c.bank_accounts).replace(/\n/g, "<br>")}
      </div>`
          : ""
      }
    </div>

    <!-- DROITE : TOTAUX & RESTE DÛ -->
    <div class="totals-container">
      <div class="total-line">
        <span>Sous-total articles :</span>
        <span>$${totals.subtotal.toFixed(2)}</span>
      </div>
      ${
        totals.serviceFee > 0
          ? `<div class="total-line"><span>Frais de service / manutention :</span><span>+$${totals.serviceFee.toFixed(2)}</span></div>`
          : ""
      }
      ${
        totals.customsFee > 0
          ? `<div class="total-line"><span>Douane & formalités :</span><span>+$${totals.customsFee.toFixed(2)}</span></div>`
          : ""
      }
      ${
        totals.discount > 0
          ? `<div class="total-line" style="color: #16a34a;"><span>Remise commerciale :</span><span>-$${totals.discount.toFixed(2)}</span></div>`
          : ""
      }

      <div class="total-line main">
        <span>Total de la facture :</span>
        <span>$${totals.total.toFixed(2)} USD</span>
      </div>
      <div class="total-line htg-line">
        <span>Montant total en gourdes :</span>
        <span>${totals.totalHtg.toLocaleString("fr-FR")} HTG</span>
      </div>

      <div class="total-line" style="margin-top: 6px; border-top: 1px dashed #e5e7eb; padding-top: 4px;">
        <span>Montant déjà versé :</span>
        <span style="font-weight: bold;">$${totals.paid.toFixed(2)} USD (${totals.paidHtg.toLocaleString("fr-FR")} HTG)</span>
      </div>

      <!-- ENCADRÉ COLORÉ : SOLDE RESTANT & ÉQUIVALENT GOURDES -->
      <div class="balance-card">
        <div class="balance-title">${totals.balance > 0 ? "Solde restant dû" : "Facture soldée"}</div>
        <div class="balance-usd">
          ${totals.balance > 0 ? `${totals.balance.toFixed(2)} USD` : "0.00 USD"}
        </div>
        <div class="balance-htg">
          Équivalent en gourdes : ${totals.balanceHtg.toLocaleString("fr-FR")} HTG
        </div>
        ${
          totals.change > 0
            ? `<div style="font-size: 11px; color: #a7f3d0; margin-top: 2px;">Monnaie rendue : ${totals.change.toFixed(2)} $ (${totals.changeHtg.toLocaleString("fr-FR")} HTG)</div>`
            : ""
        }
      </div>
    </div>
  </div>

  ${d.note ? `<div style="margin-top: 14px; font-size: 11px; color: #4b5563;"><b>Note spéciale :</b> ${esc(d.note)}</div>` : ""}

  <!-- FOOTER -->
  <footer class="footer">
    <div>${esc(c.footer || "Prime Shipping · Delmas 33 & Pétion-Ville, Haïti · Tous droits réservés.")}</div>
    <div>Page 1/1</div>
  </footer>
</body>
</html>`;
}

export function openInvoice(d: InvoiceData) {
  const html = renderInvoiceHtml(d);
  const w = window.open("", "_blank");
  if (!w) {
    if (typeof window !== "undefined") {
      alert(
        "Veuillez autoriser les popups dans votre navigateur pour afficher la facture imprimable.",
      );
    }
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}

export function generateInvoiceWhatsAppText(d: InvoiceData): string {
  const totals = invoiceTotals(d);
  const brandName =
    d.brand === "shipping"
      ? "Prime Express Shipping"
      : d.brand === "store"
        ? "Prime Store"
        : "Prime Shipping";

  const linesList = d.lines
    .slice(0, 8)
    .map((l) => `• ${l.label} (${l.qty || 1}x) : $${Number(l.total).toFixed(2)}`)
    .join("\n");

  const moreLines =
    d.lines.length > 8 ? `\n• ... et ${d.lines.length - 8} autre(s) article(s)` : "";

  return `📦 *${brandName.toUpperCase()}* — FACTURE OFFICIELLE
Numéro : *${d.number}*
Date : ${d.date || new Date().toLocaleDateString("fr-FR")}
Client : ${d.client.name || "Client comptoir"} ${d.client.code ? `(${d.client.code})` : ""}

📋 *Articles & Services :*
${linesList}${moreLines}

💵 *Détails financiers :*
• Sous-total : $${totals.subtotal.toFixed(2)} USD
${totals.serviceFee > 0 ? `• Frais de service : +$${totals.serviceFee.toFixed(2)} USD\n` : ""}${totals.customsFee > 0 ? `• Douane : +$${totals.customsFee.toFixed(2)} USD\n` : ""}${totals.discount > 0 ? `• Remise : -$${totals.discount.toFixed(2)} USD\n` : ""}• *TOTAL : $${totals.total.toFixed(2)} USD* (≈ *${totals.totalHtg.toLocaleString("fr-FR")} HTG*)
• Montant versé : $${totals.paid.toFixed(2)} USD
👉 *SOLDE DÛ : $${totals.balance.toFixed(2)} USD* (≈ *${totals.balanceHtg.toLocaleString("fr-FR")} HTG*)

${d.warning_box_text ? `⚠️ ${d.warning_box_text}\n\n` : ""}Merci pour votre confiance !
Pour toute question : ${d.company?.phone || "+509 3700-1122"}`;
}
