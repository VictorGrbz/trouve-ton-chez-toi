# PLAN.md — trouve-ton-chez-toi

> Cadrage rédigé par Jarvis (session racine). Ce document est destiné à être exécuté par l'Artisan (Claude Code local, ouvert dans ce dossier). L'Artisan lit ce PLAN.md et exécute les étapes une par une, y compris les commandes Impeccable.

---

## État d'avancement (08/09/2026)

- ✅ **Étape 0 — Dépôt Git** : `VictorGrbz/trouve-ton-chez-toi` créé et poussé.
- ✅ **Étape 1 — Initialisation du projet** : scaffold Next.js (App Router, TS, Tailwind) + PWA Serwist + connexion PostgreSQL (`db/index.ts`) faits, build et dev vérifiés. Écart au plan initial : Next.js 16 active Turbopack par défaut, incompatible avec `@serwist/next` stable → scripts `dev`/`build` basculés sur `--webpack` dans `package.json`. Hook `tsc --noEmit` configuré dans `.claude/settings.json` (peut nécessiter d'ouvrir `/hooks` une fois pour s'activer si jamais il ne se déclenche pas).
- ✅ **Étape 2 — Direction artistique** : `PRODUCT.md` créé (via `/impeccable init`, à partir du brief existant + cadrage). Brief de direction confirmé via `/impeccable shape` (écran de référence : fiche bien). Mock validé par Claude Design déposé dans `.impeccable/mocks/external/Design Trouve Ton Chez Toi.png` — **référence visuelle approuvée du projet** : fond crème, bleu marine, accents ambre/or, layout en cartes. Logo existant dans `ressources/Documents avant projet/App immobilier/` confirmé **non contraignant** (placeholder à ignorer). Système visuel porté dans le code le 04/09/2026 (voir note ci-dessous) — palette échantillonnée directement sur les pixels du mock dans `app/globals.css` (`@theme inline`), primitives `components/ui/` (Card, Badge, Button, Input, Select), icônes PWA générées via `next/og` (`app/icon.tsx`, `app/apple-icon.tsx`) et `app/manifest.ts` aligné.
- ✅ **Étape 3 — Profil d'achat et budget (3 personas)** : formulaire progressif à `/projet/nouveau` (`app/projet/nouveau/`), calcul déterministe d'enveloppe budgétaire (`lib/budget.ts`, formule d'annuité + hypothèses conservatrices, taux d'effort 30 % sous le plafond légal de 35 % que l'Étape 4 formalisera), table `projet_achat` (`db/schema.sql`, appliquée via `npm run db:init`). Testé de bout en bout sur la vraie base Coolify pour les 3 personas (solo, couple, investisseur) — enveloppes cohérentes, rendement locatif visé capté mais non injecté dans le calcul, cas limite revenu=0 géré. Données de test nettoyées après vérification.
- ✅ **Étape 4 — Moteur de simulation financière (sans IA)** : `config/bareme-notarial.json` (émoluments par tranche + DMTO par département, taux national par défaut), `lib/notaire.ts` (frais d'acquisition précis), `lib/credit.ts` (capacité d'emprunt avec assurance emprunteur, taux d'effort plafonné à 35 % HCSF via `TAUX_EFFORT_PLAFOND_HCSF_PCT`). `lib/budget.ts` refondu en orchestrateur pur (API publique inchangée) : résout l'enveloppe par dichotomie sur `calculerFraisNotaire` (département inconnu au stade projet → taux national par défaut, à affiner à l'Étape 6). Barème vérifié manuellement sur [Service-Public.fr (R54267)](https://www.service-public.gouv.fr/particuliers/vosdroits/R54267) le 08/09/2026 (`verifie_le` dans le JSON). Simulation testée sur les cas Paris 300k€/dept connu, petit bien 90k€/dept inconnu, et capacité d'emprunt couple 5000€/25 ans — cohérents avec un simulateur de frais de notaire reconnu. Colonnes de traçabilité ajoutées à `projet_achat` (`mensualite_indicative`, `capacite_emprunt_indicative`, `cout_total_interets_indicatif`, `taux_effort_effectif_pct`), migration appliquée sur la base Coolify via le tunnel SSH. Testé de bout en bout sur les 3 personas, données de test nettoyées. Récapitulatif du wizard `/projet/nouveau` enrichi (mensualité, coût total des intérêts, taux d'effort effectif). Hors scope (différé) : abattement bancaire sur revenus locatifs projetés (persona investisseur), toujours non intégré au calcul.
- ✅ **Étape 5 — Suivi du taux de référence** : écart au plan initial — l'API Webstat SDMX nécessite une inscription développeur (`developer.webstat.banque-france.fr`) pour obtenir une clé, et ce sous-domaine s'est révélé inaccessible depuis l'environnement de l'Artisan pour explorer le catalogue ; décision prise avec Victor de lire directement la page mensuelle officielle `banque-france.fr/fr/statistiques/credit/credits-aux-particuliers-AAAA-MM` (source primaire Banque de France, pas un site tiers), dont la phrase "Le taux d'intérêt des nouveaux crédits à l'habitat (hors renégociations) aux ménages s'élève à X % en <mois> <année>" s'est vérifiée stable sur juin et juillet 2026. `db/sync-taux-reference.mjs` (script autonome, même convention que `db/init.mjs`) : recule mois par mois (jusqu'à 6) jusqu'à trouver la dernière page publiée (retard constaté ~2 mois), extrait le taux et fait un upsert dans `taux_reference` (`db/schema.sql`, clé unique sur `mois_reference`). `lib/taux-reference.ts` expose la lecture côté app (`obtenirTauxReferenceActuel`). `lib/budget.ts` utilise ce taux quand disponible (sinon retombe sur le défaut indicatif de `lib/credit.ts`), tracé dans `hypotheses_calcul.tauxReference`. Champ optionnel "taux proposé par votre banque" ajouté au wizard et à `projet_achat.taux_banque_propose_pct` — persisté mais jamais injecté dans le calcul (vérifié : un test avec 3.9% saisi a bien produit un calcul basé sur le taux de référence 3.3%, pas 3.9%). Récapitulatif du wizard affiche désormais le taux retenu et sa source datée. Synchronisation testée manuellement en réel (3.3 %, juillet 2026, upsert idempotent vérifié par double exécution) et testée de bout en bout avec un projet de test. **Reste à faire par Victor (hors dépôt, accès Coolify requis)** : créer une Scheduled Task Coolify sur le service de l'app, commande `node --env-file=.env.local db/sync-taux-reference.mjs` (ou `npm run sync:taux-reference`), fréquence mensuelle (ex. `0 6 5 * *` — le 5 de chaque mois, après la publication BDF début de mois).
- ✅ **Étape 6 — Fiche bien (création et stockage)** : `db/schema.sql` (tables `bien` et `bien_photo`), `lib/minio.ts` (client `minio`, accepte `MINIO_ENDPOINT` en URL complète comme `DATABASE_URL` — cas du tunnel SSH local — ou en hostname nu), `app/biens/nouveau/` (formulaire : saisie guidée + texte d'annonce collé tel quel, menu déroulant pour rattacher le bien à un projet existant, upload de photos multiples), `app/biens/[id]/page.tsx` (fiche de lecture minimale, nécessaire comme cible de redirection après création — sert aussi de base pour les Étapes 7-9). Testé à trois niveaux : (1) script bas niveau créant un bien + upload réel sur MinIO pour les 3 personas ; (2) test navigateur réel (Playwright) du formulaire complet jusqu'à la redirection vers la fiche, données correctement affichées ; (3) après correction infra par Victor (middleware Traefik `addprefix` obsolète sur `img.jess-vic.ovh`, reliquat de la bascule R2→MinIO du 27/08, qui réécrivait le chemin vers le mauvais bucket), URLs de photos re-testées en réel pour les 3 personas → **HTTP 200 confirmé sur `img.jess-vic.ovh`**, données de test nettoyées (DB + MinIO).
- ✅ **Étape 7 — Check-list de visite dynamique et alertes de vigilance** : `lib/alertes-vigilance.ts` (règles pures, aucune IA) génère des alertes réelles uniquement à partir des données déjà saisies sur la fiche bien — plomb (`annee_construction < 1949`), amiante (`annee_construction < 1997`, **proxy documenté** car la vraie règle porte sur la date du permis de construire, non capturée sur le formulaire), DPE défavorable (F/G), copropriété (rappel PV d'AG/charges/fonds travaux). `lib/checklist-rules.ts` génère une check-list groupée par catégories : un socle commun (état général, réseaux/diagnostics, sous-sol/cave/combles, zone à risque) toujours présent, puis une catégorie qui varie selon `copropriete` (copropriété vs bien individuel) et une autre selon le persona (investisseur → rendement/fiscalité, sinon → vie quotidienne). `app/biens/[id]/checklist/page.tsx` affiche alertes + check-list, accessible depuis un bouton sur la fiche bien. **Décision validée avec Victor** : ne pas ajouter de nouveaux champs au formulaire `/biens/nouveau` pour les règles gaz/élec vétuste, sous-sol et zone à risque (données rarement connues avant la visite) — ces règles apparaissent comme rappels fixes dans la check-list plutôt que comme alertes conditionnelles ; seule l'amiante bénéficie d'un proxy sur l'année de construction. Testé par script direct (11 assertions unitaires sur les règles) puis en conditions réelles sur la base Coolify : un bien 1930/DPE F/individuel affiche bien les 3 alertes attendues (plomb, amiante, DPE) et les catégories "Bien individuel"/"Vie quotidienne" ; un bien 2010/DPE B/copropriété (persona investisseur) n'affiche que l'alerte copropriété et les catégories "Copropriété"/"Rendement et fiscalité", sans fausse alerte plomb/amiante/DPE. `npm run build` vérifié sans erreur. Données de test nettoyées.
- ✅ **Étape 8 — Notes et photos de visite en mode hors-ligne** : toute interaction utilisateur écrit d'abord dans IndexedDB (`lib/offline-sync.ts`, librairie `idb`), jamais directement sur le réseau — l'UI ne dépend donc jamais de la connectivité. Nouvelle table `visite_observation` (coché/incertain/note par item de check-list) et colonnes `checklist_item_id`/`client_id` ajoutées à `bien_photo` (une photo de visite est une photo de bien comme une autre, Étape 6). `client_id` (UUID généré côté navigateur) sert de clé d'idempotence : deux routes API dédiées (`app/api/visite/observations/route.ts`, `app/api/visite/photos/route.ts` — pas de Server Actions, l'appel de sync part du code client bien après le rendu de la page) font un upsert `ON CONFLICT (client_id)`, jamais de doublon même en cas de retry. `app/biens/[id]/visite/page.tsx` + `visite-client.tsx` affichent alertes de vigilance et check-list (réutilisées telles quelles depuis l'Étape 7) avec case à cocher/note/marquage incertain/photo par item, bandeau de synchronisation (bouton manuel + déclenchement automatique sur l'événement `online` du navigateur — pas de Background Sync API, non supporté sur Safari/iOS). **Décisions validées avec Victor** : "dicter une note" = champ texte simple (le clavier mobile a déjà un micro natif, pas d'intégration Web Speech API, support trop inégal en PWA iOS). Testé à deux niveaux : (1) idempotence vérifiée directement sur les deux routes API (même `client_id` envoyé deux fois → une seule ligne en base à chaque fois, mise à jour avec les dernières valeurs) ; (2) test navigateur réel (Playwright) reproduisant le critère de fait — page ouverte en ligne, réseau coupé (`context.setOffline(true)`), case cochée + note + marquage incertain saisis hors-ligne (vérifiés présents dans IndexedDB avec `synced: false`, compteur "en attente" à jour dans l'UI), réseau rétabli, clic sur "Synchroniser maintenant" → toutes les observations arrivées correctement en base, compteur repassé à "Tout est synchronisé". `npm run build` vérifié sans erreur (nouvelles routes `/api/visite/*` et `/biens/[id]/visite` bien générées). Données de test nettoyées (DB + MinIO). Limite connue documentée : la page visite doit avoir été ouverte au moins une fois en ligne avant la coupure réseau, pour que Serwist en cache le HTML/RSC (comportement standard PWA, pas un bug).
- ✅ **Étape 9 — Mode projet partagé simple (persona couple/famille)** : nouvelle table `observation` (`db/schema.sql`) liée à un auteur nommé en texte libre (`auteur_nom`, ex. "Victor"/"Jess"), pas à un compte séparé — un seul dossier partagé, cohérent avec le hors-scope MVP (pas de votes individuels). `app/biens/[id]/observations/` : formulaire simple (prénom + texte, Server Action `ajouterObservation`, dernier prénom utilisé mémorisé en `localStorage` pour ne pas le ressaisir à chaque observation) et page listant les observations groupées par auteur, affichées en grille `grid-cols-2` — **écart au brouillon initial** : le layout global de l'app est volontairement contraint à `max-w-md` (usage mobile une main pendant une visite, décision de l'Étape 2), donc une grille `auto-fit`/`minmax` classique ne produit qu'une seule colonne dans ce conteneur étroit ; `grid-cols-2` fixe donne le rendu côte à côte réellement attendu pour le cas d'usage principal (2 personnes). Lien "Observations partagées" ajouté sur la fiche bien à côté des boutons existants. Testé en conditions réelles (Playwright) sur un bien de test persona couple : deux observations ("Victor" / "Jess") ajoutées via le vrai formulaire, vérifiées en base puis à l'écran (capture d'écran) — bien affichées dans deux colonnes distinctes, côte à côte. `npm run build` et `tsc --noEmit` vérifiés sans erreur. Données de test nettoyées.
- ⏭️ **Prochaine étape : Étape 10 — Score de préparation du dossier**.

**Note d'infrastructure (04/09/2026)** : la base Postgres self-hosted Coolify (conteneur `f8y0i4rujbfdgy0iq7u7twbm` sur le ProDesk, base `ttct`) n'est joignable depuis la machine de dev que via un tunnel SSH — le port 5432 local est déjà occupé par un Postgres natif Windows, donc le tunnel utilise le **port 5433** :
```
ssh -L 5433:10.0.1.7:5432 -N prodesk
```
`DATABASE_URL` dans `.env.local` pointe sur `127.0.0.1:5433`. **Ce tunnel doit être relancé manuellement à chaque reprise de session de dev** (il ne survit pas au redémarrage de la machine ni à la fermeture du terminal qui le porte) avant d'utiliser `npm run db:init` ou de tester un parcours qui touche la base. Si l'IP interne du conteneur (`10.0.1.7`) a changé, revérifier avec `ssh prodesk "docker inspect -f '{{.NetworkSettings.Networks.coolify.IPAddress}}' f8y0i4rujbfdgy0iq7u7twbm"`.

Même principe pour MinIO (conteneur `minio-pz9poe2gm5on5zidafiav0xu`, IP interne `10.0.2.2`) : le port local **9000** est libre (pas de service concurrent contrairement au 5432), donc le tunnel n'a pas besoin de décalage de port :
```
ssh -L 9000:10.0.2.2:9000 -N prodesk
```
`MINIO_ENDPOINT` dans `.env.local` pointe sur `http://127.0.0.1:9000`. **Ce tunnel doit lui aussi être relancé manuellement à chaque reprise de session de dev**, en plus (pas à la place) du tunnel Postgres — ce sont deux tunnels distincts à lancer dans deux terminaux séparés. Si l'IP interne du conteneur a changé, revérifier avec `ssh prodesk "docker inspect minio-pz9poe2gm5on5zidafiav0xu --format '{{json .NetworkSettings.Networks}}'"`. Bucket `trouve-ton-chez-toi` créé sur MinIO, exposé publiquement en lecture via `MINIO_PUBLIC_BASE_URL=https://img.jess-vic.ovh/trouve-ton-chez-toi` (`.env.local`) — **la policy publique du bucket reste à activer côté serveur avant de pouvoir vérifier qu'une photo uploadée s'affiche réellement depuis cette URL** (voir Étape 6).

---

## Contexte

Premier projet business de Victor (pas un projet vitrine portfolio comme les précédents) : "Trouve Ton Chez-Toi", un copilote d'achat immobilier français — carnet de visite intelligent qui accompagne l'utilisateur avant, pendant et après chaque visite de bien. Cadré à partir d'un brief produit et d'un tableau de fonctionnalités déjà rédigés par Victor (`ressources/Documents avant projet/App immobilier/`), complétés par une interview de cadrage (agent `chef-de-projet`).

- **Repo** : `VictorGrbz/trouve-ton-chez-toi` (à créer, public)
- **Dossier workspace** : `livrables/sites-web/trouve-ton-chez-toi/`
- **Déploiement** : self-hosted (Coolify + Cloudflare Tunnel, ProDesk), sous-domaine `chez-toi.jess-vic.ovh` — **temporaire**, migration vers un nom de domaine dédié prévue au moment du lancement public. Changement simple (Coolify + DNS), non bloquant pour la suite.
- **Stack validée** :
  - Next.js (App Router) + TypeScript + Tailwind CSS
  - PWA via **Serwist** (successeur maintenu de `next-pwa`, recommandé officiellement par Next.js) : service worker, mode hors-ligne, installation écran d'accueil
  - IndexedDB (via Serwist) pour les données de visite en attente de synchronisation
  - Caméra : API standard `getUserMedia`, pas de librairie
  - Persistance : PostgreSQL self-hosted (Coolify, ProDesk) — même solution que `demo-reservation-btp`, pas de Neon (décommissionné)
  - Stockage images : MinIO self-hosted (`img.jess-vic.ovh`)
  - Export PDF : **@react-pdf/renderer** (génération côté serveur depuis des composants React, pas de navigateur embarqué)
  - Mobile natif ultérieur : Capacitor si besoin App Store/Play Store, encapsulation du même code
  - **IA (hors MVP, phase 2+)** : un seul provider retenu pour tout développement IA à venir — **Gemini** (gratuit, quota limité). Claude ou GPT ne sont à considérer que si un besoin précis, déjà en production, montre une limite concrète de Gemini — pas d'intégration multi-provider anticipée pour une fonctionnalité qui n'est pas encore dans le MVP.
- **Contrainte impérative** : aucun code de production n'est écrit par la session racine (Jarvis). Seul l'Artisan, ouvert directement dans ce dossier, écrit le code.

**Jalon hébergement à trancher plus tard (pas maintenant)** : développement sur la stack self-hosted gratuite tant qu'il n'y a pas de vrai utilisateur externe. Dès le premier utilisateur externe confiant des données personnelles/financières réelles (RGPD, voir cadrage), le point de bascule vers un hébergement "pro" doit être déclenché en priorité par l'absence de stratégie de sauvegarde (risque actuellement accepté sur l'infra d'expérimentation), pas seulement par une question de budget disponible.

---

## Cadrage produit

### 1. Vision métier / problème résolu

**Nature du projet** : ni un usage personnel (Victor a déjà son bien), ni un projet portfolio — un **business à lancer**, avec l'ambition de générer un revenu réel si l'app perce sur le marché (complément de revenu, voire plus en cas de succès).

**Positionnement** : pas un simple calculateur de crédit, mais un copilote d'achat immobilier français — un carnet de visite intelligent qui accompagne l'utilisateur avant, pendant et après chaque visite de bien.

**Promesse en une phrase** : "Avant, pendant et après une visite : comprendre le vrai coût d'un bien, savoir quoi vérifier, conserver les éléments observés et préparer les bonnes questions."

**Cible du MVP** : élargie dès la première version à trois personas (contrairement au brief initial qui restreignait le MVP au primo-accédant seul) :
- Primo-accédant français achetant un bien ancien, anxieux face aux étapes administratives et techniques.
- Couples/familles décidant l'achat à plusieurs.
- Investisseurs locatifs débutants.

**Garde-fous produit permanents** (quel que soit le persona, jamais dans aucune version) :
- Pas d'estimation de valeur de marché présentée comme fiable.
- Pas de diagnostic technique ou médical du bien (humidité, électricité, structure).
- Pas de conseil juridique ou financier personnalisé engageant.
- Pas de scraping de sites tiers pour les données financières/marché.

### 2. Cas d'usage concrets

**Primo-accédant solo** : il crée son projet d'achat (zone, situation, revenus, apport, budget cible) et obtient une enveloppe budgétaire réaliste tenant compte des frais d'acquisition et d'une marge de sécurité. Il ajoute un bien repéré en ligne (saisie guidée ou collage du texte de l'annonce) et reçoit une check-list de visite générée automatiquement selon le profil du bien. Pendant la visite, il coche les points, prend des notes et des photos par pièce, marque les éléments incertains, sans connexion. Après la visite, il consulte les alertes de vigilance (plomb, amiante, DPE défavorable, copropriété...), compare le bien avec d'autres biens de son projet, et prend une décision personnelle (écarter / à revoir / négociation / offre).

**Couple/famille** : les deux membres renseignent ensemble le projet d'achat avec une situation combinée (deux revenus, apport commun, critères partagés). Ils visitent un bien ensemble, chacun peut consigner ses propres observations et points de vigilance pendant la visite. Après la visite, ils confrontent leurs impressions respectives sur la fiche du bien pour trancher à deux la décision finale.

**Investisseur locatif débutant** : il crée un projet de type "investissement locatif" avec des critères orientés rendement (zone, potentiel locatif). Il ajoute un bien et reçoit une check-list adaptée à l'investissement (état du bien, charges, copropriété, travaux à prévoir, fiscalité de base). Il compare plusieurs biens pour arbitrer selon le coût global, les charges et les risques ouverts, avant de se positionner.

### 3. Critères de succès mesurables

**Critère business (nord étoile)** : percer sur le marché et en tirer un revenu réel — complément de revenu dans un premier temps, potentiellement plus si l'app fonctionne bien.

**Critères fonctionnels concrets (MVP)** : un parcours complet fonctionnel de bout en bout sans aucun appel IA, disponible pour les trois personas — créer un projet d'achat → ajouter un bien → obtenir une check-list dynamique adaptée au profil → enregistrer notes/photos → voir les alertes de vigilance → comparer 2 à 5 biens → exporter un PDF récapitulatif.

**Métriques de suivi une fois lancé** : nombre de biens créés, check-lists complétées, comparaisons réalisées, utilité perçue des analyses IA (phase 2), et à terme des métriques business (utilisateurs actifs, taux de conversion vers l'offre premium, revenu généré).

### 4. Hors périmètre explicite

**Jamais** (garde-fous permanents, quelle que soit la phase) :
- Estimation de valeur de marché présentée comme fiable.
- Diagnostic technique ou médical du bien (humidité, électricité, structure).
- Conseil juridique ou financier personnalisé engageant.
- Scraping de sites tiers (annonces, courtiers, comparateurs) pour les données financières ou de marché.

**Hors MVP initial** (phase 2/3 de la roadmap, pas à traiter maintenant) :
- Toutes les fonctionnalités IA (analyse d'annonce, analyse de photos, synthèse de PV de copropriété, argumentaire de négociation, projection d'aménagement) — Gemini uniquement quand ce sera abordé.
- Espace collaboratif multi-comptes (votes séparés, désaccords visibles entre plusieurs acheteurs) — le persona couple/famille est couvert dès le MVP mais en mode projet partagé simple (un seul compte/dossier, voir Étape 9), pas de comptes synchronisés séparés avec votes individuels.
- Planification avancée (frise chronologique, rappels d'échéances légales).
- Simulateur de négociation.
- Comparaison location vs achat.

---

## Étape 0 — Initialisation du dépôt Git

**Objectif** : créer le dépôt Git dédié à ce projet avant tout code.
**Fichiers concernés** : ce `PLAN.md` (premier fichier du dépôt).
**Destination** : `livrables/sites-web/trouve-ton-chez-toi/` en local, `VictorGrbz/trouve-ton-chez-toi` sur GitHub.
**Critère de fait** : `git init` exécuté, `gh repo create VictorGrbz/trouve-ton-chez-toi --public --source=. --remote=origin --push` exécuté avec succès, commit initial poussé (ce `PLAN.md` suffit pour démarrer).

**Note d'exécution** : la commande `/commit` est installée globalement (`~/.claude/commands/`) — l'Artisan doit s'en servir pour tous les commits et push suivants. Lui seul gère désormais le cycle de vie Git de ce projet, le Jarvis racine n'y touche plus après cette étape.

---

## Étape 1 — Initialisation du projet

**Objectif** : scaffolder un projet Next.js (App Router) + TypeScript + Tailwind CSS avec le service worker Serwist configuré, et la connexion PostgreSQL self-hosted en place.
**Fichiers concernés** : `package.json`, `tsconfig.json`, `next.config.ts`, `app/layout.tsx`, `app/page.tsx`, `app/manifest.ts`, `app/sw.ts` (Serwist), `db/index.ts`, variable d'environnement `DATABASE_URL`.
**Destination** : `livrables/sites-web/trouve-ton-chez-toi/`.
**Critère de fait** : `npm run dev` démarre sans erreur, page d'accueil placeholder accessible en local, manifest PWA généré et service worker enregistré en build (`npm run build`).

---

## Étape 2 — Direction artistique (`/impeccable shape`)

**Objectif** : obtenir un brief de direction artistique confirmé, point de départ d'une maquette Claude Design.
**Fichiers concernés** : le prompt de Direction Artistique ci-dessous (rédigé et validé par Victor).
**Destination** : `/impeccable shape` côté Artisan.
**Critère de fait** : prompt validé par Victor (✅ fait, voir ci-dessous) → brief de direction confirmé produit par `/impeccable shape`.

### Prompt Direction Artistique (validé)

> **Contexte métier** : copilote d'achat immobilier français, carnet de visite intelligent (avant/pendant/après visite), pour primo-accédants anxieux, couples/familles et investisseurs locatifs débutants.
>
> **Public visé** : particuliers en cours d'achat, stressés par les démarches administratives/techniques, qui ont besoin d'être rassurés et guidés sans être infantilisés.
>
> **Émotion recherchée** : sérénité et maîtrise — l'app doit donner le sentiment de "j'ai le contrôle", pas générer plus d'anxiété. Éviter le registre "agence immobilière glossy" (photos de villas de luxe, doré/marbre) autant que le "formulaire administratif froid".
>
> **Contraintes fonctionnelles à habiller** : création de projet d'achat (formulaire progressif), fiche bien (budget/photos/notes/risques/score de préparation), check-list de visite cochée en mobilité, comparateur de biens, export PDF.
>
> **Contraintes techniques** : PWA installable, usage terrain à une main sur mobile pendant une visite (priorité lisibilité/gros éléments tactiles), Next.js + Tailwind.

**Workflow validé pour la suite de cette étape** :
1. L'Artisan lance `/impeccable shape` avec ce prompt comme point de départ → obtient un brief de direction confirmé (texte, pas de code, pas de maquette).
2. Victor soumet ce brief à Claude Design (claude.ai) pour générer une maquette haute-fidélité, itère jusqu'à validation visuelle, puis dépose l'image finale dans `.impeccable/mocks/external/`.
3. L'Artisan reprend la main avec cette image comme référence approuvée et construit dessus : Impeccable traite un mock approuvé par l'utilisateur comme un contrat visuel (reproduction quasi pixel-perfect), quelle que soit son origine.

**Note d'exécution pour l'Artisan** : `teach` se déclenche automatiquement en amont si `PRODUCT.md` n'existe pas encore (inutile de l'orchestrer séparément), mais ne capture aucun contenu esthétique — c'est `shape` qui porte la direction artistique. Sans clé `OPENAI_API_KEY` configurée, Impeccable ne génère aucune vraie image en interne (uniquement palette + texte) — c'est précisément pour ça que le brief part ensuite vers Claude Design plutôt que de compter sur la génération native d'Impeccable, gratuite via l'abonnement Pro déjà payé par Victor. La maquette de Claude Design est statique : pour toute animation ou interaction qu'elle ne capture pas (hover, scroll, micro-interactions), chercher une librairie prête à l'emploi plutôt que coder l'effet from scratch (GSAP, AOS, UIverse, Aceternity UI/Magic UI, DaisyUI/Flowbite), avec une recherche web ciblée si besoin d'un effet précis non couvert.

---

## Étape 3 — Profil d'achat et budget (3 personas)

**Objectif** : permettre à un utilisateur de créer son projet d'achat (saisie progressive, jamais un formulaire unique interminable) et d'obtenir une enveloppe budgétaire réaliste, quel que soit son persona.
**Fichiers concernés** : `app/projet/nouveau/page.tsx`, `lib/budget.ts`, `db/schema.sql` (table `projet_achat`).
**Destination** : route `/projet/nouveau`.
**Critère de fait** : un profil créé pour chacun des 3 personas (solo, couple avec revenus combinés, investisseur avec critères de rendement) produit une enveloppe budgétaire cohérente et persistée en base.

---

## Étape 4 — Moteur de simulation financière (sans IA)

**Objectif** : calculer frais d'acquisition, mensualité, coût des intérêts, capacité d'emprunt et taux d'effort, de façon déterministe (aucun appel IA).
**Fichiers concernés** : `lib/notaire.ts`, `config/bareme-notarial.json` (avec `date_debut`/`date_fin`, taux par tranche et par département), `lib/credit.ts`.
**Destination** : utilisé par la fiche projet (Étape 3) et la fiche bien (Étape 6).
**Critère de fait** : taux d'effort plafonné à 35 % assurance comprise, barème notarial vérifié sur [Service-Public.fr (R54267)](https://www.service-public.gouv.fr/particuliers/vosdroits/R54267) avant mise en production, simulation testée sur 2-3 cas connus.

**Note pour l'Artisan** : le barème notarial change par arrêté ministériel (1 à 2 ans), jamais d'automatisation/scraping pour cette donnée — mise à jour manuelle uniquement.

---

## Étape 5 — Suivi du taux de référence (API Banque de France Webstat)

**Objectif** : afficher un taux de crédit immobilier de référence toujours daté et sourcé, sans jamais scraper de courtiers.
**Fichiers concernés** : script de synchronisation périodique (cron mensuel côté Coolify), `db/schema.sql` (table `taux_reference` : valeur, date de publication).
**Destination** : utilisé dans le simulateur (Étape 4).
**Critère de fait** : le taux affiché provient de la table `taux_reference` avec sa date et sa source ("Banque de France, statistiques des nouveaux crédits à l'habitat, [mois]"), synchronisation testée manuellement au moins une fois. Champ optionnel "taux réellement proposé par votre banque" (saisie utilisateur) ne sert jamais de valeur par défaut.

**Note pour l'Artisan** : intégration d'API externe avec logique de synchronisation périodique — envisager un subagent Explore/Plan pour cadrer l'implémentation avant de coder.

---

## Étape 6 — Fiche bien : création et stockage

**Objectif** : permettre de créer une fiche bien (saisie guidée ou collage de texte d'annonce, stocké tel quel sans extraction IA au MVP) avec ses photos.
**Fichiers concernés** : `app/biens/nouveau/page.tsx`, `lib/minio.ts`, `db/schema.sql` (table `bien`).
**Destination** : route `/biens/nouveau`.
**Critère de fait** : un bien créé pour chacun des 3 personas avec au moins une photo uploadée et visible depuis `img.jess-vic.ovh`.

---

## Étape 7 — Check-list de visite dynamique et alertes de vigilance

**Objectif** : générer une check-list et des alertes selon des règles métier pures (aucune IA), adaptées au type de bien et au persona.
**Fichiers concernés** : `lib/checklist-rules.ts`, `lib/alertes-vigilance.ts`, `app/biens/[id]/checklist/page.tsx`.
**Destination** : page fiche bien.
**Critère de fait** : sur un bien de test construit avant 1949 avec DPE F, les alertes plomb + DPE apparaissent correctement ; la check-list diffère entre un bien en copropriété et un bien individuel, et entre le persona investisseur (rendement/fiscalité de base) et les autres.

**Règles à couvrir** (issues du brief) : construction avant 1949 (plomb/CREP), permis de construire avant juillet 1997 (amiante), installation gaz/électricité de plus de 15 ans, DPE défavorable, copropriété (3 derniers PV d'AG, charges, fonds travaux), sous-sol/cave/combles (humidité, ventilation, nuisibles), zone à risque (ERP, argiles, inondation, radon).

**Note pour l'Artisan** : volume de règles métier à cadrer proprement — envisager un subagent Plan pour structurer `checklist-rules.ts`/`alertes-vigilance.ts` avant l'implémentation.

---

## Étape 8 — Notes et photos de visite en mode hors-ligne

**Objectif** : permettre de cocher, dicter une note, prendre une photo et marquer un élément incertain pendant une visite, sans connexion, avec synchronisation différée.
**Fichiers concernés** : `lib/offline-sync.ts`, `app/biens/[id]/visite/page.tsx`, configuration IndexedDB via Serwist.
**Destination** : page visite (priorité mobile).
**Critère de fait** : en coupant le réseau (DevTools offline), une note/photo prise pendant la visite se synchronise correctement à la reconnexion, vérifié manuellement.

**Note pour l'Artisan** : l'offline n'est jamais automatique en PWA, l'architecture de synchronisation doit être conçue explicitement — envisager un subagent Plan pour cette étape avant de coder.

---

## Étape 9 — Mode projet partagé simple (persona couple/famille)

**Objectif** : permettre à deux personnes d'un même projet d'achat de consigner chacune ses observations sur une fiche bien, en mode simple (un seul compte/dossier partagé, pas de comptes séparés avec votes individuels — hors MVP).
**Fichiers concernés** : `db/schema.sql` (table `observation`, liée à un auteur nommé), `app/biens/[id]/observations/page.tsx`.
**Destination** : page fiche bien.
**Critère de fait** : deux observations distinctes (ex. "Victor" et "Jess") enregistrées sur la même fiche bien et affichées côte à côte.

---

## Étape 10 — Score de préparation du dossier

**Objectif** : mesurer la complétude du dossier (documents, check-list couverte, questions résolues) — jamais la qualité du bien lui-même.
**Fichiers concernés** : `lib/score-preparation.ts`.
**Destination** : affiché sur la fiche bien et le comparateur.
**Critère de fait** : le score évolue de façon cohérente quand la check-list se complète ou qu'une question ouverte se résout, testé sur un cas concret.

---

## Étape 11 — Comparateur de biens (2 à 5)

**Objectif** : comparer plusieurs biens du même projet d'achat côte à côte.
**Fichiers concernés** : `app/comparateur/page.tsx`.
**Destination** : route `/comparateur`.
**Critère de fait** : 3 biens de test comparés sans erreur d'affichage (coûts, surfaces, DPE, charges, travaux, risques ouverts).

---

## Étape 12 — Export PDF récapitulatif

**Objectif** : générer un export PDF personnel ou partageable d'une fiche bien ou d'une comparaison.
**Fichiers concernés** : `lib/pdf/fiche-bien.tsx`, `app/biens/[id]/export/route.ts`.
**Destination** : téléchargement depuis la fiche bien.
**Critère de fait** : un PDF généré et téléchargeable contient bien les données de la fiche (budget, check-list, photos, score).

---

## Étape 13 — Déploiement

**Objectif** : déployer l'application sur le serveur self-hosted et la rattacher au sous-domaine temporaire.
**Fichiers concernés** : configuration Coolify (variables d'environnement PostgreSQL/MinIO), DNS Cloudflare.
**Destination** : `https://chez-toi.jess-vic.ovh`.
**Critère de fait** : application accessible publiquement en HTTPS, parcours complet (créer projet → ajouter bien → check-list → notes/photos → comparateur → export PDF) vérifié en production pour les 3 personas.

---

## Finalisation

**Objectif** : rattraper les clichés génériques et vérifier la qualité avant toute expédition.
**Critère de fait** : `/finaliser` exécuté (audit → critique → validation → polish → doctor côté Impeccable) sans point bloquant restant.

---

## Vérification automatique

- [x] Configurer un hook `PostToolUse` dans `.claude/settings.json` du dossier `trouve-ton-chez-toi`, déclenché après `Edit`/`Write` sur les fichiers `*.ts`/`*.tsx`, qui lance `npx tsc --noEmit` (contrôle de types) — à mettre en place par l'Artisan avant de commencer l'étape 1, pour détecter les erreurs de type au fil de l'eau plutôt qu'en fin de build.

---

## Pour Victor

Ouvre une fenêtre VS Code dédiée sur `livrables/sites-web/trouve-ton-chez-toi/` pour lancer l'Artisan (Claude Code local) et exécuter ce PLAN.md étape par étape, en commençant par l'étape 0 (initialisation du dépôt Git), y compris la commande `/impeccable shape` de l'étape 2.
