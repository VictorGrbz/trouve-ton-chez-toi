"use client";

import { useActionState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { creerBien, type CreerBienState } from "./actions";

interface Projet {
  id: string;
  label: string;
}

const initialState: CreerBienState = { error: null };

export function BienForm({ projets }: { projets: Projet[] }) {
  const [state, formAction, pending] = useActionState(creerBien, initialState);

  if (projets.length === 0) {
    return (
      <Card>
        <p className="text-sm text-muted-foreground">
          Aucun projet d&apos;achat existant. Créez d&apos;abord un projet
          avant d&apos;ajouter une fiche bien.
        </p>
      </Card>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Projet d&apos;achat associé
        <Select name="projetAchatId" required defaultValue={projets[0].id}>
          {projets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </Select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Titre du bien
        <Input name="titre" required placeholder="Ex : T3 rue de la Paix" />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Adresse (optionnel)
        <Input name="adresse" />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Lien de l&apos;annonce (optionnel)
        <Input name="lienAnnonce" type="url" />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Prix affiché (€, optionnel)
          <Input name="prixAffiche" type="number" min="0" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Surface (m², optionnel)
          <Input name="surfaceM2" type="number" min="0" step="0.1" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Nombre de pièces (optionnel)
          <Input name="nbPieces" type="number" min="0" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Année de construction (optionnel)
          <Input name="anneeConstruction" type="number" min="1700" max="2100" />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Type de bien (optionnel)
        <Select name="typeBien" defaultValue="">
          <option value=""> </option>
          <option value="appartement">Appartement</option>
          <option value="maison">Maison</option>
        </Select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        DPE (optionnel)
        <Select name="dpe" defaultValue="">
          <option value=""> </option>
          {["A", "B", "C", "D", "E", "F", "G"].map((lettre) => (
            <option key={lettre} value={lettre}>
              {lettre}
            </option>
          ))}
        </Select>
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="copropriete" className="h-4 w-4" />
        Bien en copropriété
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Texte de l&apos;annonce collé (optionnel)
        <textarea
          name="texteAnnonceColle"
          rows={5}
          className="w-full rounded-card border border-border bg-surface px-4 py-2 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
          placeholder="Collez ici le texte de l'annonce, tel quel."
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Notes libres (optionnel)
        <textarea
          name="notes"
          rows={3}
          className="w-full rounded-card border border-border bg-surface px-4 py-2 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Photos (optionnel)
        <Input name="photos" type="file" accept="image/*" multiple />
      </label>

      {state.error && <p className="text-sm text-warn-foreground">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Création…" : "Créer la fiche bien"}
      </Button>
    </form>
  );
}
