import React, { useState } from "react";
import { Upload, FileCheck, X, Image as ImageIcon, AlertCircle } from "lucide-react";
import type { CustomFieldDefinition } from "@/types/product-fields";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface DynamicFormRendererProps {
  fields: CustomFieldDefinition[];
  values: Record<string, string>;
  onChange: (fieldId: string, value: string) => void;
  errors?: Record<string, string>;
}

export function DynamicFormRenderer({
  fields,
  values,
  onChange,
  errors = {},
}: DynamicFormRendererProps) {
  const [filePreviews, setFilePreviews] = useState<
    Record<string, { name: string; url: string; isImg: boolean }>
  >({});

  const handleFileUpload = (fieldId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFilePreviews((prev) => ({
        ...prev,
        [fieldId]: { name: file.name, url: result, isImg: isImage },
      }));
      onChange(fieldId, result);
    };
    reader.readAsDataURL(file);
  };

  const removeFile = (fieldId: string) => {
    setFilePreviews((prev) => {
      const copy = { ...prev };
      delete copy[fieldId];
      return copy;
    });
    onChange(fieldId, "");
  };

  if (!fields || fields.length === 0) return null;

  return (
    <div className="space-y-5">
      {fields.map((f) => {
        const val = values[f.id] ?? "";
        const error = errors[f.id];
        const preview = filePreviews[f.id];

        return (
          <div key={f.id} className="space-y-1.5">
            <Label
              htmlFor={f.id}
              className="text-xs sm:text-sm font-bold flex items-center justify-between text-foreground"
            >
              <span>
                {f.label}
                {f.required ? (
                  <span className="text-destructive ml-1.5">*</span>
                ) : (
                  <span className="text-muted-foreground text-xs font-normal ml-1.5">
                    (facultatif)
                  </span>
                )}
              </span>
              {f.unit && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                  Unité : {f.unit}
                </span>
              )}
            </Label>

            {f.description && <p className="text-xs text-muted-foreground">{f.description}</p>}

            {/* TEXT */}
            {f.type === "text" && (
              <Input
                id={f.id}
                value={val}
                placeholder={f.placeholder || `Saisir ${f.label.toLowerCase()}`}
                onChange={(e) => onChange(f.id, e.target.value)}
                required={f.required}
                className="rounded-xl text-sm"
              />
            )}

            {/* TEXTAREA */}
            {f.type === "textarea" && (
              <Textarea
                id={f.id}
                value={val}
                placeholder={f.placeholder || `Précisez ${f.label.toLowerCase()}...`}
                onChange={(e) => onChange(f.id, e.target.value)}
                required={f.required}
                rows={3}
                className="rounded-xl text-sm resize-none"
              />
            )}

            {/* NUMBER */}
            {f.type === "number" && (
              <div className="relative">
                <Input
                  id={f.id}
                  type="number"
                  min={f.min ?? undefined}
                  max={f.max ?? undefined}
                  step={f.step ?? 1}
                  value={val}
                  placeholder={f.placeholder || "0"}
                  onChange={(e) => onChange(f.id, e.target.value)}
                  required={f.required}
                  className="rounded-xl text-sm pr-12 font-mono"
                />
                {f.unit && (
                  <span className="absolute right-3 top-2.5 text-xs font-semibold text-muted-foreground pointer-events-none">
                    {f.unit}
                  </span>
                )}
              </div>
            )}

            {/* SELECT */}
            {f.type === "select" && (
              <select
                id={f.id}
                value={val}
                onChange={(e) => onChange(f.id, e.target.value)}
                required={f.required}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">-- Choisir une option --</option>
                {f.options?.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            )}

            {/* RADIO */}
            {f.type === "radio" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {f.options?.map((opt) => {
                  const isChecked = val === opt;
                  return (
                    <label
                      key={opt}
                      className={`flex items-center gap-2.5 p-3 rounded-2xl border cursor-pointer text-xs sm:text-sm font-medium transition-all ${
                        isChecked
                          ? "border-[#ea580c] bg-orange-500/10 text-[#ea580c] shadow-xs font-bold"
                          : "border-border hover:border-orange-500/40 text-foreground"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`dynamic_${f.id}`}
                        value={opt}
                        checked={isChecked}
                        onChange={() => onChange(f.id, opt)}
                        required={f.required && !val}
                        className="text-[#ea580c] focus:ring-[#ea580c] h-4 w-4"
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {/* FILE UPLOAD (VRAI TELEVERSEMENT AVEC PREVISUALISATION) */}
            {f.type === "file_upload" && (
              <div className="pt-1">
                {val ? (
                  <div className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 text-xs">
                    <div className="flex items-center gap-3 truncate">
                      {preview?.isImg ? (
                        <img
                          src={preview.url}
                          alt="Aperçu"
                          className="h-12 w-12 rounded-lg object-cover border"
                        />
                      ) : (
                        <FileCheck className="h-6 w-6 text-emerald-600 flex-shrink-0" />
                      )}
                      <div className="truncate">
                        <span className="font-bold text-foreground block truncate">
                          {preview?.name || "Fichier joint avec succès"}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-semibold">
                          Prêt pour la commande
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(f.id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-muted transition-colors"
                      title="Supprimer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-2 border-dashed border-border hover:border-[#ea580c]/60 bg-card hover:bg-muted/40 cursor-pointer text-center transition-all">
                    <div className="p-3 rounded-full bg-orange-500/10 text-[#ea580c]">
                      <Upload className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-foreground block">
                        Téléversez une image ou capture d'écran
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        JPG, PNG, WebP ou PDF (jusqu'à 15 Mo)
                      </span>
                    </div>
                    <input
                      id={f.id}
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleFileUpload(f.id, e)}
                      required={f.required}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            )}

            {error && (
              <div className="flex items-center gap-1 text-xs text-destructive pt-0.5">
                <AlertCircle className="h-3 w-3" />
                <span>{error}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
