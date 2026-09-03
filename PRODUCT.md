# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Trois personas couverts dès le MVP :

- **Primo-accédant solo** : achète un bien ancien en France, anxieux face aux étapes administratives et techniques. A besoin d'être rassuré et guidé sans être infantilisé.
- **Couple/famille** : décide l'achat à plusieurs, renseigne un projet à deux (revenus combinés, apport commun, critères partagés), visite ensemble et consigne des observations individuelles sur la même fiche bien avant de trancher à deux.
- **Investisseur locatif débutant** : projet orienté rendement (zone, potentiel locatif), check-list adaptée (charges, copropriété, fiscalité de base), arbitrage entre plusieurs biens sur le coût global et les risques.

## Product Purpose

Carnet de visite intelligent qui accompagne l'utilisateur avant, pendant et après chaque visite de bien immobilier. Promesse : "Avant, pendant et après une visite : comprendre le vrai coût d'un bien, savoir quoi vérifier, conserver les éléments observés et préparer les bonnes questions."

Succès fonctionnel (MVP) : parcours complet sans aucun appel IA — créer un projet d'achat → ajouter un bien → check-list dynamique adaptée au profil → notes/photos → alertes de vigilance → comparer 2 à 5 biens → export PDF. Succès business : générer un revenu réel (complément de revenu, potentiellement plus).

## Positioning

Pas un simple calculateur de crédit ni un portail d'annonces : un copilote d'achat immobilier français centré sur la fiche bien comme espace de décision (budget, documents, photos, notes, risques, score de préparation, décision personnelle). L'IA n'est jamais le moteur central du MVP — tout le cœur du produit fonctionne par des règles métier déterministes, sans dépendance à un appel IA.

## Operating Context

- Utilisation terrain pendant une visite physique de bien, souvent à une main, en mobilité, parfois sans connexion réseau (cave, zone mal couverte).
- Avant la visite : consultation de la check-list générée et du profil du bien depuis chez soi ou en déplacement.
- Après la visite : relecture calme des observations, comparaison entre biens, décision.
- Usage répété sur plusieurs biens en parallèle dans un même projet d'achat (2 à 5 biens comparés).

## Capabilities and Constraints

**Garde-fous produit permanents (aucune phase, jamais)** :
- Pas d'estimation de valeur de marché présentée comme fiable.
- Pas de diagnostic technique ou médical du bien (humidité, électricité, structure).
- Pas de conseil juridique ou financier personnalisé engageant.
- Pas de scraping de sites tiers (annonces, courtiers, comparateurs) pour les données financières ou de marché — les seules données chiffrées externes proviennent d'une API officielle (Banque de France Webstat pour les taux) ou d'une mise à jour manuelle versionnée (barème notarial, changement par arrêté ministériel).

**Hors MVP** (phase 2+, non traité pour l'instant) : toutes les fonctionnalités IA (analyse d'annonce, analyse de photos, synthèse de PV de copropriété, argumentaire de négociation, projection d'aménagement) ; espace collaboratif multi-comptes avec votes séparés (le MVP couvre le persona couple/famille en mode projet partagé simple, un seul compte/dossier) ; planification avancée (frise chronologique, rappels d'échéances légales) ; simulateur de négociation ; comparaison location vs achat.

**Contraintes techniques confirmées** (déjà en place dans le code) : Next.js App Router + TypeScript + Tailwind CSS, PWA installable via Serwist (service worker, mode hors-ligne, IndexedDB), caméra via `getUserMedia` standard, PostgreSQL self-hosted, stockage images MinIO self-hosted, export PDF via `@react-pdf/renderer` (génération serveur), déploiement self-hosted (Coolify + Cloudflare Tunnel) sur un sous-domaine temporaire. IA phase 2+ : Gemini uniquement par défaut.

**RGPD** : consentement explicite avant tout envoi de photo/document à un modèle IA externe (phase 2+), droit de suppression d'un bien et de ses données, conservation courte et documentée.

## Brand Commitments

Nom du produit verrouillé : **Trouve Ton Chez-Toi**.

Un logo existant (maison bleu marine + toit orange + loupe/coche) se trouve dans `ressources/Documents avant projet/App immobilier/` (workspace racine). Confirmé par l'utilisateur : c'est un placeholder, **non contraignant** — la direction artistique peut l'ignorer et repartir de zéro sur les couleurs, le style et l'iconographie.

## Evidence on Hand

- Brief produit complet : `ressources/Documents avant projet/App immobilier/brief_projet_copilote_achat_immobilier.md` (workspace racine) — vision, parcours utilisateur, règles de vigilance détaillées, architecture, RGPD, modèle économique, roadmap en 3 phases.
- Tableau récapitulatif des fonctionnalités (statut MVP/phase 2/phase 3, IA nécessaire ou non, gratuit/payant) : `ressources/Documents avant projet/App immobilier/tableau_recap_fonctionnalites.md`.
- Cadrage produit validé (interview `chef-de-projet`) : voir `PLAN.md` à la racine de ce projet, section "Cadrage produit" — c'est la version la plus à jour (élargit le MVP du brief initial, restreint à un seul persona, aux trois personas actuels).
- Aucune maquette visuelle, palette ou typographie n'existe encore ; le logo trouvé n'est pas une référence de marque à respecter (voir Brand Commitments).

## Product Principles

1. Sérénité et maîtrise plutôt qu'anxiété : l'app doit donner le sentiment "j'ai le contrôle", jamais en rajouter sur le stress déjà présent chez l'utilisateur en cours d'achat.
2. Jamais de conseil engageant : le produit informe et structure, il ne diagnostique, n'estime ni ne conseille juridiquement/financièrement de façon personnalisée.
3. Utile sans IA dès le MVP : tout le cœur fonctionnel (budget, check-list, alertes, comparateur, export) doit rester pleinement opérationnel sans aucun appel IA.
4. Hors-ligne pensé dès la conception : le mode terrain pendant une visite (notes, photos, coches) doit fonctionner sans connexion et se synchroniser ensuite, jamais un ajout après-coup.
5. Trois personas dès le MVP, un seul produit : primo-accédant, couple/famille et investisseur locatif partagent la même mécanique (fiche bien, check-list, comparateur) adaptée par des règles selon le profil, pas des parcours cloisonnés.

## Accessibility & Inclusion

Usage terrain à une main sur mobile pendant une visite : priorité à la lisibilité et aux éléments tactiles larges. Utilisateurs potentiellement stressés/pressés pendant la visite — l'interface ne doit pas ajouter de charge cognitive dans ce contexte précis.
