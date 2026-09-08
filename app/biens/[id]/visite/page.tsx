import { notFound } from "next/navigation";
import { db } from "@/db";
import { genererAlertesVigilance } from "@/lib/alertes-vigilance";
import { genererChecklistVisite, type Persona } from "@/lib/checklist-rules";
import { VisiteClient } from "./visite-client";

interface BienRow {
  id: string;
  titre: string;
  annee_construction: number | null;
  dpe: string | null;
  copropriete: boolean;
  persona: Persona;
}

interface ObservationRow {
  checklist_item_id: string;
  coche: boolean;
  incertain: boolean;
  note: string | null;
}

interface PhotoRow {
  id: string;
  url: string;
  checklist_item_id: string | null;
}

export default async function VisiteBienPage({
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
    `SELECT b.id, b.titre, b.annee_construction, b.dpe, b.copropriete, p.persona
     FROM bien b
     JOIN projet_achat p ON p.id = b.projet_achat_id
     WHERE b.id = $1`,
    [bienId],
  );
  const bien = rows[0];
  if (!bien) {
    notFound();
  }

  const [{ rows: observations }, { rows: photos }] = await Promise.all([
    db.query<ObservationRow>(
      `SELECT checklist_item_id, coche, incertain, note FROM visite_observation WHERE bien_id = $1`,
      [bienId],
    ),
    db.query<PhotoRow>(
      `SELECT id, url, checklist_item_id FROM bien_photo WHERE bien_id = $1 AND checklist_item_id IS NOT NULL`,
      [bienId],
    ),
  ]);

  const alertes = genererAlertesVigilance({
    anneeConstruction: bien.annee_construction,
    dpe: bien.dpe,
    copropriete: bien.copropriete,
  });
  const categories = genererChecklistVisite({ copropriete: bien.copropriete }, bien.persona);

  return (
    <VisiteClient
      bienId={bienId}
      titre={bien.titre}
      alertes={alertes}
      categories={categories}
      observationsServeur={observations.map((o) => ({
        checklistItemId: o.checklist_item_id,
        coche: o.coche,
        incertain: o.incertain,
        note: o.note ?? "",
      }))}
      photosServeur={photos.map((p) => ({
        id: p.id,
        url: p.url,
        checklistItemId: p.checklist_item_id,
      }))}
    />
  );
}
