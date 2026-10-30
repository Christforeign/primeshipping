export function orderEmailStage(status: string) {
  if (status === "en_attente") return { kind: "commande" as const, label: "Paiement en attente de vérification", message: "Nous avons reçu votre commande. Dès que votre paiement sera approuvé, nous la validerons et commencerons son traitement." };
  if (status === "livree") return { kind: "commande_terminee" as const, label: "Commande terminée", message: "Votre commande est terminée. Merci pour votre confiance envers Prime Store." };
  if (status === "annulee") return { kind: "commande_annulee" as const, label: "Commande annulée", message: "Votre commande a été annulée. Contactez notre équipe pour toute question concernant votre paiement." };
  if (status === "expediee") return { kind: "commande_expediee" as const, label: "Livraison en cours", message: "Votre commande est en route. Notre équipe vous accompagne jusqu’à sa remise." };
  if (status === "preparation") return { kind: "commande_traitement" as const, label: "Commande en préparation", message: "Votre paiement est confirmé et votre commande est en préparation." };
  return { kind: "commande_traitement" as const, label: "Commande en traitement", message: "Votre paiement est approuvé. Votre commande est en cours de traitement par notre équipe." };
}