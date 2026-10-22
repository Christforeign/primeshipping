import React, { useRef } from "react";
import type { CustomFormField } from "@/lib/types-store";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Upload,
  Image as ImageIcon,
  FileText,
  Video,
  File,
  Check,
  Calendar,
  Clock,
  Link as LinkIcon,
  Phone,
  Mail,
  Hash,
} from "lucide-react";

interface Props {
  fields: CustomFormField[];
  values: Record<string, any>;
  onChange: (fieldId: string, value: any) => void;
  errors?: Record<string, string>;
}

export function DynamicProductForm({ fields, values, onChange, errors = {} }: Props) {
  if (!fields || fields.length === 0) return null;

  return (
    <div className="space-y-5">
      {fields.map((field) => {
        const value = values[field.id] ?? "";
        const error = errors[field.id];

        return (
          <div key={field.id} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label
                htmlFor={field.id}
                className="text-xs font-bold text-foreground flex items-center gap-1.5"
              >
                <span>{field.label}</span>
                {field.required ? (
                  <span className="text-destructive font-black">*</span>
                ) : (
                  <span className="text-[10px] font-normal text-muted-foreground">(Optionnel)</span>
                )}
              </Label>
            </div>

            {field.help_text && (
              <p className="text-[11px] text-muted-foreground leading-relaxed">{field.help_text}</p>
            )}

            {/* FIELD TYPE: Short Text */}
            {field.type === "text" && (
              <Input
                id={field.id}
                value={value}
                onChange={(e) => onChange(field.id, e.target.value)}
                placeholder={field.placeholder || "Saisissez votre réponse..."}
                required={field.required}
                className="rounded-xl h-10 text-xs"
              />
            )}

            {/* FIELD TYPE: Textarea */}
            {field.type === "textarea" && (
              <Textarea
                id={field.id}
                value={value}
                onChange={(e) => onChange(field.id, e.target.value)}
                placeholder={field.placeholder || "Détaillez vos instructions ici..."}
                rows={3}
                required={field.required}
                className="rounded-xl text-xs"
              />
            )}

            {/* FIELD TYPE: Number */}
            {field.type === "number" && (
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id={field.id}
                  type="number"
                  value={value}
                  onChange={(e) => onChange(field.id, e.target.value)}
                  placeholder={field.placeholder || "0"}
                  required={field.required}
                  className="pl-9 rounded-xl h-10 text-xs"
                />
              </div>
            )}

            {/* FIELD TYPE: Email */}
            {field.type === "email" && (
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id={field.id}
                  type="email"
                  value={value}
                  onChange={(e) => onChange(field.id, e.target.value)}
                  placeholder={field.placeholder || "exemple@email.com"}
                  required={field.required}
                  className="pl-9 rounded-xl h-10 text-xs"
                />
              </div>
            )}

            {/* FIELD TYPE: Phone */}
            {field.type === "phone" && (
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id={field.id}
                  type="tel"
                  value={value}
                  onChange={(e) => onChange(field.id, e.target.value)}
                  placeholder={field.placeholder || "+509 3700-0000"}
                  required={field.required}
                  className="pl-9 rounded-xl h-10 text-xs font-mono"
                />
              </div>
            )}

            {/* FIELD TYPE: URL */}
            {field.type === "url" && (
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id={field.id}
                  type="url"
                  value={value}
                  onChange={(e) => onChange(field.id, e.target.value)}
                  placeholder={field.placeholder || "https://..."}
                  required={field.required}
                  className="pl-9 rounded-xl h-10 text-xs font-mono"
                />
              </div>
            )}

            {/* FIELD TYPE: Date */}
            {field.type === "date" && (
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id={field.id}
                  type="date"
                  value={value}
                  onChange={(e) => onChange(field.id, e.target.value)}
                  required={field.required}
                  className="pl-9 rounded-xl h-10 text-xs"
                />
              </div>
            )}

            {/* FIELD TYPE: Time */}
            {field.type === "time" && (
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id={field.id}
                  type="time"
                  value={value}
                  onChange={(e) => onChange(field.id, e.target.value)}
                  required={field.required}
                  className="pl-9 rounded-xl h-10 text-xs"
                />
              </div>
            )}

            {/* FIELD TYPE: Select Dropdown */}
            {field.type === "select" && (
              <select
                id={field.id}
                value={value}
                onChange={(e) => onChange(field.id, e.target.value)}
                required={field.required}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">{field.placeholder || "-- Sélectionnez une option --"}</option>
                {field.options?.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            )}

            {/* FIELD TYPE: Radio Buttons */}
            {field.type === "radio" && (
              <div className="grid gap-2 sm:grid-cols-2">
                {field.options?.map((opt) => {
                  const isChecked = value === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => onChange(field.id, opt)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-left text-xs transition-all ${
                        isChecked
                          ? "border-amber-500 bg-amber-500/10 font-bold text-foreground shadow-sm"
                          : "border-border hover:bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      <div
                        className={`h-4 w-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                          isChecked ? "border-amber-500 bg-amber-500" : "border-slate-400"
                        }`}
                      >
                        {isChecked && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </div>
                      <span className="truncate">{opt}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* FIELD TYPE: Checkbox */}
            {field.type === "checkbox" && (
              <div className="space-y-2">
                {field.options && field.options.length > 0 ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {field.options.map((opt) => {
                      const selectedList: string[] = Array.isArray(value) ? value : [];
                      const isSelected = selectedList.includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              onChange(
                                field.id,
                                selectedList.filter((x) => x !== opt),
                              );
                            } else {
                              onChange(field.id, [...selectedList, opt]);
                            }
                          }}
                          className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left text-xs transition-all ${
                            isSelected
                              ? "border-amber-500 bg-amber-500/10 font-bold text-foreground"
                              : "border-border hover:bg-muted/50 text-muted-foreground"
                          }`}
                        >
                          <div
                            className={`h-4 w-4 rounded-md border flex items-center justify-center flex-shrink-0 ${
                              isSelected
                                ? "border-amber-500 bg-amber-500 text-white"
                                : "border-slate-400"
                            }`}
                          >
                            {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onChange(field.id, !value)}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border text-xs"
                  >
                    <div
                      className={`h-4 w-4 rounded-md border flex items-center justify-center ${
                        value ? "border-amber-500 bg-amber-500 text-white" : "border-slate-400"
                      }`}
                    >
                      {value && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                    <span>{field.placeholder || "Confirmer cette option"}</span>
                  </button>
                )}
              </div>
            )}

            {/* FIELD TYPE: Multiselect */}
            {field.type === "multiselect" && (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5 p-2 rounded-xl border bg-background min-h-[42px]">
                  {field.options?.map((opt) => {
                    const selectedList: string[] = Array.isArray(value) ? value : [];
                    const isSelected = selectedList.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            onChange(
                              field.id,
                              selectedList.filter((x) => x !== opt),
                            );
                          } else {
                            onChange(field.id, [...selectedList, opt]);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                          isSelected
                            ? "bg-amber-500 text-slate-950 shadow-sm"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {opt} {isSelected && "✓"}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* FIELD TYPES: File Upload (Image, Document, Video, Any) */}
            {(field.type === "file_image" ||
              field.type === "file_doc" ||
              field.type === "file_video" ||
              field.type === "file_any") && (
              <FileUploadField
                field={field}
                value={value}
                onChange={(val) => onChange(field.id, val)}
              />
            )}

            {error && <p className="text-xs text-destructive font-medium">{error}</p>}
          </div>
        );
      })}
    </div>
  );
}

function FileUploadField({
  field,
  value,
  onChange,
}: {
  field: CustomFormField;
  value: string;
  onChange: (val: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const accept =
    field.type === "file_image"
      ? "image/*"
      : field.type === "file_video"
        ? "video/*"
        : field.type === "file_doc"
          ? ".pdf,.doc,.docx,.xls,.xlsx,.txt"
          : "*/*";

  const icon =
    field.type === "file_image" ? (
      <ImageIcon className="h-5 w-5 text-amber-500" />
    ) : field.type === "file_video" ? (
      <Video className="h-5 w-5 text-purple-500" />
    ) : field.type === "file_doc" ? (
      <FileText className="h-5 w-5 text-blue-500" />
    ) : (
      <File className="h-5 w-5 text-emerald-500" />
    );

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      onChange(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="rounded-2xl border-2 border-dashed border-border p-4 bg-secondary/30 transition-all hover:bg-secondary/50">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFile}
        className="hidden"
        id={`upload-${field.id}`}
      />

      {value ? (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {field.type === "file_image" && (
              <img
                src={value}
                alt="Aperçu téléversé"
                className="h-12 w-12 rounded-xl object-cover border"
              />
            )}
            <div className="truncate">
              <span className="text-xs font-bold text-foreground block truncate">
                Fichier prêt à être envoyé
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                <Check className="h-3 w-3" /> Téléversement validé
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs font-bold text-destructive hover:underline px-2 py-1"
          >
            Changer
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full flex flex-col items-center justify-center gap-1.5 py-3 text-center cursor-pointer"
        >
          <div className="p-2.5 rounded-full bg-background shadow-sm border">{icon}</div>
          <span className="text-xs font-bold text-foreground">
            Cliquez pour téléverser votre fichier
          </span>
          <span className="text-[10px] text-muted-foreground">
            {field.type === "file_image"
              ? "Formats acceptés : PNG, JPG, WEBP (Max 15 Mo)"
              : field.type === "file_video"
                ? "Formats acceptés : MP4, MOV (Max 50 Mo)"
                : field.type === "file_doc"
                  ? "Formats acceptés : PDF, Word, Excel"
                  : "Tout format de fichier"}
          </span>
        </button>
      )}
    </div>
  );
}
