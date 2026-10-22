// @ts-nocheck
import React, { useState } from "react";
import type { CustomFormField, CustomFieldType } from "@/lib/types-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Settings2,
  Check,
  Eye,
  Layers,
  Sparkles,
} from "lucide-react";
import { DynamicProductForm } from "@/components/DynamicProductForm";

const FIELD_TYPE_OPTIONS: { type: CustomFieldType; label: string; icon: string }[] = [
  { type: "text", label: "Texte court", icon: "Aa" },
  { type: "textarea", label: "Texte long (Zone de texte)", icon: "¶" },
  { type: "number", label: "Nombre numérique", icon: "#" },
  { type: "email", label: "Adresse e-mail", icon: "@" },
  { type: "phone", label: "Numéro de téléphone", icon: "📞" },
  { type: "url", label: "Lien / URL de site", icon: "🔗" },
  { type: "date", label: "Date (Calendrier)", icon: "📅" },
  { type: "time", label: "Heure", icon: "🕒" },
  { type: "select", label: "Liste déroulante (Menu)", icon: "▼" },
  { type: "radio", label: "Boutons radio (Choix unique)", icon: "🔘" },
  { type: "checkbox", label: "Case à cocher (Choix multiple)", icon: "☑" },
  { type: "multiselect", label: "Sélection multiple de tags", icon: "🏷" },
  { type: "file_image", label: "Téléversement Image (PNG, JPG)", icon: "🖼" },
  { type: "file_doc", label: "Téléversement Document (PDF, Word)", icon: "📄" },
  { type: "file_video", label: "Téléversement Vidéo (MP4, MOV)", icon: "🎬" },
  { type: "file_any", label: "Téléversement Fichier libre", icon: "📁" },
];

interface Props {
  fields: CustomFormField[];
  onChange: (fields: CustomFormField[]) => void;
  title?: string;
  description?: string;
}

export function AdminFormBuilder({
  fields,
  onChange,
  title = "Constructeur de Formulaire Dynamique",
  description = "Créez et configurez n'importe quel champ personnalisé sans écrire une ligne de code.",
}: Props) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewValues, setPreviewValues] = useState<Record<string, any>>({});

  // Add field
  const handleAddField = (type: CustomFieldType) => {
    const typeLabel = FIELD_TYPE_OPTIONS.find((t) => t.type === type)?.label || "Nouveau champ";
    const newField: CustomFormField = {
      id: `field-${Date.now()}-${Math.floor(Math.random() * 100)}`,
      label: typeLabel,
      type,
      required: true,
      placeholder: "",
      help_text: "",
      options:
        type === "select" || type === "radio" || type === "checkbox" || type === "multiselect"
          ? ["Option 1", "Option 2", "Option 3"]
          : undefined,
      order: fields.length,
    };
    onChange([...fields, newField]);
  };

  // Update field
  const handleUpdateField = (id: string, updates: Partial<CustomFormField>) => {
    const updated = fields.map((f) => (f.id === id ? { ...f, ...updates } : f));
    onChange(updated);
  };

  // Delete field
  const handleDeleteField = (id: string) => {
    onChange(fields.filter((f) => f.id !== id));
  };

  // Move up
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const copy = [...fields];
    const temp = copy[index - 1]!;
    copy[index - 1] = copy[index]!;
    copy[index] = temp;
    onChange(copy);
  };

  // Move down
  const handleMoveDown = (index: number) => {
    if (index === fields.length - 1) return;
    const copy = [...fields];
    const temp = copy[index + 1]!;
    copy[index + 1] = copy[index]!;
    copy[index] = temp;
    onChange(copy);
  };

  return (
    <div className="space-y-6 rounded-3xl border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b">
        <div>
          <h3 className="text-lg font-black text-foreground flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-amber-500" /> {title}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPreviewOpen(!previewOpen)}
            className="rounded-xl text-xs font-bold"
          >
            <Eye className="h-3.5 w-3.5 mr-1.5" />
            {previewOpen ? "Masquer Aperçu" : "Aperçu en Direct"}
          </Button>
          <span className="text-xs font-bold bg-amber-500/10 text-amber-600 px-3 py-1 rounded-full">
            {fields.length} {fields.length > 1 ? "champs" : "champ"}
          </span>
        </div>
      </div>

      {/* Quick Add Palette (Buttons for all 16 field types) */}
      <div className="space-y-2">
        <Label className="text-xs font-bold text-foreground">
          Ajouter un champ (Cliquez sur le type souhaité) :
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {FIELD_TYPE_OPTIONS.map((item) => (
            <button
              key={item.type}
              type="button"
              onClick={() => handleAddField(item.type)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border bg-background hover:bg-muted text-[11px] font-semibold text-foreground transition-all hover:scale-105 shadow-2xs"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
              <Plus className="h-3 w-3 text-amber-500 ml-0.5" />
            </button>
          ))}
        </div>
      </div>

      {/* Field Cards Editor */}
      {fields.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed p-8 text-center bg-muted/20">
          <Layers className="mx-auto h-10 w-10 text-muted-foreground/40 mb-2" />
          <p className="text-xs font-semibold text-muted-foreground">
            Aucun champ configuré. Cliquez sur l'un des boutons ci-dessus pour ajouter votre premier
            champ.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {fields.map((field, idx) => {
            const hasOptions =
              field.type === "select" ||
              field.type === "radio" ||
              field.type === "checkbox" ||
              field.type === "multiselect";

            return (
              <div
                key={field.id}
                className="rounded-2xl border bg-background p-4 shadow-2xs space-y-3 transition-all hover:border-amber-500/40"
              >
                {/* Field Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold bg-muted px-2 py-0.5 rounded-lg text-muted-foreground">
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-extrabold text-amber-600 bg-amber-500/10 px-2.5 py-0.5 rounded-lg">
                      {FIELD_TYPE_OPTIONS.find((t) => t.type === field.type)?.label || field.type}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveUp(idx)}
                      className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                      title="Monter"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === fields.length - 1}
                      onClick={() => handleMoveDown(idx)}
                      className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                      title="Descendre"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteField(field.id)}
                      className="p-1 text-destructive hover:bg-destructive/10 rounded-lg ml-1"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Field Properties Config */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold">
                      Libellé du champ (Question / Titre) *
                    </Label>
                    <Input
                      value={field.label}
                      onChange={(e) => handleUpdateField(field.id, { label: e.target.value })}
                      placeholder="Ex : Numéro WhatsApp, Taille, Email..."
                      className="rounded-xl text-xs h-9"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold">Texte indicatif (Placeholder)</Label>
                    <Input
                      value={field.placeholder || ""}
                      onChange={(e) => handleUpdateField(field.id, { placeholder: e.target.value })}
                      placeholder="Ex : Saisissez votre numéro..."
                      className="rounded-xl text-xs h-9"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 items-center">
                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-[11px] font-bold">
                      Description d'aide (Sous-titre explicatif)
                    </Label>
                    <Input
                      value={field.help_text || ""}
                      onChange={(e) => handleUpdateField(field.id, { help_text: e.target.value })}
                      placeholder="Ex : Indiquez le code pays (+509)..."
                      className="rounded-xl text-xs h-9"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-4">
                    <input
                      type="checkbox"
                      id={`req-${field.id}`}
                      checked={field.required}
                      onChange={(e) => handleUpdateField(field.id, { required: e.target.checked })}
                      className="h-4 w-4 rounded accent-amber-500"
                    />
                    <Label htmlFor={`req-${field.id}`} className="text-xs font-bold cursor-pointer">
                      Champ obligatoire *
                    </Label>
                  </div>
                </div>

                {/* Options Editor for select/radio/checkbox/multiselect */}
                {hasOptions && (
                  <div className="p-3 rounded-xl bg-muted/40 border space-y-2">
                    <Label className="text-[11px] font-bold text-foreground">
                      Options disponibles (Séparez chaque choix par une virgule) :
                    </Label>
                    <Input
                      value={field.options?.join(", ") || ""}
                      onChange={(e) => {
                        const splitted = e.target.value
                          .split(",")
                          .map((x) => x.trim())
                          .filter(Boolean);
                        handleUpdateField(field.id, { options: splitted });
                      }}
                      placeholder="Ex : Petite, Moyenne, Grande, Extra Large"
                      className="rounded-xl text-xs h-9 bg-background"
                    />
                    <div className="flex flex-wrap gap-1">
                      {field.options?.map((opt, oIdx) => (
                        <span
                          key={oIdx}
                          className="text-[10px] bg-background px-2 py-0.5 rounded-md border font-semibold"
                        >
                          {opt}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Live Preview Drawer / Accordion */}
      {previewOpen && (
        <div className="p-6 rounded-2xl bg-muted/30 border border-amber-500/40 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <h4 className="text-xs font-black uppercase text-foreground">
              Aperçu en Direct tel qu'affiché au Client
            </h4>
          </div>
          <DynamicProductForm
            fields={fields}
            values={previewValues}
            onChange={(fId, val) => setPreviewValues((prev) => ({ ...prev, [fId]: val }))}
          />
        </div>
      )}
    </div>
  );
}
