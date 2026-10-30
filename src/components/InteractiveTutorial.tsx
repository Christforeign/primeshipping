// @ts-nocheck — legacy pages pending migration to real tables
import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  PackagePlus,
  Wallet,
  ShoppingBag,
  Search,
  CheckCircle2,
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Step {
  title: string;
  badge: string;
  description: string;
  icon: typeof PackagePlus;
  actionText?: string;
  actionHref?: string;
  tip?: string;
}

const STEPS: Step[] = [
  {
    title: "Bienvenue sur Prime Shipping",
    badge: "Étape 1 sur 5",
    description:
      "Votre plateforme intégrée pour recevoir vos achats depuis l'étranger (USA, Europe, Chine) et vous faire livrer partout en Haïti en toute sérénité.",
    icon: Sparkles,
    tip: "Créez votre compte client pour obtenir immédiatement votre adresse personnelle de réception aux États-Unis.",
  },
  {
    title: "Déclarer un colis facilement",
    badge: "Étape 2 sur 5",
    description:
      "Dès que vous commandez sur vos boutiques en ligne (Amazon, Shein, Temu, eBay), déclarez votre colis avec son numéro de suivi pour un traitement prioritaire à notre entrepôt.",
    icon: PackagePlus,
    actionText: "Enregistrer un colis",
    actionHref: "/compte/colis/nouveau",
    tip: "Indiquez toujours votre identifiant client PS-XXXX sur la 2ème ligne d'adresse lors de vos commandes.",
  },
  {
    title: "Boutique & Demande d'achat assistée",
    badge: "Étape 3 sur 5",
    description:
      "Vous n'avez pas de carte bancaire internationale ? Aucun problème ! Choisissez un article ou collez simplement les liens de vos produits. Notre équipe achète pour vous.",
    icon: ShoppingBag,
    actionText: "Visiter la Boutique",
    actionHref: "/boutique",
    tip: "Remplissez le formulaire type Take App / Google Forms avec vos tailles, couleurs et exigences.",
  },
  {
    title: "Mon Portefeuille (Wallet) & Paiement en tranches",
    badge: "Étape 4 sur 5",
    description:
      "Rechargez votre portefeuille par MonCash, Natcash ou virement bancaire. Payez les frais d'expédition de vos colis exclusivement par solde, en une fois ou par tranches selon votre convenance.",
    icon: Wallet,
    actionText: "Voir mon Portefeuille",
    actionHref: "/compte/portefeuille",
    tip: "Le règlement peut être complété progressivement avant le retrait en agence ou la livraison locale.",
  },
  {
    title: "Suivi en direct à chaque étape",
    badge: "Étape 5 sur 5",
    description:
      "Suivez votre colis en temps réel depuis son arrivée à Miami jusqu'à son débarquement en Haïti et sa mise à disposition au bureau de retrait ou à votre domicile.",
    icon: Search,
    actionText: "Suivre un colis",
    actionHref: "/suivi",
    tip: "Entrez votre code PS-XXXX pour consulter l'historique détaillé des événements de votre colis.",
  },
];

export function InteractiveTutorial() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if tutorial has been dismissed
    const hasSeen = localStorage.getItem("prime_tutorial_seen");
    if (!hasSeen) {
      // Delay slightly so the page renders first
      const timer = setTimeout(() => setIsOpen(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen to manual restart requests
  useEffect(() => {
    const handleStartTutorial = () => {
      setCurrentStep(0);
      setIsOpen(true);
    };
    window.addEventListener("prime:start-tutorial", handleStartTutorial);
    return () => window.removeEventListener("prime:start-tutorial", handleStartTutorial);
  }, []);

  const handleClose = (neverShowAgain = true) => {
    setIsOpen(false);
    if (neverShowAgain) {
      localStorage.setItem("prime_tutorial_seen", "true");
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((c) => c + 1);
    } else {
      handleClose(true);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((c) => c - 1);
    }
  };

  if (!isOpen) return null;

  const step = STEPS[currentStep]!;
  const Icon = step.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-3xl bg-card border shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-200">
        {/* Progress bar */}
        <div className="flex items-center gap-1.5 mb-6">
          {STEPS.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${
                idx === currentStep ? "bg-primary" : idx < currentStep ? "bg-accent" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Close Button */}
        <button
          onClick={() => handleClose(true)}
          className="absolute top-5 right-5 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Fermer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header Icon & Badge */}
        <div className="flex items-center gap-3 mb-4">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-forest text-accent shadow-soft">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              {step.badge}
            </span>
            <h2 className="text-xl font-bold text-forest leading-snug">{step.title}</h2>
          </div>
        </div>

        {/* Content */}
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-4">
          {step.description}
        </p>

        {/* Tip box */}
        {step.tip && (
          <div className="rounded-xl bg-secondary/80 border border-primary/20 p-3.5 mb-6 text-xs text-secondary-foreground flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <p>
              <strong>Astuce :</strong> {step.tip}
            </p>
          </div>
        )}

        {/* Footer controls */}
        <div className="sticky bottom-0 -mx-6 sm:-mx-8 px-6 sm:px-8 pb-1 bg-card flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t">
          <button
            onClick={() => handleClose(true)}
            className="text-xs text-muted-foreground hover:text-foreground underline sm:order-1 order-3"
          >
            Passer le tutoriel
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto sm:order-2 order-2 justify-end">
            {currentStep > 0 && (
              <Button variant="outline" size="sm" onClick={handlePrev}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Précédent
              </Button>
            )}
            <Button size="sm" className="flex-1 sm:flex-none" onClick={handleNext}>
              {currentStep < STEPS.length - 1 ? (
                <>
                  Suivant <ChevronRight className="h-4 w-4 ml-1" />
                </>
              ) : (
                "Terminer et commencer"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function triggerTutorial() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("prime:start-tutorial"));
  }
}
