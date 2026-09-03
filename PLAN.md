# PLAN.md — trouve-ton-chez-toi

> Cadrage rédigé par Jarvis (session racine). Ce document est destiné à être exécuté par l'Artisan (Claude Code local, ouvert dans ce dossier). L'Artisan lit ce PLAN.md et exécute les étapes une par une, y compris les commandes Impeccable.

---

## État d'avancement (03/09/2026)

- ✅ **Étape 0 — Dépôt Git** : `VictorGrbz/trouve-ton-chez-toi` créé et poussé.
- ✅ **Étape 1 — Initialisation du projet** : scaffold Next.js (App Router, TS, Tailwind) + PWA Serwist + connexion PostgreSQL (`db/index.ts`) faits, build et dev vérifiés. Écart au plan initial : Next.js 16 active Turbopack par défaut, incompatible avec `@serwist/next` stable → scripts `dev`/`build` basculés sur `--webpack` dans `package.json`. Hook `tsc --noEmit` configuré dans `.claude/settings.json` (peut nécessiter d'ouvrir `/hooks` une fois pour s'activer si jamais il ne se déclenche pas).
- ✅ **Étape 2 — Direction artistique** : `PRODUCT.md` créé (via `/impeccable init`, à partir du brief existant + cadrage). Brief de direction confirmé via `/impeccable shape` (écran de référence : fiche bien). Mock validé par Claude Design déposé dans `.impeccable/mocks/external/Design Trouve Ton Chez Toi.png` — **référence visuelle approuvée du projet** : fond crème, bleu marine, accents ambre/or, layout en cartes. Logo existant dans `ressources/Documents avant projet/App immobilier/` confirmé **non contraignant** (placeholder à ignorer).
- ⏭️ **Prochaine étape : Étape 3 — Profil d'achat et budget**. Pas de mock dédié pour cet écran : doit hériter du système visuel établi par le mock de la fiche bien (Étape 2), pas relancer un choix de direction.

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

- [ ] Configurer un hook `PostToolUse` dans `.claude/settings.json` du dossier `trouve-ton-chez-toi`, déclenché après `Edit`/`Write` sur les fichiers `*.ts`/`*.tsx`, qui lance `npx tsc --noEmit` (contrôle de types) — à mettre en place par l'Artisan avant de commencer l'étape 1, pour détecter les erreurs de type au fil de l'eau plutôt qu'en fin de build.

---

## Pour Victor

Ouvre une fenêtre VS Code dédiée sur `livrables/sites-web/trouve-ton-chez-toi/` pour lancer l'Artisan (Claude Code local) et exécuter ce PLAN.md étape par étape, en commençant par l'étape 0 (initialisation du dépôt Git), y compris la commande `/impeccable shape` de l'étape 2.
