"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ajouterObservation, type AjouterObservationState } from "./actions";

const initialState: AjouterObservationState = { error: null };
const CLE_AUTEUR_LOCALSTORAGE = "trouve-ton-chez-toi:dernier-auteur-observation";

export function ObservationForm({ bienId }: { bienId: number }) {
  const [state, formAction, pending] = useActionState(ajouterObservation, initialState);
  const [auteurNom, setAuteurNom] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    try {
      const dernierAuteur = localStorage.getItem(CLE_AUTEUR_LOCALSTORAGE);
      if (dernierAuteur) setAuteurNom(dernierAuteur);
    } catch {
      // localStorage indisponible (navigation privée...) : pas grave, champ vide.
    }
  }, []);

  return (
    <Card>
      <form
        ref={formRef}
        action={(formData) => {
          try {
            localStorage.setItem(CLE_AUTEUR_LOCALSTORAGE, String(formData.get("auteurNom") ?? ""));
          } catch {
            // ignoré
          }
          formAction(formData);
        }}
        className="flex flex-col gap-3"
      >
        <input type="hidden" name="bienId" value={bienId} />
        <label className="flex flex-col gap-1 text-sm">
          Votre prénom
          <Input
            name="auteurNom"
            required
            value={auteurNom}
            onChange={(e) => setAuteurNom(e.target.value)}
            placeholder="Ex : Victor"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Votre observation
          <textarea
            name="texte"
            required
            rows={3}
            className="w-full rounded-card border border-border bg-surface px-4 py-2 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
            placeholder="Ce que vous avez remarqué pendant la visite..."
          />
        </label>
        {state.error && <p className="text-sm text-warn-foreground">{state.error}</p>}
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Ajout…" : "Ajouter mon observation"}
        </Button>
      </form>
    </Card>
  );
}
