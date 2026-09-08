import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const formatMontant = (valeur: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(valeur);

interface BienRow {
  id: string;
  titre: string;
  adresse: string | null;
  lien_annonce: string | null;
  texte_annonce_colle: string | null;
  prix_affiche: string | null;
  surface_m2: string | null;
  nb_pieces: number | null;
  type_bien: string | null;
  annee_construction: number | null;
  dpe: string | null;
  copropriete: boolean;
  notes: string | null;
  nom_projet: string | null;
  zone_recherche: string;
}

interface PhotoRow {
  id: string;
  url: string;
}

export default async function FicheBienPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bienId = Number(id);
  if (!Number.isInteger(bienId) || bienId <= 0) {
    notFound();
  }

  const { rows } = await db.query<BienRow>(
    `SELECT b.id, b.titre, b.adresse, b.lien_annonce, b.texte_annonce_colle,
            b.prix_affiche, b.surface_m2, b.nb_pieces, b.type_bien,
            b.annee_construction, b.dpe, b.copropriete, b.notes,
            p.nom_projet, p.zone_recherche
     FROM bien b
     JOIN projet_achat p ON p.id = b.projet_achat_id
     WHERE b.id = $1`,
    [bienId],
  );
  const bien = rows[0];
  if (!bien) {
    notFound();
  }

  const { rows: photos } = await db.query<PhotoRow>(
    `SELECT id, url FROM bien_photo WHERE bien_id = $1 ORDER BY created_at`,
    [bienId],
  );

  return (
    <div className="flex flex-1 flex-col px-6 py-8">
      <p className="text-sm text-muted-foreground">
        {bien.nom_projet?.trim() || bien.zone_recherche}
      </p>
      <h1 className="text-2xl font-semibold tracking-tight">{bien.titre}</h1>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Link href={`/biens/${bien.id}/checklist`}>
          <Button variant="outline" className="w-full sm:w-auto">
            Voir la check-list de visite
          </Button>
        </Link>
        <Link href={`/biens/${bien.id}/visite`}>
          <Button className="w-full sm:w-auto">Démarrer la visite</Button>
        </Link>
      </div>

      <Card className="mt-6">
        <dl className="space-y-2 text-sm">
          {bien.adresse && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Adresse</dt>
              <dd>{bien.adresse}</dd>
            </div>
          )}
          {bien.prix_affiche && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Prix affiché</dt>
              <dd className="font-mono tabular-nums">
                {formatMontant(Number(bien.prix_affiche))}
              </dd>
            </div>
          )}
          {bien.surface_m2 && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Surface</dt>
              <dd>{bien.surface_m2} m²</dd>
            </div>
          )}
          {bien.nb_pieces != null && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Pièces</dt>
              <dd>{bien.nb_pieces}</dd>
            </div>
          )}
          {bien.type_bien && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Type</dt>
              <dd className="capitalize">{bien.type_bien}</dd>
            </div>
          )}
          {bien.annee_construction && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Année de construction</dt>
              <dd>{bien.annee_construction}</dd>
            </div>
          )}
          {bien.dpe && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">DPE</dt>
              <dd>
                <Badge variant="neutral">{bien.dpe}</Badge>
              </dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Copropriété</dt>
            <dd>{bien.copropriete ? "Oui" : "Non"}</dd>
          </div>
          {bien.lien_annonce && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Annonce</dt>
              <dd>
                <a
                  href={bien.lien_annonce}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Voir le lien
                </a>
              </dd>
            </div>
          )}
        </dl>
      </Card>

      {bien.texte_annonce_colle && (
        <Card className="mt-4">
          <p className="text-sm font-medium">Texte de l&apos;annonce</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
            {bien.texte_annonce_colle}
          </p>
        </Card>
      )}

      {bien.notes && (
        <Card className="mt-4">
          <p className="text-sm font-medium">Notes</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
            {bien.notes}
          </p>
        </Card>
      )}

      {photos.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium">Photos</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {photos.map((photo) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={photo.id}
                src={photo.url}
                alt={bien.titre}
                className="aspect-square w-full rounded-card border border-border object-cover"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
