import { expect, it } from "vitest";
import { orderEmailStage } from "./order-email";
it("un portefeuille payé saute l'attente de paiement", () => expect(orderEmailStage("payee").kind).toBe("commande_traitement"));
it("un paiement à vérifier annonce la réception", () => expect(orderEmailStage("en_attente").kind).toBe("commande"));
it("une commande livrée est terminée", () => expect(orderEmailStage("livree").kind).toBe("commande_terminee"));