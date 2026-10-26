import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Toaster } from "@/components/ui/sonner";
import { PromoBanner } from "@/components/PromoBanner";
import { LiveSupportWidget } from "@/components/LiveSupportWidget";
import { WhatsAppSupportButton } from "@/components/WhatsAppSupportButton";
import { InteractiveTutorial } from "@/components/InteractiveTutorial";
import { useSettings } from "@/lib/settings";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page introuvable</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Cette page n'existe pas ou a été déplacée.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Cette page n'a pas pu s'afficher
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Un petit souci est survenu. Réessayez ou revenez à l'accueil.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Réessayer
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Retour à l'accueil
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Prime Express Shipping — Fret, Colis & Achats vers Haïti" },
      {
        name: "description",
        content:
          "Expédition internationale de colis Miami vers Haïti avec Prime Express Shipping, boutique en ligne et achats assistés.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png?v=2" },
      { rel: "apple-touch-icon", href: "/icon-192.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Manrope:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const goReset = () => {
      if (window.location.pathname !== "/reset-password") {
        router.navigate({ to: "/reset-password" });
      }
    };
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) goReset();
    if (hash.includes("error_code=otp_expired") || hash.includes("error=access_denied")) {
      window.history.replaceState(null, "", window.location.pathname);
      import("sonner").then(({ toast }) =>
        toast.error("Ce lien a expiré ou a déjà été utilisé. Demandez un nouveau lien."),
      );
      router.navigate({ to: "/auth" });
    }
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        goReset();
        return;
      }
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => data.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <AppShellContent />
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}

function AppShellContent() {
  const s = useSettings();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isCheckout = ["/boutique/commande", "/boutique/panier"].includes(pathname.replace(/\/$/, ""));

  // Dynamic background style
  const getBackgroundStyle = () => {
    if (!s) return undefined;
    if (s.bg_type === "solid" && s.bg_value) return { backgroundColor: s.bg_value };
    if (s.bg_type === "gradient" && s.bg_value) return { background: s.bg_value };
    if (s.bg_type === "texture" && s.bg_value)
      return { backgroundImage: `url(${s.bg_value})`, backgroundRepeat: "repeat" };
    return undefined;
  };

  if (isCheckout) {
    return (
      <div className="flex min-h-dvh w-full flex-col bg-background text-foreground">
        <header className="border-b bg-background">
          <div className="mx-auto flex h-20 max-w-3xl items-center justify-between px-4">
            <Link to="/boutique" aria-label="Prime Store">
              <img src="/logos/prime-store-logo.svg" alt="Prime Store" className="h-16 w-auto object-contain" />
            </Link>
            <Button asChild variant="ghost" size="icon" aria-label="Fermer le checkout">
              <Link to="/boutique"><X className="h-5 w-5" /></Link>
            </Button>
          </div>
        </header>
        <main className="min-w-0 flex-1"><Outlet /></main>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen flex-col transition-colors duration-300"
      style={getBackgroundStyle()}
    >
      <PromoBanner />
      <SiteHeader />
      <main className="flex-1 overflow-x-hidden">
        <Outlet />
      </main>
      <div className="pb-16 lg:pb-0">
        <SiteFooter />
      </div>
      <MobileBottomNav />
      <InteractiveTutorial />
      <WhatsAppSupportButton />
      <LiveSupportWidget />
    </div>
  );
}
