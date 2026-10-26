# Roadmap Prime Shipping (prompt maître V4)

## Fait
- [x] Validation/refus des recharges (plus d'erreur updateWalletTxStatus)
- [x] E-mails Brevo sans clé de service
- [x] Fiche réglages entreprise créée (les modifs admin s'enregistrent) + expéditeur
- [x] Tarifs 4.50 / 132 retirés du texte, nom « Prime Entreprise » remplacé
- [x] Étoiles décoratives retirées, favicon + icône d'installation logo

- [x] Réseaux sociaux on/off, corridors, zones modifiables (admin onglet 10)
- [x] Mode de commande par produit + page produit lit la base

- [x] Frais spéciaux + total auto, espace Prime Shipping client, onglet e-mails, cloche mobile
- [x] Cause principale des plantages (réglages différents serveur/navigateur) corrigée

- [x] Envoi manuel d'e-mail, paiement/recharge en pleine page avec X

## À faire
- [x] Minimum montant/quantité par produit et conditions administrables : 8 tests réussis, sauvegarde et parcours jusqu’au paiement vérifiés connecté sans achat réel.
- [x] Suppression des comptes sans clé privée et suppression confirmée des colis : parcours connectés vérifiés sur données temporaires, protections testées ; redéploiement Vercel requis.
- [ ] Confirmer l’envoi du nouveau colis depuis Vercel — clé Brevo valide et expéditeur configuré, mais aucune requête pour ce colis dans Brevo ; absence de compte du demandeur pour reproduire. Erreurs précises et renvoi manuel ajoutés.
- [x] E-mails commandes enrichis : photo, détails, étapes selon paiement, logos PNG transparents
- [x] Montant USD libre et taux par produit, conversion recalculée dans la base et taux conservés avec la commande (17 tests réussis)
- [x] Alertes administrateurs configurables : commandes, colis, recharges et support ; lien vers validation après connexion
- [ ] Tester débit réel, livraison e-mail et sauvegarde admin — compte du demandeur absent ; connexion dans l’aperçu requise, puis redéploiement Vercel
- [ ] Alertes achats assistés/factures — leurs parcours ne conservent pas encore les opérations dans la base, contrairement aux commandes ; stockage réel nécessaire avant alertes fiables
- [x] Simplifier Mes colis et retirer le faux message d’adresse non attribuée
- [x] Restreindre le suivi public/non-propriétaire au statut, date et prochaine étape (contrôle dans la base)
- [x] Ordonner les sept statuts français et enrichir les e-mails de chaque transition (7 tests réussis)
- [ ] Vérifier les pages connectées, la confidentialité sur un colis réel et la réception de chaque e-mail — aucun compte du demandeur disponible pour les tests ; connexion dans l’aperçu nécessaire
- [x] Bandeau supérieur de paiements remplacé par un seul bandeau de marques ; paiements du pied de page conservés
- [x] Logos authentiques MonCash, Natcash, PayPal et WhatsApp ; bouton WhatsApp unique (images chargées, mobile sans débordement)
- [x] Réseaux et e-mail du support affichés depuis les réglages existants ; sélection d’icône ajoutée dans l’administration (sauvegarde connectée non testée)
- [x] Choix livraison/retrait conforme au produit ; retrait visible même sans adresse, mais validation bloquée jusqu'à configuration (3 tests réussis)
- [x] Panier persistant avec quantités, suppression et accès au paiement article par article (parcours public ordinateur/téléphone vérifié)
- [x] Rappel demandé par le client via Brevo et modèle administrable ajoutés
- [ ] Vérifier retrait et rappel Brevo avec le compte du demandeur — aucun compte correspondant pour la connexion de test ; envoi réel non testé
- [x] Déclaration : erreur réseau lisible, nouvelle tentative avec identifiant stable et estimation au tarif administré (tests du calcul et message réseau réussis)
- [x] Checkout mobile sans éléments flottants et logos sans fond (affichage public vérifié à 390 et 1280 px)
- [ ] Tester la déclaration et le checkout connecté — connexion du demandeur nécessaire dans l’aperçu, aucun compte correspondant disponible pour le test
- [x] Modèles des six e-mails d’authentification et envoi personnalisé configurés
- [ ] Activation des e-mails d’authentification — attend vérification DNS et mise en ligne des nouvelles routes
- [x] Catalogue réel et navigation « Commander » vers la fiche produit (tests ordinateur/mobile)
- [ ] Chasse aux erreurs « Cette page n'a pas pu s'afficher »
