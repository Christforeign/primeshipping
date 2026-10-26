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
