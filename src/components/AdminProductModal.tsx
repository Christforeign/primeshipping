import { VideoUploadButton } from "@/components/VideoUploadButton";
// @ts-nocheck
import React, { useState } from "react";
import type { ProductItem, ProductVariant, CustomFormField, ProductKind } from "@/lib/types-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  X,
  Plus,
  Trash2,
  Image as ImageIcon,
  Layers,
  Sparkles,
  Save,
  Check,
  Film,
  DollarSign,
  Tag,
} from "lucide-react";
import { AdminFormBuilder } from "@/components/AdminFormBuilder";

interface Props {
  product: ProductItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (savedProduct: ProductItem) => void;
}

export function AdminProductModal({ product, isOpen, onClose, onSave }: Props) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<"general" | "variants" | "form" | "media">("general");

  // Form State
  const [title, setTitle] = useState(product?.title || "");
  const [shortDesc, setShortDesc] = useState(product?.short_description || "");
  const [description, setDescription] = useState(product?.description || "");
  const [category, setCategory] = useState(product?.category || "Services numériques");
  const [subcategory, setSubcategory] = useState(product?.subcategory || "");
  const [kind, setKind] = useState<ProductKind>(product?.kind || "numerique");
  const [priceUsd, setPriceUsd] = useState<number>(product?.price_usd ?? 0);
  const [promoPriceUsd, setPromoPriceUsd] = useState<string>(
    product?.promo_price_usd !== null && product?.promo_price_usd !== undefined
      ? String(product.promo_price_usd)
      : "",
  );
  const [applyTax, setApplyTax] = useState(product?.apply_tax ?? false);
  const [taxOverride, setTaxOverride] = useState<string>(
    product?.tax_rate_override !== null && product?.tax_rate_override !== undefined
      ? String(product.tax_rate_override)
      : "",
  );
  const [requiresShipping, setRequiresShipping] = useState(
    product?.requires_shipping_address ?? false,
  );
  const [isActive, setIsActive] = useState(product?.is_active ?? true);

  // Media
  const [mediaUrls, setMediaUrls] = useState<string[]>(
    product?.media_urls && product.media_urls.length > 0
      ? product.media_urls
      : [
          "https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=1000&q=80",
        ],
  );
  const [newMediaUrl, setNewMediaUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState(product?.video_url || "");

  // Variants
  const [variants, setVariants] = useState<ProductVariant[]>(product?.variants || []);

  // Custom Form Fields
  const [customFields, setCustomFields] = useState<CustomFormField[]>(product?.custom_fields || []);

  // Add Variant
  const handleAddVariant = () => {
    const newVariant: ProductVariant = {
      id: `var-${Date.now()}`,
      name: "Nouvelle formule / option",
      price_usd: priceUsd || 10,
      promo_price_usd: null,
      discount_percent: 0,
      stock: 100,
    };
    setVariants([...variants, newVariant]);
  };

  const handleUpdateVariant = (id: string, updates: Partial<ProductVariant>) => {
    setVariants(variants.map((v) => (v.id === id ? { ...v, ...updates } : v)));
  };

  const handleDeleteVariant = (id: string) => {
    setVariants(variants.filter((v) => v.id !== id));
  };

  // Add Media URL
  const handleAddMedia = () => {
    if (!newMediaUrl.trim()) return;
    setMediaUrls([...mediaUrls, newMediaUrl.trim()]);
    setNewMediaUrl("");
  };

  const handleDeleteMedia = (index: number) => {
    setMediaUrls(mediaUrls.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const saved: ProductItem = {
      id: product?.id || `prod-${Date.now()}`,
      title: title.trim(),
      short_description: shortDesc.trim() || undefined,
      description: description.trim(),
      category: category.trim(),
      subcategory: subcategory.trim() || undefined,
      kind,
      price_usd: Number(priceUsd) || 0,
      promo_price_usd: promoPriceUsd ? Number(promoPriceUsd) : null,
      apply_tax: applyTax,
      tax_rate_override: taxOverride ? Number(taxOverride) : null,
      media_urls: mediaUrls,
      video_url: videoUrl.trim() || null,
      variants,
      custom_fields: customFields,
      requires_shipping_address: requiresShipping,
      is_active: isActive,
      created_at: product?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    onSave(saved);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl max-h-[90vh] rounded-3xl bg-card border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-6 border-b flex items-center justify-between bg-muted/30">
          <div>
            <h2 className="text-xl font-black text-foreground">
              {product ? "Modifier le Produit / Service" : "Créer un Nouveau Produit ou Service"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Gérez les détails, les variantes de prix et le formulaire personnalisé dédié.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Tabs Bar */}
        <div className="flex border-b px-6 bg-background gap-2 overflow-x-auto">
          {[
            { id: "general", label: "Informations Générales" },
            { id: "variants", label: `Variantes (${variants.length})` },
            { id: "form", label: `Formulaire Dédié (${customFields.length})` },
            { id: "media", label: `Galerie Photos & Vidéo (${mediaUrls.length})` },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as any)}
              className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex-shrink-0 ${
                activeTab === t.id
                  ? "border-amber-500 text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: GENERAL INFO */}
          {activeTab === "general" && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Nom du Produit / Service *</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Recharge Diamants Free Fire, iPhone 15..."
                    required
                    className="rounded-xl text-xs h-10"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold">Type / Nature du produit *</Label>
                  <select
                    value={kind}
                    onChange={(e) => setKind(e.target.value as ProductKind)}
                    className="w-full rounded-xl border border-input bg-background p-2.5 text-xs font-semibold"
                  >
                    <option value="physique">
                      📦 Produit Physique (Nécessite livraison locale)
                    </option>
                    <option value="numerique">
                      ⚡ Produit Numérique (Code, Abonnement, Fichier)
                    </option>
                    <option value="service">
                      🛠 Prestation de Service (Création site, Logo, Consultation)
                    </option>
                    <option value="topup">💎 Top Up Direct (Jeux vidéo, Crédits ID joueur)</option>
                    <option value="sur_mesure">✨ Commande Personnalisée Sur-Mesure</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">Description Courte (Accroche)</Label>
                <Input
                  value={shortDesc}
                  onChange={(e) => setShortDesc(e.target.value)}
                  placeholder="Bref résumé affiché sous le titre..."
                  className="rounded-xl text-xs h-10"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">Description Complète & Spécifications *</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Détaillez le produit, ses caractéristiques, délais et garanties..."
                  rows={4}
                  required
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Catégorie Principale</Label>
                  <Input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Ex : Jeux & Top Up, High-Tech..."
                    className="rounded-xl text-xs h-10"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold">Sous-Catégorie (Optionnel)</Label>
                  <Input
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    placeholder="Ex : Free Fire, Apple, Streaming..."
                    className="rounded-xl text-xs h-10"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold">Prix de Base (USD) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={priceUsd}
                    onChange={(e) => setPriceUsd(parseFloat(e.target.value) || 0)}
                    required
                    className="rounded-xl text-xs h-10 font-bold"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Prix Promotionnel (USD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={promoPriceUsd}
                    onChange={(e) => setPromoPriceUsd(e.target.value)}
                    placeholder="Laissez vide si aucun rabais"
                    className="rounded-xl text-xs h-10"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold">Taxe Spécifique (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={taxOverride}
                    onChange={(e) => setTaxOverride(e.target.value)}
                    placeholder="Par défaut : taxe globale"
                    className="rounded-xl text-xs h-10"
                  />
                </div>

                <div className="flex flex-col gap-2 pt-4">
                  <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={applyTax}
                      onChange={(e) => setApplyTax(e.target.checked)}
                      className="rounded accent-amber-500"
                    />
                    Appliquer la taxe TVA
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requiresShipping}
                      onChange={(e) => setRequiresShipping(e.target.checked)}
                      className="rounded accent-amber-500"
                    />
                    Adresse de livraison physique requise
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded accent-amber-500"
                    />
                    Produit Actif (Visible en boutique)
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCT VARIANTS */}
          {activeTab === "variants" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-foreground">
                    Variantes et Formules de Prix
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Exemple : 110 Diamonds = 1 USD, 210 Diamonds = 2 USD, 530 Diamonds = 5 USD...
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddVariant}
                  className="rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter une variante
                </Button>
              </div>

              {variants.length === 0 ? (
                <div className="p-8 rounded-2xl border-2 border-dashed text-center bg-muted/20">
                  <p className="text-xs font-semibold text-muted-foreground">
                    Aucune variante pour ce produit. Le prix de base ({priceUsd}$ USD) s'appliquera.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {variants.map((v, idx) => (
                    <div
                      key={v.id}
                      className="p-4 rounded-2xl border bg-background flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex-1 grid gap-2 sm:grid-cols-4 w-full">
                        <div className="sm:col-span-2">
                          <Label className="text-[10px] font-bold text-muted-foreground">
                            Nom de la variante *
                          </Label>
                          <Input
                            value={v.name}
                            onChange={(e) => handleUpdateVariant(v.id, { name: e.target.value })}
                            placeholder="Ex : 530 Diamonds, 1 Mois HD..."
                            className="rounded-xl text-xs h-9"
                          />
                        </div>

                        <div>
                          <Label className="text-[10px] font-bold text-muted-foreground">
                            Prix (USD) *
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={v.price_usd}
                            onChange={(e) =>
                              handleUpdateVariant(v.id, {
                                price_usd: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="rounded-xl text-xs h-9 font-bold"
                          />
                        </div>

                        <div>
                          <Label className="text-[10px] font-bold text-muted-foreground">
                            Stock disponible
                          </Label>
                          <Input
                            type="number"
                            value={v.stock ?? ""}
                            onChange={(e) =>
                              handleUpdateVariant(v.id, {
                                stock: e.target.value ? parseInt(e.target.value) : null,
                              })
                            }
                            placeholder="Illimité"
                            className="rounded-xl text-xs h-9"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteVariant(v.id)}
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-xl self-end sm:self-center"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DEDICATED FORM BUILDER */}
          {activeTab === "form" && (
            <AdminFormBuilder
              fields={customFields}
              onChange={setCustomFields}
              title={`Formulaire Dédié : ${title || "Ce Produit"}`}
              description="Configurez les informations requises que le client doit obligatoirement ou facultativement remplir avant de commander cet article spécifique."
            />
          )}

          {/* TAB 4: MEDIA & VIDEO */}
          {activeTab === "media" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold">Ajouter une URL d'image à la galerie</Label>
                <div className="flex gap-2">
                  <Input
                    value={newMediaUrl}
                    onChange={(e) => setNewMediaUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/... ou lien photo hébergé"
                    className="rounded-xl text-xs h-10"
                  />
                  <Button
                    type="button"
                    onClick={handleAddMedia}
                    className="rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs px-4"
                  >
                    Ajouter
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-4">
                {mediaUrls.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative rounded-2xl border overflow-hidden aspect-video group"
                  >
                    <img
                      src={url}
                      alt={`Photo ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteMedia(idx)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 text-white hover:bg-red-600 transition-colors"
                      title="Supprimer la photo"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-4 border-t">
                <Label className="text-xs font-bold flex items-center gap-2">
                  <Film className="h-4 w-4 text-purple-500" /> Lien Vidéo (YouTube / MP4)
                </Label>
                <Input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="rounded-xl text-xs h-10 font-mono"
                />
                  <VideoUploadButton onUploaded={setVideoUrl} />
                  {videoUrl && <p className="text-[10px] text-muted-foreground">Vidéo enregistrée. Effacez le champ pour la retirer.</p>}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t flex items-center justify-between bg-muted/20">
          <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl text-xs">
            Annuler
          </Button>

          <Button
            type="button"
            onClick={handleSubmit}
            className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs px-6 shadow-md"
          >
            <Save className="h-4 w-4 mr-1.5" /> Enregistrer le Produit
          </Button>
        </div>
      </div>
    </div>
  );
}
