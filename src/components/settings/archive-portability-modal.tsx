"use client";

import React, { useState, useRef } from "react";
import { Download, Upload, CheckCircle2, AlertCircle, RefreshCw, X, ShieldCheck } from "lucide-react";
import { archivePortabilityService, ImportResult } from "@/services/archive-portability-service";
import { useQueryClient } from "@tanstack/react-query";

interface ArchivePortabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ArchivePortabilityModal({ isOpen, onClose }: ArchivePortabilityModalProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await archivePortabilityService.downloadArchiveJSON();
    } catch (err) {
      console.error("Failed to export archive:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const text = await file.text();
      const result = await archivePortabilityService.importArchiveJSON(text);
      setImportResult(result);
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["resources"] });
        queryClient.invalidateQueries({ queryKey: ["collections"] });
        queryClient.invalidateQueries({ queryKey: ["activities"] });
      }
    } catch (err: any) {
      setImportResult({
        success: false,
        importedCounts: { resources: 0, collections: 0, notes: 0, relationships: 0 },
        errors: [err.message || "Failed to read file."],
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="archive-portability-title"
    >
      <div className="w-full max-w-lg overflow-hidden border border-border/60 bg-card rounded-2xl shadow-2xl space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/40 pb-4">
          <div>
            <h2 id="archive-portability-title" className="text-lg font-bold tracking-tight text-foreground">
              Archive Backup & Portability
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Export your full personal library or import from a JSON backup.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Security Alert Badge */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary">
          <ShieldCheck className="size-4 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Privacy Guaranteed</span>
            <p className="opacity-90 text-[11px] mt-0.5">
              API keys and encrypted credentials are <strong>never</strong> exported into backup JSON files.
            </p>
          </div>
        </div>

        {/* Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Export Box */}
          <div className="flex flex-col justify-between p-4 rounded-xl border border-border/40 bg-secondary/20 space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Download className="size-4 text-primary" />
                <span>Export Archive</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Download a clean `.json` file of all resources, tags, collections, notes, and relationships.
              </p>
            </div>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 active:scale-98 transition-all disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="size-3.5 animate-spin" />
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <Download className="size-3.5" />
                  <span>Download Backup</span>
                </>
              )}
            </button>
          </div>

          {/* Import Box */}
          <div className="flex flex-col justify-between p-4 rounded-xl border border-border/40 bg-secondary/20 space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Upload className="size-4 text-primary" />
                <span>Import Backup</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Restore or merge an existing `.json` backup payload into your archive.
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-secondary text-foreground border border-border/60 text-xs font-semibold hover:bg-secondary/80 active:scale-98 transition-all disabled:opacity-50"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="size-3.5 animate-spin" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <Upload className="size-3.5" />
                  <span>Select JSON File</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Diagnostic Results */}
        {importResult && (
          <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
            importResult.success ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-destructive/10 border-destructive/30 text-destructive"
          }`}>
            <div className="flex items-center gap-1.5 font-bold">
              {importResult.success ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
              <span>{importResult.success ? "Import Completed Successfully" : "Import Failed"}</span>
            </div>

            {importResult.success && (
              <div className="text-[11px] opacity-90 pl-5 space-y-0.5">
                <div>Resources imported: {importResult.importedCounts.resources}</div>
                <div>Collections imported: {importResult.importedCounts.collections}</div>
                <div>Notes imported: {importResult.importedCounts.notes}</div>
                <div>Relationships imported: {importResult.importedCounts.relationships}</div>
              </div>
            )}

            {importResult.errors.length > 0 && (
              <ul className="list-disc list-inside text-[10px] space-y-0.5 pt-1">
                {importResult.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
