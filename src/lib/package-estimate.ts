export function estimatePackageShipping(weight: unknown, rate: unknown): number | null {
  if (weight == null || weight === "" || rate == null || rate === "") return null;
  const pounds = Number(weight);
  const price = Number(rate);
  if (!Number.isFinite(pounds) || !Number.isFinite(price) || pounds < 0 || price < 0) return null;
  return Math.round(pounds * price * 100) / 100;
}

export function packageSubmissionError(error: unknown, online: boolean): string {
  const message = error instanceof Error ? error.message : String((error as { message?: string })?.message || "");
  if (!online || /failed to fetch|fetch failed|network|load failed/i.test(message)) {
    return "Connexion interrompue. Vos informations sont conservées : réessayez quand Internet revient.";
  }
  return message || "Le colis n’a pas pu être enregistré. Vos informations sont conservées, vous pouvez réessayer.";
}