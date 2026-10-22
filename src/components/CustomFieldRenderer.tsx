// @ts-nocheck
import { useState } from "react";
import { Upload, FileCheck, X } from "lucide-react";
import type { CustomFormField } from "@/lib/types-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CustomFieldRendererProps {
  fields: CustomFormField[];
  values: Record<string, string>;
  onChange: (fieldIdOrLabel: string, value: string) => void;
}

export function CustomFieldRenderer({ fields, values, onChange }: CustomFieldRendererProps) {
  const [fileNames, setFileNames] = useState<Record<string, string>>({});

  const handleFileUpload = (fieldKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileNames((prev) => ({ ...prev, [fieldKey]: file.name }));

    // Read as Base64 data URL
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onChange(fieldKey, reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeFile = (fieldKey: string) => {
    setFileNames((prev) => {
      const copy = { ...prev };
      delete copy[fieldKey];
      return copy;
    });
    onChange(fieldKey, "");
  };

  if (!fields || fields.length === 0) return null;

  return (
    <div className="space-y-4">
      {fields.map((f) => {
        const key = f.id || f.label;
        const val = values[key] ?? "";

        return (
          <div key={key} className="space-y-1.5">
            <Label className="text-xs sm:text-sm font-semibold flex items-center justify-between">
              <span>
                {f.label}
                {f.required ? (
                  <span className="text-destructive ml-1">*</span>
                ) : (
                  <span className="text-muted-foreground text-xs font-normal ml-1">
                    (facultatif)
                  </span>
                )}
              </span>
            </Label>

            {f.type === "text" && (
              <Input
                value={val}
                placeholder={f.placeholder || `Entrez ${f.label.toLowerCase()}`}
                onChange={(e) => onChange(key, e.target.value)}
                required={f.required}
                className="text-sm"
              />
            )}

            {f.type === "textarea" && (
              <Textarea
                value={val}
                placeholder={f.placeholder || `Détails pour ${f.label.toLowerCase()}...`}
                onChange={(e) => onChange(key, e.target.value)}
                required={f.required}
                rows={3}
                className="text-sm resize-none"
              />
            )}

            {f.type === "select" && (
              <select
                value={val}
                onChange={(e) => onChange(key, e.target.value)}
                required={f.required}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">-- Sélectionnez une option --</option>
                {f.options?.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            )}

            {f.type === "radio" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {f.options?.map((opt) => {
                  const isChecked = val === opt;
                  return (
                    <label
                      key={opt}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer text-xs sm:text-sm font-medium transition-all ${
                        isChecked
                          ? "border-primary bg-primary/5 text-primary shadow-xs"
                          : "border-border hover:border-primary/50 text-foreground"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`custom_${key}`}
                        value={opt}
                        checked={isChecked}
                        onChange={() => onChange(key, opt)}
                        required={f.required && !val}
                        className="text-primary focus:ring-primary h-4 w-4"
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {f.type === "file" && (
              <div className="pt-1">
                {val ? (
                  <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-primary/30 bg-primary/5 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <FileCheck className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="truncate font-medium">
                        {fileNames[key] || "Fichier joint avec succès"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(key)}
                      className="p-1 text-muted-foreground hover:text-destructive rounded transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-card hover:bg-muted/50 cursor-pointer text-center transition-all">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs font-semibold text-foreground">
                      Cliquez pour joindre une photo ou document
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      PNG, JPG, PDF jusqu'à 10 Mo
                    </span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleFileUpload(key, e)}
                      required={f.required}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
