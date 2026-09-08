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
