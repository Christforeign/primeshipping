export function topupPrice(amount: number, productRate: number, siteRate: number) {
  if (![amount, productRate, siteRate].every((n) => Number.isFinite(n) && n > 0)) throw new Error("Montant ou taux invalide");
  if (Math.abs(amount * 100 - Math.round(amount * 100)) > 0.000001) throw new Error("Deux décimales maximum");
  const totalHtg = Math.round(amount * productRate * 100) / 100;
  return { totalHtg, walletUsd: Math.round((totalHtg / siteRate + Number.EPSILON) * 100) / 100 };
}