// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import {
  MessageCircle,
  Phone,
  Mail,
  X,
  Send,
  Headset,
  CheckCheck,
  Sparkles,
  ChevronDown,
  ExternalLink,
  ShieldCheck,
  Minimize2,
  Camera,
  Trash2,
  Bell,
} from "lucide-react";
import { toast } from "sonner";
import { useSettings } from "@/lib/settings";
import { useUser } from "@/lib/session";
import { clientStore, DEFAULT_SUPPORT_THREADS } from "@/lib/store";
import { notificationService } from "@/lib/notifications";
import { sendLocalPush, requestPushPermission } from "@/lib/push-notifications";
import { generateAIChatResponse } from "@/lib/ai-assistant";
import type { ChatMessage, SupportThread } from "@/lib/types-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SUGGESTIONS = [
  "Où en est mon colis actuel ?",
  "Pouvez-vous valider ma demande d'achat ?",
  "Comment recharger mon portefeuille ?",
  "Quels sont vos délais vers Port-au-Prince ?",
];

// Play subtle web audio notification chime
function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // ignore audio failure
  }
}

// Get or create unique client ID so every visitor/client has their own isolated system
function getEffectiveClientId(user: any): { id: string; name: string } {
  if (user?.id) {
    return {
      id: user.id,
      name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Client Prime",
    };
  }
  if (user?.email) {
    return {
      id: user.email,
      name: user.email.split("@")[0] || "Client Prime",
    };
  }
  if (typeof window !== "undefined") {
    let visitorId = localStorage.getItem("prime_isolated_visitor_id");
    let visitorName = localStorage.getItem("prime_isolated_visitor_name");
    if (!visitorId) {
      visitorId = `client-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
      localStorage.setItem("prime_isolated_visitor_id", visitorId);
    }
    if (!visitorName) {
      visitorName = `Visiteur-${visitorId.slice(-4)}`;
      localStorage.setItem("prime_isolated_visitor_name", visitorName);
    }
    return { id: visitorId, name: visitorName };
  }
  return { id: "client-guest", name: "Visiteur" };
}

export function LiveSupportWidget() {
  const s = useSettings();
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [attachedImage, setAttachedImage] = useState<string>("");
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeDossierId, setActiveDossierId] = useState<string>("DOSSIER-GENERAL");
  const [activeDossierTitle, setActiveDossierTitle] = useState<string>(
    "Assistance Générale & Suivi",
  );
  const [showDossierPicker, setShowDossierPicker] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clientInfo = getEffectiveClientId(user);

  // Sync client-specific isolated thread from clientStore
  const [currentThread, setCurrentThread] = useState<SupportThread>(() =>
    clientStore.getClientThread(
      clientInfo.id,
      clientInfo.name,
      activeDossierId,
      activeDossierTitle,
    ),
  );

  const refreshThread = () => {
    const thread = clientStore.getClientThread(
      clientInfo.id,
      clientInfo.name,
      activeDossierId,
      activeDossierTitle,
    );
    setCurrentThread({ ...thread });
  };

  useEffect(() => {
    refreshThread();
  }, [activeDossierId, user]);

  useEffect(() => {
    const handleStorageChange = () => {
      refreshThread();
    };
    window.addEventListener("jul_support_threads_changed", handleStorageChange);

    // Event to open chat pre-selected on a dossier
    const handleOpenChat = (e: Event) => {
      const ce = e as CustomEvent<{ dossierId?: string; dossierTitle?: string }>;
      if (ce.detail) {
        if (ce.detail.dossierId) setActiveDossierId(ce.detail.dossierId);
        if (ce.detail.dossierTitle) setActiveDossierTitle(ce.detail.dossierTitle);
      }
      setOpen(true);
      setUnreadCount(0);
      try {
        requestPushPermission();
      } catch (err) {
        console.error(err);
      }
    };
    window.addEventListener("jul_open_chat", handleOpenChat);

    return () => {
      window.removeEventListener("jul_support_threads_changed", handleStorageChange);
      window.removeEventListener("jul_open_chat", handleOpenChat);
    };
  }, [activeDossierId, user]);

  useEffect(() => {
    if (open) {
      setUnreadCount(0);
      scrollToBottom();
    }
  }, [open, currentThread.messages?.length]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return toast.error("Veuillez sélectionner un fichier image valide.");
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const res = uploadEvent.target?.result as string;
      setAttachedImage(res);
      toast.success("Image attachée au message.");
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend ?? inputText).trim();
    if (!content && !attachedImage) return;

    const senderName = clientInfo.name;
    const userMsgText = content || "Image attachée";
    const imagePayload = attachedImage;

    // 1. Post client message to their isolated thread
    clientStore.sendChatMessage(currentThread.id, {
      sender: "user",
      sender_name: senderName,
      message: userMsgText,
      attachment_url: imagePayload || undefined,
      dossier_id: activeDossierId,
      dossier_title: activeDossierTitle,
      target_customer_id: clientInfo.id,
    });

    setInputText("");
    setAttachedImage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    refreshThread();
    scrollToBottom();

    // 2. Real Support Assistant response respecting company branding
    setIsTyping(true);

    try {
      const aiReply = await generateAIChatResponse({
        userMessage: userMsgText,
        dossierId: activeDossierId,
        dossierTitle: activeDossierTitle,
        userName: senderName,
      });

      setIsTyping(false);

      const agentName = s?.ai_assistant_name || "Support Prime Express";
      const agentRole = s?.ai_assistant_role || "Conseiller Support en direct";

      clientStore.sendChatMessage(currentThread.id, {
        sender: "agent",
        sender_name: agentName,
        sender_role: agentRole,
        message: aiReply,
        dossier_id: activeDossierId,
        dossier_title: activeDossierTitle,
        target_customer_id: clientInfo.id,
      });

      refreshThread();
      scrollToBottom();
      playNotificationChime();

      // Native Push Notification
      try {
        sendLocalPush(`Nouveau message de ${agentName}`, {
          body: aiReply.slice(0, 100),
          url: window.location.pathname,
        });
      } catch (err) {
        console.error(err);
      }

      // If widget is minimized, increment counter
      if (!open) {
        setUnreadCount((c) => c + 1);
        notificationService.addNotification({
          title: `Nouveau message de ${agentName}`,
          message: aiReply.substring(0, 90) + "...",
          type: "chat",
        });
      }
    } catch {
      setIsTyping(false);
      clientStore.sendChatMessage(currentThread.id, {
        sender: "agent",
        sender_name: s?.ai_assistant_name || "Support Prime Express",
        sender_role: "Service Client",
        message:
          "Bien reçu votre message. Notre équipe logistique consulte immédiatement votre dossier.",
        dossier_id: activeDossierId,
        dossier_title: activeDossierTitle,
        target_customer_id: clientInfo.id,
      });
      refreshThread();
      scrollToBottom();
      playNotificationChime();
    }
  };

  const handleSelectDossier = (id: string, title: string) => {
    setActiveDossierId(id);
    setActiveDossierTitle(title);
    setShowDossierPicker(false);
    toast.success(`Chat connecté au dossier ${id}`);
  };

  const agentDisplayName = s?.ai_assistant_name || currentThread.agent_name || "Support Prime Express";
  const agentDisplayRole =
    s?.ai_assistant_role || currentThread.agent_role || "Conseiller en direct";

  return (
    <div className="fixed bottom-20 right-3 lg:bottom-5 lg:right-5 z-40 select-none">
      {open ? (
        <div className="w-[calc(100vw-1.5rem)] max-w-[400px] h-[560px] max-h-[78vh] rounded-xl bg-card border border-border shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-200">
          {/* Header */}
          <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  <Headset className="h-5 w-5" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-xs leading-tight truncate">
                  {agentDisplayName}
                </h3>
                <span className="text-[10px] text-slate-300 block truncate leading-tight">
                  {agentDisplayRole} • En ligne
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Minimiser"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Dossier Bar */}
          <div className="bg-muted/70 px-3 py-1.5 border-b border-border flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-muted-foreground font-medium">Dossier :</span>
              <button
                onClick={() => setShowDossierPicker(!showDossierPicker)}
                className="font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 truncate"
              >
                {activeDossierTitle}
                <ChevronDown className="h-3 w-3 flex-shrink-0" />
              </button>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">
              {clientInfo.name}
            </span>
          </div>

          {/* Dossier Picker Dropdown */}
          {showDossierPicker && (
            <div className="bg-popover border-b border-border p-2 space-y-1 text-xs animate-in fade-in duration-150">
              <span className="text-[10px] font-bold text-muted-foreground uppercase px-2">
                Sélectionner un dossier :
              </span>
              <button
                onClick={() =>
                  handleSelectDossier("DOSSIER-GENERAL", "Assistance Générale & Suivi")
                }
                className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-muted font-medium transition-colors"
              >
                Assistance Générale
              </button>
              <button
                onClick={() =>
                  handleSelectDossier("DOSSIER-COLIS-MIAMI", "Expédition Colis Miami ➔ Haïti")
                }
                className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-muted font-medium transition-colors"
              >
                Expédition Colis Miami ➔ Haïti
              </button>
              <button
                onClick={() =>
                  handleSelectDossier("DOSSIER-ACHAT-ASSISTE", "Achat Assisté (« Achetez pour moi »)")
                }
                className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-muted font-medium transition-colors"
              >
                Achat Assisté (« Achetez pour moi »)
              </button>
              <button
                onClick={() =>
                  handleSelectDossier("DOSSIER-PORTEFEUILLE", "Recharge MonCash / Natcash")
                }
                className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-muted font-medium transition-colors"
              >
                Recharge MonCash / Natcash
              </button>
            </div>
          )}

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-muted/20">
            {currentThread.messages?.map((msg) => {
              const isUser = msg.sender === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                >
                  <span className="text-[10px] text-muted-foreground mb-0.5 px-1 font-medium">
                    {isUser ? "Vous" : msg.sender_name || agentDisplayName}
                  </span>
                  <div
                    className={`max-w-[85%] rounded-lg p-3 text-xs leading-relaxed shadow-xs ${
                      isUser
                        ? "bg-orange-600 text-white"
                        : "bg-card border border-border text-foreground"
                    }`}
                  >
                    {msg.attachment_url && (
                      <div className="mb-2">
                        <img
                          src={msg.attachment_url}
                          alt="Pièce jointe"
                          className="max-h-40 rounded-md object-cover border"
                        />
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                    <div
                      className={`text-[9px] mt-1 text-right flex items-center justify-end gap-1 ${
                        isUser ? "text-orange-200" : "text-muted-foreground"
                      }`}
                    >
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {isUser && <CheckCheck className="h-3 w-3" />}
                    </div>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground pl-2 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-bounce" />
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-bounce [animation-delay:0.2s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-bounce [animation-delay:0.4s]" />
                <span className="text-[11px] text-muted-foreground ml-1">
                  {agentDisplayName} écrit…
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions */}
          <div className="p-2 bg-background border-t border-border flex gap-1.5 overflow-x-auto no-scrollbar">
            {SUGGESTIONS.map((sug, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendMessage(sug)}
                className="text-[10px] font-medium bg-muted hover:bg-muted/80 text-foreground px-2 py-1 rounded-md whitespace-nowrap transition-colors flex-shrink-0 border border-border/60"
              >
                {sug}
              </button>
            ))}
          </div>

          {/* Attached image preview */}
          {attachedImage && (
            <div className="p-2 bg-muted/60 border-t border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src={attachedImage}
                  alt="Aperçu"
                  className="h-10 w-10 rounded-md object-cover border"
                />
                <span className="text-[11px] font-semibold text-foreground">
                  Photo attachée
                </span>
              </div>
              <button
                onClick={() => setAttachedImage("")}
                className="text-destructive p-1 rounded hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Message Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-2.5 bg-card border-t border-border flex items-center gap-2"
          >
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-orange-500 transition-colors"
              title="Attacher une photo"
            >
              <Camera className="h-4 w-4" />
            </button>

            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Écrivez votre message..."
              className="text-xs h-9 rounded-md flex-1"
            />

            <Button
              type="submit"
              size="sm"
              disabled={!inputText.trim() && !attachedImage}
              className="h-9 px-3 rounded-md bg-orange-600 hover:bg-orange-700 text-white font-bold"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      ) : (
        /* Floating Chat Trigger Button */
        <button
          onClick={() => {
            setOpen(true);
            setUnreadCount(0);
            try {
              requestPushPermission();
            } catch (err) {
              console.error(err);
            }
          }}
          className="group flex items-center gap-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2.5 shadow-xl border border-slate-700 transition-all hover:scale-105 active:scale-95"
          title="Support Chat en Direct"
        >
          <div className="relative">
            <Headset className="h-5 w-5 text-orange-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="text-left hidden sm:block">
            <span className="text-xs font-bold block leading-tight">
              Support Direct
            </span>
            <span className="text-[10px] text-slate-300 block leading-tight">
              Réponse instantanée
            </span>
          </div>
        </button>
      )}
    </div>
  );
}
