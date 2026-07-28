"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/app-store";
import { 
  useIntegrations, 
  useConfigureProvider, 
  useSetProviderEnabled, 
  useDisconnectProvider,
  useTestProviderConnection 
} from "@/hooks/use-integrations";
import { ProviderStatusBadge } from "./providers/provider-status-badge";
import { X, SlidersHorizontal, KeyRound, Loader2, Power, Trash2, Check, AlertCircle, RefreshCw, Cpu, Search, Sparkles, Image as ImageIcon, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ArchivePortabilityModal } from "@/components/settings/archive-portability-modal";

export function IntegrationsDrawer() {
  const { integrationsOpen, setIntegrationsOpen } = useAppStore();
  const { data: integrations, isLoading } = useIntegrations();

  const { mutateAsync: configureProvider, isPending: isConfiguring } = useConfigureProvider();
  const { mutateAsync: setEnabled } = useSetProviderEnabled();
  const { mutateAsync: disconnectProvider, isPending: isDisconnecting } = useDisconnectProvider();
  const { mutateAsync: testConnection, isPending: isTesting } = useTestProviderConnection();

  const [isPortabilityModalOpen, setIsPortabilityModalOpen] = useState(false);
  const [configuringProviderId, setConfiguringProviderId] = useState<string | null>(null);
  const [testingProviderId, setTestingProviderId] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [notification, setNotification] = useState<string | null>(null);

  const [disconnectTargetId, setDisconnectTargetId] = useState<string | null>(null);

  const handleSaveKey = async (providerId: string) => {
    if (!apiKeyInput.trim() || isConfiguring) return;
    setErrorMessage("");

    try {
      await configureProvider({ provider: providerId, apiKey: apiKeyInput.trim() });
      setConfiguringProviderId(null);
      setApiKeyInput("");
      setNotification("API key saved and encrypted using Web Crypto AES-GCM 256-bit.");
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      setErrorMessage(err?.userMessage || "Invalid API key or network validation failure.");
    }
  };

  const handleTestConnection = async (providerId: string) => {
    setTestingProviderId(providerId);
    setErrorMessage("");
    try {
      const res = await testConnection(providerId);
      if (res.success) {
        setNotification(res.message);
        setTimeout(() => setNotification(null), 4000);
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to test provider connection.");
    } finally {
      setTestingProviderId(null);
    }
  };

  const handleToggleEnable = async (providerId: string, currentEnabled: boolean) => {
    try {
      await setEnabled({ provider: providerId, enabled: !currentEnabled });
    } catch (err: any) {
      setErrorMessage(err?.userMessage || "Failed to update provider status.");
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  const handleConfirmDisconnect = async () => {
    if (!disconnectTargetId) return;
    try {
      await disconnectProvider(disconnectTargetId);
      setDisconnectTargetId(null);
      setNotification("Provider disconnected and encrypted credentials deleted.");
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      setDisconnectTargetId(null);
      setErrorMessage(err?.userMessage || "Failed to disconnect provider.");
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  return (
    <>
      <AnimatePresence>
        {integrationsOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-overlay md:items-center p-0 md:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 gpu-accelerated"
              onClick={() => setIntegrationsOpen(false)}
            />

            <motion.div
              initial={{ y: "100%", opacity: 0.8 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0.8 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative z-10 w-full max-w-lg bg-card rounded-t-2xl md:rounded-2xl border border-border shadow-lg flex flex-col max-h-[85vh] overflow-hidden gpu-accelerated"
            >
              {/* Header */}
              <div className="px-5 py-4 flex items-center justify-between border-b border-border/30">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="size-4 text-primary" />
                  <h2 className="text-sm font-semibold text-foreground tracking-tight">
                    Providers & Secure Credentials
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsPortabilityModalOpen(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-secondary/50 hover:bg-secondary text-xs font-semibold text-foreground transition-all"
                    title="Export / Import Backup"
                  >
                    <Download className="size-3.5 text-primary" />
                    <span>Backup</span>
                  </button>
                  <button
                    onClick={() => setIntegrationsOpen(false)}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 overflow-y-auto space-y-4 flex-1">
                <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-foreground">
                    <KeyRound className="size-3.5 text-primary" />
                    <span>Bring Your Own Key (BYOK) Architecture</span>
                  </div>
                  <p className="leading-relaxed text-[11px]">
                    Trackr encrypts API keys at rest using client-side Web Crypto AES-GCM 256-bit. Credentials are never logged, sent to Firestore, or shared.
                  </p>
                </div>

                {notification && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-medium flex items-center gap-2">
                    <Check className="size-4 flex-shrink-0" />
                    <span>{notification}</span>
                  </div>
                )}

                {errorMessage && !configuringProviderId && (
                  <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="size-4 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {integrations?.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-xl bg-secondary/20 border border-border/40 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-semibold text-foreground">
                                {item.name}
                              </h3>
                              <ProviderStatusBadge status={item.status} />
                              {item.capabilities.supportsAI && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1">
                                  <Sparkles className="size-2.5" /> AI Ready
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground/80 leading-normal">
                              {item.description}
                            </p>

                            {/* Provider Capability Tags */}
                            <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                              {item.capabilities.supportsSearch && (
                                <span className="px-1.5 py-0.5 rounded bg-secondary/50 text-[10px] font-medium text-muted-foreground flex items-center gap-0.5">
                                  <Search className="size-2.5" /> Search
                                </span>
                              )}
                              {item.capabilities.supportsImages && (
                                <span className="px-1.5 py-0.5 rounded bg-secondary/50 text-[10px] font-medium text-muted-foreground flex items-center gap-0.5">
                                  <ImageIcon className="size-2.5" /> Posters
                                </span>
                              )}
                              {item.capabilities.supportsCredentials && (
                                <span className="px-1.5 py-0.5 rounded bg-secondary/50 text-[10px] font-medium text-muted-foreground flex items-center gap-0.5">
                                  <KeyRound className="size-2.5" /> BYOK Auth
                                </span>
                              )}
                            </div>
                          </div>

                          {item.capabilities.supportsCredentials && (
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button
                                onClick={() => handleToggleEnable(item.id, item.enabled)}
                                className={`p-1.5 rounded-lg border transition-all ${
                                  item.enabled
                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                                    : "bg-secondary/40 border-border/40 text-muted-foreground"
                                }`}
                                title={item.enabled ? "Disable Provider" : "Enable Provider"}
                              >
                                <Power className="size-3.5" />
                              </button>

                              {item.configured && (
                                <button
                                  onClick={() => setDisconnectTargetId(item.id)}
                                  className="p-1.5 rounded-lg border border-border/40 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                                  title="Disconnect & Delete Key"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Connection Controls & Actions */}
                        {configuringProviderId === item.id ? (
                          <div className="p-3 bg-secondary/30 rounded-lg border border-border/50 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                <KeyRound className="size-3" /> Enter {item.name} API Key
                              </span>
                              <button
                                onClick={() => {
                                  setConfiguringProviderId(null);
                                  setErrorMessage("");
                                }}
                                className="text-xs text-muted-foreground hover:text-foreground"
                              >
                                Cancel
                              </button>
                            </div>

                            <div className="flex gap-2">
                              <input
                                type="password"
                                value={apiKeyInput}
                                onChange={(e) => setApiKeyInput(e.target.value)}
                                placeholder={`Enter ${item.name} key...`}
                                className="flex-1 h-9 px-3 rounded bg-background border border-border/50 text-xs font-mono outline-none focus:border-primary"
                              />
                              <Button
                                size="sm"
                                disabled={isConfiguring || !apiKeyInput.trim()}
                                onClick={() => handleSaveKey(item.id)}
                                className="h-9 px-3 text-xs font-semibold"
                              >
                                {isConfiguring ? <Loader2 className="size-3 animate-spin mr-1" /> : <Check className="size-3 mr-1" />}
                                Encrypt & Save
                              </Button>
                            </div>

                            {errorMessage && (
                              <p className="text-[10px] text-destructive flex items-center gap-1">
                                <AlertCircle className="size-3" />
                                {errorMessage}
                              </p>
                            )}
                          </div>
                        ) : (
                          item.capabilities.supportsCredentials && (
                            <div className="pt-1 flex items-center justify-end gap-2">
                              {item.configured && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={testingProviderId === item.id}
                                  onClick={() => handleTestConnection(item.id)}
                                  className="h-7 text-[11px] font-medium gap-1 text-muted-foreground hover:text-foreground"
                                >
                                  {testingProviderId === item.id ? (
                                    <Loader2 className="size-3 animate-spin" />
                                  ) : (
                                    <RefreshCw className="size-3" />
                                  )}
                                  Test Connection
                                </Button>
                              )}

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setConfiguringProviderId(item.id);
                                  setApiKeyInput("");
                                  setErrorMessage("");
                                }}
                                className="h-7 text-[11px] font-medium gap-1"
                              >
                                <KeyRound className="size-3" />
                                {item.configured ? "Update Key" : "Configure Key"}
                              </Button>
                            </div>
                          )
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 bg-secondary/10 border-t border-border/30 text-center">
                <p className="text-[11px] text-muted-foreground/60">
                  All API keys are client-side encrypted and never stored in plain text or synced off-device.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Disconnect Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!disconnectTargetId}
        title="Disconnect Provider"
        description="Are you sure you want to disconnect this provider and permanently delete your encrypted API key credentials?"
        confirmText="Disconnect"
        variant="destructive"
        isLoading={isDisconnecting}
        onConfirm={handleConfirmDisconnect}
        onClose={() => setDisconnectTargetId(null)}
      />

      {/* Archive Backup & Portability Modal */}
      <ArchivePortabilityModal
        isOpen={isPortabilityModalOpen}
        onClose={() => setIsPortabilityModalOpen(false)}
      />
    </>
  );
}
