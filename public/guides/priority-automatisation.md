# Priority Courier → Prime Shipping : tutoriels de réception

## Ce qui est construit et ce qui n’est pas encore activé

Le site peut recevoir un avis Priority sous forme de texte, reconnaître un client par son code PS ou son nom, créer son colis et demander l’envoi de son e-mail via Brevo. Un nom ambigu ou un code PS inconnu reste dans Administration → Gestion des colis → Réception automatique Priority, à attribuer manuellement. Le client voit « En transit », sans mention de la République dominicaine ni du fournisseur dans le champ transporteur.

Il faut encore choisir UNE méthode ci-dessous, la connecter et tester un vrai avis. Aucune boîte mail n’est actuellement lue automatiquement. Le bouton « Analyser » reste un secours manuel.

Le site accepte un JSON normalisé, PAS les formats bruts Brevo/Cloudflare. Les méthodes 3 et 4 nécessitent un adaptateur supplémentaire après ton choix.

## Choisir sans confondre coût et délai

| Méthode | Délai | Coût / prérequis |
| --- | --- | --- |
| Gmail + Make | Vérifications périodiques ; Free : minimum 15 minutes | Free : 1 000 crédits Make/mois, limites vérifiées le 30 octobre 2026, susceptibles de changer |
| Outlook + Power Automate | Déclenchement à l’arrivée, délai variable | L’action HTTP exige un droit premium, même si Outlook est standard |
| Brevo réception entrante | Envoi au site à réception, pas de délai garanti | Domaine de réception dédié ; disponibilité, coût et authentification à confirmer sur ton compte |
| Cloudflare Email Routing + Worker | Envoi au site à réception, pas de délai garanti | Configuration DNS Cloudflare et petit programme de relais ; limites Workers applicables |

Recevoir/lire un avis Priority ne consomme pas tes 300 ENVOIS quotidiens Brevo. En revanche chaque e-mail que Prime envoie au client, et chaque alerte envoyée à un administrateur, consomme le quota sortant. Exemple : 1 notification client + 2 alertes admin = 3 envois. Make, Microsoft, Brevo inbound et Cloudflare ont leurs propres limites ; ils ne sont pas tous gratuits.

## Préparation commune (obligatoire)

1. Ouvre un vrai avis Priority et relève l’adresse exacte de l’expéditeur dans les détails du message, pas seulement son nom affiché.
2. Après ton choix, demande dans Lovable la configuration sécurisée de `PRIORITY_WEBHOOK_SECRET` : génère et copie la même valeur dans la fenêtre sécurisée et dans le relais. Ne la partage jamais dans une capture ou un message.
3. Configure `PRIORITY_ALLOWED_SENDERS` avec l’adresse exacte de Priority. Plusieurs adresses se séparent par des virgules. Ne mets pas un domaine entier. Le filtre d’expéditeur ne remplace pas l’authentification : le relais doit aussi conserver/vérifier l’origine du message.
4. Pour Vercel, ajoute les mêmes réglages serveur dans projet → Settings → Environment Variables, puis redéploie. Les réglages Lovable ne se copient pas automatiquement sur Vercel. Ils ne doivent jamais commencer par `VITE_`.
5. Redéploie le site avant de configurer l’automatisation. Ne modifie pas les DNS d’envoi existants, ni `notify.primeshipping.net`.
6. URL de réception Vercel : `https://primeshipping.net/api/public/priority-webhook`. Si ce domaine n’est pas encore relié au déploiement actualisé, utilise l’adresse de ton déploiement actualisé. L’adresse Lovable, après publication, est `https://primeshipping.lovable.app/api/public/priority-webhook`.

### Format à envoyer par le relais

Méthode : POST. En-tête `Content-Type: application/json`. En-tête `Authorization: Bearer <valeur copiée depuis la fenêtre sécurisée>`.

Corps (les cinq champs sont des exemples de mapping, pas des données client réelles) :

```json
{
  "messageId": "identifiant-unique-fourni-par-la-messagerie",
  "from": "adresse-exacte-du-priority-verifiee-dans-le-mail",
  "subject": "objet-du-message",
  "text": "Consignatario: NOM CLIENT PS-1234\nTracking: TRACKING\nRecepción: REFERENCE\nContenido: ARTICLE\nPeso: 0.20 LBS"
}
```

Mappe les valeurs de la messagerie ; ne copie pas ces exemples tels quels. `from` doit contenir uniquement l’adresse, sans nom ni chevrons. `messageId` doit rester identique lors d’une nouvelle tentative du même message. `text` est le corps en texte simple, pas du HTML ni un PDF. Le site ignore les identifiants de clients fournis par le relais : il retrouve le client lui-même.

## 1. Gmail + Make (sans changer tes DNS)

1. Dans Make, crée un compte, puis **Scenarios → Create a new scenario**.
2. Ajoute **Gmail → Watch emails**, clique **Create a connection** et autorise la boîte qui reçoit les avis Priority. Cette connexion appartient à Make ; ce n’est pas le connecteur Gmail Lovable.
3. Limite la surveillance à Inbox ou à un libellé dédié. Dans les filtres du module, utilise l’expéditeur exact Priority et, si nécessaire, l’objet des avis de réception. Ne surveille pas toute la boîte sans filtre.
4. Choisis le début de surveillance : nouveaux messages à partir de maintenant. Pour l’essai, sélectionne explicitement un ancien avis ou fais arriver un nouveau message correspondant au filtre.
5. Clique **Run once**, ouvre le résultat Gmail et repère : identifiant du message, adresse de l’expéditeur, objet, corps texte. Si seul le HTML est disponible, ajoute une conversion HTML vers texte avant l’étape suivante. Vérifie que les lignes Consignatario/Tracking/Peso sont conservées.
6. Ajoute **HTTP → Make a request**. Selon la version de l’interface, les champs sont regroupés sous la configuration de requête. Mets l’URL ci-dessus, méthode POST et les deux en-têtes indiqués.
7. Pour le corps, utilise le constructeur JSON / une structure de données, ou **JSON → Create JSON** puis mappe sa sortie dans le corps HTTP. Ne colle pas du corps e-mail dans une chaîne JSON à la main : guillemets et retours à la ligne casseraient le JSON.
8. Déclare les champs `messageId`, `from`, `subject`, `text`, puis mappe les quatre valeurs du résultat Gmail. Ne mappe pas le message « raw » encodé.
9. **Run once** : vérifie un HTTP 200 puis le colis ou la file À attribuer dans Prime. Une réponse 503 signifie que les réglages communs ne sont pas installés sur le site appelé.
10. Active le scénario et son calendrier. En gratuit, ce n’est pas instantané : jusqu’à environ 15 minutes de délai de vérification, plus le traitement. Le plafond de 1 000 crédits/mois peut être atteint rapidement : Gmail, conversions et HTTP consomment selon les exécutions/modules.
11. Configure dans Make une gestion d’erreur avec nouvelle tentative sur les erreurs temporaires 5xx ; garde le même messageId. Ne supprime pas le mail avant le succès.

Sources : https://apps.make.com/gmail-modules ; https://help.make.com/email-triggered-ai-agent ; https://www.make.com/en/pricing

## 2. Outlook + Power Automate

1. Vérifie que tu utilises une boîte Microsoft 365 compatible avec **Office 365 Outlook** et que ta licence autorise l’action **HTTP premium**. Une adresse Outlook personnelle peut nécessiter un autre connecteur : ne suppose pas que V3 s’applique à toute boîte.
2. Dans Power Automate, **Create → Automated cloud flow**.
3. Choisis **Office 365 Outlook → When a new email arrives (V3)**, puis connecte la bonne boîte.
4. Configure le dossier Inbox, l’expéditeur exact et le filtre d’objet directement dans le déclencheur si disponibles. N’active pas le téléchargement de toutes les pièces jointes : elles ne sont pas nécessaires.
5. Si le corps est HTML, ajoute **Content Conversion → Html to text**. Utilise le corps retourné par le déclencheur comme entrée.
6. Ajoute l’action **HTTP**, méthode POST, URL commune, en-têtes communs. Construis le JSON avec les valeurs dynamiques : identifiant message, adresse expéditeur (pas son nom), objet, résultat texte de l’étape 5.
7. Enregistre, clique **Test**, fais arriver un avis et consulte l’historique du flux. Vérifie HTTP 200 puis l’administration Prime.
8. Active le flux, vérifie la politique de nouvelle tentative sur les erreurs temporaires et garde l’identifiant du message inchangé. Ce service n’offre pas ici une garantie de livraison instantanée.

Sources : https://learn.microsoft.com/en-us/power-automate/email-triggers ; https://learn.microsoft.com/en-us/connectors/webcontents/ ; https://learn.microsoft.com/en-us/power-platform/admin/wp-license-management

## 3. Brevo Inbound Parse (réception, PAS ouvertures/clics)

Cette méthode exige une étape de construction complémentaire : le site actuel n’accepte pas directement le payload natif Brevo. Ne colle pas simplement l’URL dans le webhook transactionnel des ouvertures/clics.

1. Vérifie que **Inbound parsing** est disponible pour ton compte Brevo, avec ses conditions tarifaires et de réception. La documentation publique consultée ne permet pas de garantir qu’il est inclus dans ton forfait gratuit.
2. Choisis un sous-domaine de réception distinct, par exemple `incoming.primeshipping.net`. Ne remplace pas les MX de ton domaine principal ni ceux d’une boîte existante.
3. Suis le guide officiel Brevo pour déclarer le domaine de réception et ajouter précisément les DNS/MX fournis. Les valeurs dépendent de leur configuration : aucune valeur inventée n’est donnée ici.
4. Fais construire dans Prime l’adaptateur Brevo qui vérifie le mécanisme d’authentification disponible, extrait l’adresse d’origine, le Message-ID, le sujet et le texte du payload natif, puis utilise l’import existant.
5. Configure le webhook de type **inbound**, via l’interface ou l’API suivant ce qui est disponible sur ton compte. Un connecteur Brevo d’envoi déjà lié ne suffit pas à activer inbound.
6. Fais envoyer les avis Priority à l’adresse entrante choisie, ou transfère uniquement ces avis depuis Gmail. Gmail : **Settings → See all settings → Forwarding and POP/IMAP → Add a forwarding address**, confirme l’adresse, puis crée un filtre sur l’expéditeur Priority → **Forward it to**. Le mail de confirmation devra être traité par le relais, car il n’est pas un avis Priority.
7. Teste un avis, son doublon et un destinataire ambigu avant activation complète. Le transfert doit préserver l’expéditeur original ; le champ du nouveau message de transfert ne doit pas être confondu avec celui de Priority.

Sources : https://developers.brevo.com/docs/inbound-parse-webhooks ; https://developers.brevo.com/docs/transactional-webhooks ; https://support.google.com/mail/answer/10957

## 4. Cloudflare Email Routing + Email Worker

Cette méthode exige un relais supplémentaire. Un simple transfert Email Routing vers l’URL du site n’existe pas : il faut un Worker qui traite le message MIME.

1. Vérifie où ton DNS est géré. Si nécessaire, ajoute le domaine dans Cloudflare, recopie TOUS les DNS existants (site Vercel, Brevo, auth, messagerie), puis change les serveurs de noms seulement après contrôle. Acheter le domaine chez Vercel ne t’oblige pas à garder son DNS, mais une migration mal faite peut interrompre site et e-mails.
2. Dans Cloudflare, configure **Email Routing** pour un domaine de réception compatible avec ta messagerie existante. Vérifie le support du sous-domaine et les conflits MX avant toute modification ; n’active pas aveuglément les MX sur le domaine principal.
3. Prévois une adresse dédiée, par exemple `priority@incoming.primeshipping.net` si cette configuration est supportée et validée. Évite le catch-all de toutes tes adresses.
4. Fais construire un **Email Worker** avec un parseur MIME éprouvé : traitement `email(message, env, ctx)`, extraction du texte simple, du Message-ID, du sujet, de l’expéditeur original et contrôle d’origine. Le flux `message.raw` n’est pas du texte de mail directement utilisable.
5. Stocke le même `PRIORITY_WEBHOOK_SECRET` comme secret du Worker et du site, puis programme le POST au format commun. Conserve un identifiant stable et une stratégie durable de reprise si Prime est indisponible ; ne suppose pas qu’un fetch raté sera automatiquement réessayé.
6. Dans la règle Email Routing de l’adresse dédiée, choisis **Send to a Worker** et le Worker déployé.
7. Fais utiliser cette adresse dans Priority ou configure le transfert filtré de Gmail. Le message de validation Gmail doit être pris en charge séparément par le relais.
8. Teste arrivée, attribution, doublon et panne temporaire. Vérifie les limites Workers et les coûts éventuels du relais/stockage de reprises. La réception entrante et les envois Brevo restent deux quotas distincts.

Sources : https://developers.cloudflare.com/email-service/configuration/email-routing-addresses/ ; https://developers.cloudflare.com/email-service/api/route-emails/email-handler/ ; https://developers.cloudflare.com/email-service/platform/pricing/

## Contrôle avant activation

- Client reconnu : colis en transit dans son compte, poids correct et estimation au tarif actuel de l’administration.
- Code PS inconnu / nom ambigu : aucun colis attribué à un autre client ; ligne À attribuer dans l’admin.
- Même mail reçu deux fois : pas de second colis. Le même tracking est également vérifié entre deux messages distincts.
- Brevo indisponible : le colis est conservé ; le journal permet de diagnostiquer l’e-mail et l’admin peut le renvoyer. L’acceptation Brevo ne prouve pas la livraison dans la boîte du client.
- Réponse 401 : clé absente/incorrecte ; 403 : expéditeur non autorisé ; 422 : texte non reconnu ; 503 : réception pas activée ; 500 : panne temporaire, réessayer avec le même identifiant.
- Aucun mot de passe Priority nécessaire ; aucun contournement reCAPTCHA ni session Priority permanente.

## Et Gmail directement dans Lovable ?

C’est une autre architecture, pas une option déjà branchée : le connecteur Gmail relie ta boîte de travail, pas celles des clients. Sans abonnement Gmail push + relais Pub/Sub, des vérifications planifiées ne sont pas instantanées et peuvent coûter du fonctionnement Cloud. Si tu choisis cette voie, il faudra connecter Gmail et construire sa synchronisation, ses reprises et ses autorisations. Make évite cette construction initiale mais ajoute son propre quota.