"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { creerProjetAchat, type CreerProjetResult } from "./actions";

type Persona = "solo" | "couple" | "investisseur";

const PERSONA_LABELS: Record<Persona, { label: string; description: string }> = {
  solo: {
    label: "Primo-accédant solo",
    description: "Vous achetez seul(e) votre premier bien.",
  },
  couple: {
    label: "Couple / famille",
    description: "Vous décidez l'achat à plusieurs, avec des revenus combinés.",
  },
  investisseur: {
    label: "Investisseur locatif",
    description: "Vous achetez pour louer, avec un objectif de rendement.",
  },
};

interface FormState {
  persona: Persona | null;
  nomProjet: string;
  zoneRecherche: string;
  apport: string;
  budgetCible: string;
  revenuMensuel1: string;
  situationPro1: string;
  revenuMensuel2: string;
  situationPro2: string;
  rendementLocatifVisePct: string;
}

const initialState: FormState = {
  persona: null,
  nomProjet: "",
  zoneRecherche: "",
  apport: "",
  budgetCible: "",
  revenuMensuel1: "",
  situationPro1: "",
  revenuMensuel2: "",
  situationPro2: "",
  rendementLocatifVisePct: "",
};

const formatMontant = (valeur: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(valeur);

export function ProjetWizard() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreerProjetResult | null>(null);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!form.persona) return;
    setSubmitting(true);
    setError(null);

    const toNumber = (value: string) =>
      value.trim() === "" ? undefined : Number(value);

    const res = await creerProjetAchat({
      persona: form.persona,
      nomProjet: form.nomProjet.trim() || undefined,
      zoneRecherche: form.zoneRecherche.trim(),
      revenuMensuel1: Number(form.revenuMensuel1),
      situationPro1: form.situationPro1.trim() || undefined,
      revenuMensuel2:
        form.persona === "couple" ? toNumber(form.revenuMensuel2) : undefined,
      situationPro2:
        form.persona === "couple" ? form.situationPro2.trim() || undefined : undefined,
      apport: Number(form.apport || 0),
      budgetCible: toNumber(form.budgetCible),
      rendementLocatifVisePct:
        form.persona === "investisseur"
          ? toNumber(form.rendementLocatifVisePct)
          : undefined,
    });

    setSubmitting(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setResult(res);
    setStep(4);
  };

  if (result?.ok) {
    return (
      <Card variant="accent">
        <Badge variant="status">Projet créé</Badge>
        <p className="mt-4 font-mono text-4xl tabular-nums font-semibold">
          {formatMontant(result.enveloppeBudgetMax)}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Enveloppe budgétaire indicative
        </p>
        <dl className="mt-6 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Frais d&apos;acquisition estimés</dt>
            <dd className="font-mono tabular-nums">
              {formatMontant(result.fraisAcquisitionEstimes)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Marge de sécurité</dt>
            <dd className="font-mono tabular-nums">
              {formatMontant(result.margeSecuriteMontant)}
            </dd>
          </div>
        </dl>
        <p className="mt-6 text-xs text-muted-foreground">
          Estimation indicative de première approche, pas un accord de prêt ni
          un conseil financier engageant.
          {form.persona === "investisseur" &&
            " Le rendement locatif visé n'est pas intégré à ce calcul à ce stade."}
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className={`h-1.5 flex-1 rounded-full ${
              n <= step ? "bg-primary" : "bg-surface-muted"
            }`}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Quel est votre profil ?</h2>
          {(Object.keys(PERSONA_LABELS) as Persona[]).map((persona) => (
            <button
              key={persona}
              type="button"
              onClick={() => {
                update("persona", persona);
                setStep(2);
              }}
              className="text-left"
            >
              <Card
                className={
                  form.persona === persona ? "border-primary" : undefined
                }
              >
                <p className="font-medium">{PERSONA_LABELS[persona].label}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {PERSONA_LABELS[persona].description}
                </p>
              </Card>
            </button>
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Votre projet</h2>
          <label className="flex flex-col gap-1 text-sm">
            Zone de recherche
            <Input
              value={form.zoneRecherche}
              onChange={(e) => update("zoneRecherche", e.target.value)}
              placeholder="Ex : Lille — Vauban"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Nom du projet (optionnel)
            <Input
              value={form.nomProjet}
              onChange={(e) => update("nomProjet", e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Apport disponible (€)
            <Input
              type="number"
              min="0"
              value={form.apport}
              onChange={(e) => update("apport", e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Budget cible (optionnel, €)
            <Input
              type="number"
              min="0"
              value={form.budgetCible}
              onChange={(e) => update("budgetCible", e.target.value)}
            />
          </label>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              Retour
            </Button>
            <Button
              disabled={!form.zoneRecherche.trim()}
              onClick={() => setStep(3)}
            >
              Continuer
            </Button>
          </div>
        </div>
      )}

      {step === 3 && form.persona && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Revenus</h2>
          <label className="flex flex-col gap-1 text-sm">
            Revenu mensuel {form.persona === "couple" ? "(personne 1)" : ""} (€)
            <Input
              type="number"
              min="0"
              value={form.revenuMensuel1}
              onChange={(e) => update("revenuMensuel1", e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Situation professionnelle (optionnel)
            <Input
              value={form.situationPro1}
              onChange={(e) => update("situationPro1", e.target.value)}
            />
          </label>

          {form.persona === "couple" && (
            <>
              <label className="flex flex-col gap-1 text-sm">
                Revenu mensuel (personne 2) (€)
                <Input
                  type="number"
                  min="0"
                  value={form.revenuMensuel2}
                  onChange={(e) => update("revenuMensuel2", e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Situation professionnelle personne 2 (optionnel)
                <Input
                  value={form.situationPro2}
                  onChange={(e) => update("situationPro2", e.target.value)}
                />
              </label>
            </>
          )}

          {form.persona === "investisseur" && (
            <label className="flex flex-col gap-1 text-sm">
              Rendement locatif visé (%, optionnel)
              <Input
                type="number"
                min="0"
                max="100"
                value={form.rendementLocatifVisePct}
                onChange={(e) => update("rendementLocatifVisePct", e.target.value)}
              />
              <span className="text-xs text-muted-foreground">
                Non intégré au calcul de l&apos;enveloppe à ce stade.
              </span>
            </label>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>
              Retour
            </Button>
            <Button
              disabled={!form.revenuMensuel1 || Number(form.revenuMensuel1) <= 0}
              onClick={() => setStep(4)}
            >
              Continuer
            </Button>
          </div>
        </div>
      )}

      {step === 4 && form.persona && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Récapitulatif</h2>
          <Card>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Profil</dt>
                <dd>{PERSONA_LABELS[form.persona].label}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Zone</dt>
                <dd>{form.zoneRecherche}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Apport</dt>
                <dd className="font-mono tabular-nums">
                  {formatMontant(Number(form.apport || 0))}
                </dd>
              </div>
            </dl>
          </Card>
          {error && (
            <p className="text-sm text-warn-foreground">{error}</p>
          )}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(3)}>
              Retour
            </Button>
            <Button disabled={submitting} onClick={handleSubmit}>
              {submitting ? "Création…" : "Créer mon projet"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
