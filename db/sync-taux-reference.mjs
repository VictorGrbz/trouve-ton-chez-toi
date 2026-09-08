// Synchronise le taux de référence des nouveaux crédits à l'habitat depuis
// la page mensuelle officielle de la Banque de France (source primaire, pas
// un site tiers/courtier — voir garde-fous produit dans PLAN.md).
//
// Aucune clé API : l'API Webstat SDMX nécessite une inscription développeur
// (developer.webstat.banque-france.fr) qui n'a pas été mise en place pour ce
// MVP. À la place, on lit la phrase officielle standard publiée chaque mois
// sur banque-france.fr/fr/statistiques/credit/credits-aux-particuliers-AAAA-MM,
// stable d'un mois sur l'autre (vérifié sur juin et juillet 2026).
//
// Destiné à être exécuté par un cron mensuel côté Coolify (Scheduled Task) :
//   node --env-file=.env.local db/sync-taux-reference.mjs
// (npm run sync:taux-reference en local). Voir PLAN.md pour la configuration
// Coolify (manuelle, hors dépôt).

import pg from "pg";

const MOIS_FR = {
  janvier: 1,
  février: 2,
  mars: 3,
  avril: 4,
  mai: 5,
  juin: 6,
  juillet: 7,
  août: 8,
  septembre: 9,
  octobre: 10,
  novembre: 11,
  décembre: 12,
};

// La publication a ~2 mois de retard sur le mois de référence (ex: juillet
// 2026 publié début septembre 2026) ; on recule tant qu'aucune page valide
// n'est trouvée, avec une limite de sécurité.
const MAX_MOIS_EN_ARRIERE = 6;
const USER_AGENT = "Mozilla/5.0 (compatible; TrouveTonChezToiSync/1.0)";

const RE_TAUX =
  /taux d.int[ée]r[êe]t des nouveaux cr[ée]dits [àa] l.habitat \(hors r[ée]n[ée]gociations\) aux m[ée]nages s.[ée]l[èe]ve [àa] (\d+,\d+)\s?% en (\p{L}+) (\d{4})/iu;

function construireUrl(annee, mois) {
  return `https://www.banque-france.fr/fr/statistiques/credit/credits-aux-particuliers-${annee}-${String(mois).padStart(2, "0")}`;
}

function extraireTexte(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&#0?39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");
}

function extraireTaux(html) {
  const texte = extraireTexte(html);
  const match = texte.match(RE_TAUX);
  if (!match) return null;
  const [, valeurTexte, moisNom, anneeTexte] = match;
  const mois = MOIS_FR[moisNom.toLowerCase()];
  if (!mois) return null;
  return {
    valeurPct: Number(valeurTexte.replace(",", ".")),
    annee: Number(anneeTexte),
    mois,
  };
}

async function trouverDernierTauxPublie() {
  const maintenant = new Date();
  let annee = maintenant.getUTCFullYear();
  let mois = maintenant.getUTCMonth() + 1;

  for (let i = 0; i < MAX_MOIS_EN_ARRIERE; i++) {
    const url = construireUrl(annee, mois);
    try {
      const reponse = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
      if (reponse.ok) {
        const html = await reponse.text();
        const resultat = extraireTaux(html);
        if (resultat) {
          return { ...resultat, sourceUrl: url };
        }
      }
    } catch (err) {
      console.warn(`[sync-taux-reference] Échec de récupération de ${url} :`, err.message);
    }

    mois -= 1;
    if (mois === 0) {
      mois = 12;
      annee -= 1;
    }
  }
  return null;
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
  const resultat = await trouverDernierTauxPublie();
  if (!resultat) {
    throw new Error(
      `Aucune page mensuelle exploitable trouvée sur les ${MAX_MOIS_EN_ARRIERE} derniers mois (source : banque-france.fr/fr/statistiques/credit/credits-aux-particuliers-AAAA-MM). Vérifier manuellement si le format de la page a changé.`,
    );
  }

  const moisReference = `${resultat.annee}-${String(resultat.mois).padStart(2, "0")}`;

  await pool.query(
    `INSERT INTO taux_reference (mois_reference, valeur_pct, source_url)
     VALUES ($1, $2, $3)
     ON CONFLICT (mois_reference)
     DO UPDATE SET valeur_pct = EXCLUDED.valeur_pct, source_url = EXCLUDED.source_url, synced_at = now()`,
    [moisReference, resultat.valeurPct, resultat.sourceUrl],
  );

  console.log(
    `Taux de référence synchronisé : ${resultat.valeurPct}% (${moisReference}), source ${resultat.sourceUrl}`,
  );
} finally {
  await pool.end();
}
