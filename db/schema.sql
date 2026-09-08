-- Étape 3 — Profil d'achat et budget (3 personas)
CREATE TABLE IF NOT EXISTS projet_achat (
  id                          bigserial PRIMARY KEY,
  persona                     text NOT NULL CHECK (persona IN ('solo', 'couple', 'investisseur')),
  nom_projet                  text,
  zone_recherche              text NOT NULL,

  -- Revenus / apport (l'apport est déjà "commun" pour le couple : un seul champ)
  revenu_mensuel_1            numeric(10,2) NOT NULL CHECK (revenu_mensuel_1 >= 0),
  situation_pro_1             text,
  revenu_mensuel_2            numeric(10,2) CHECK (revenu_mensuel_2 IS NULL OR revenu_mensuel_2 >= 0),
  situation_pro_2             text,
  apport                      numeric(12,2) NOT NULL DEFAULT 0 CHECK (apport >= 0),
  budget_cible                numeric(12,2),

  -- Spécifique investisseur (informatif, non utilisé dans le calcul d'enveloppe à ce stade)
  rendement_locatif_vise_pct  numeric(5,2),

  -- Résultat du calcul d'enveloppe (premier niveau, cf. lib/budget.ts)
  enveloppe_budget_max        numeric(12,2) NOT NULL,
  frais_acquisition_estimes   numeric(12,2) NOT NULL,
  marge_securite_montant      numeric(12,2) NOT NULL,
  hypotheses_calcul           jsonb NOT NULL,

  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now(),

  CHECK (persona = 'couple' OR (revenu_mensuel_2 IS NULL AND situation_pro_2 IS NULL)),
  CHECK (persona = 'investisseur' OR rendement_locatif_vise_pct IS NULL)
);

CREATE INDEX IF NOT EXISTS idx_projet_achat_persona ON projet_achat(persona);

-- Étape 4 — Traçabilité des résultats du moteur de simulation (lib/notaire.ts + lib/credit.ts)
ALTER TABLE projet_achat
  ADD COLUMN IF NOT EXISTS mensualite_indicative         numeric(10,2),
  ADD COLUMN IF NOT EXISTS capacite_emprunt_indicative   numeric(12,2),
  ADD COLUMN IF NOT EXISTS cout_total_interets_indicatif numeric(12,2),
  ADD COLUMN IF NOT EXISTS taux_effort_effectif_pct      numeric(5,2);

-- Étape 5 — Taux de référence Banque de France (nouveaux crédits à l'habitat)
-- Synchronisé par db/sync-taux-reference.mjs (cron mensuel côté Coolify).
CREATE TABLE IF NOT EXISTS taux_reference (
  id              bigserial PRIMARY KEY,
  mois_reference  text NOT NULL UNIQUE CHECK (mois_reference ~ '^\d{4}-\d{2}$'),
  valeur_pct      numeric(5,2) NOT NULL CHECK (valeur_pct >= 0),
  source_url      text NOT NULL,
  synced_at       timestamptz NOT NULL DEFAULT now()
);

-- Champ informatif saisi par l'utilisateur, jamais utilisé comme valeur par
-- défaut ou dans le calcul (voir lib/budget.ts) — repère personnel uniquement.
ALTER TABLE projet_achat
  ADD COLUMN IF NOT EXISTS taux_banque_propose_pct numeric(5,2);

-- Étape 6 — Fiche bien : création et stockage
-- Saisie guidée ET/OU texte d'annonce collé tel quel (aucune extraction IA au MVP).
CREATE TABLE IF NOT EXISTS bien (
  id                    bigserial PRIMARY KEY,
  projet_achat_id       bigint NOT NULL REFERENCES projet_achat(id) ON DELETE CASCADE,

  titre                 text NOT NULL,
  adresse               text,
  lien_annonce          text,
  texte_annonce_colle   text,

  prix_affiche          numeric(12,2) CHECK (prix_affiche IS NULL OR prix_affiche >= 0),
  surface_m2            numeric(6,2) CHECK (surface_m2 IS NULL OR surface_m2 >= 0),
  nb_pieces             integer CHECK (nb_pieces IS NULL OR nb_pieces >= 0),
  type_bien             text CHECK (type_bien IS NULL OR type_bien IN ('appartement', 'maison')),
  annee_construction    integer,
  dpe                   text CHECK (dpe IS NULL OR dpe IN ('A', 'B', 'C', 'D', 'E', 'F', 'G')),
  copropriete           boolean,
  notes                 text,

  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bien_projet_achat ON bien(projet_achat_id);

-- Photos stockées sur MinIO self-hosted (lib/minio.ts), jamais en base.
CREATE TABLE IF NOT EXISTS bien_photo (
  id          bigserial PRIMARY KEY,
  bien_id     bigint NOT NULL REFERENCES bien(id) ON DELETE CASCADE,
  object_key  text NOT NULL,
  url         text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bien_photo_bien ON bien_photo(bien_id);
