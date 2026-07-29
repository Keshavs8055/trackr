"use client";

import React from "react";
import { useAIStore, AVAILABLE_GEMINI_MODELS } from "@/store/ai-store";
import { Sliders, RotateCcw, Cpu, Zap, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AISettingsTab() {
  const { settings, updateSettings, resetSettings } = useAIStore();

  return (
    <div className="space-y-4">
      <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-foreground">
          <Cpu className="size-3.5 text-purple-400" />
          <span>Intelligence Engine Configuration</span>
        </div>
        <p className="text-muted-foreground text-[11px] leading-relaxed">
          Configure model parameters, context limits, and streaming for Trackr AI capabilities.
        </p>
      </div>

      {/* Model Selection */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground flex items-center justify-between">
          <span>AI Model</span>
          <span className="text-[10px] text-muted-foreground font-mono">{settings.selectedModel}</span>
        </label>
        <select
          value={settings.selectedModel}
          onChange={(e) => updateSettings({ selectedModel: e.target.value })}
          className="w-full h-9 px-3 rounded-lg bg-background border border-border/60 text-xs font-medium text-foreground outline-none focus:border-primary"
        >
          {AVAILABLE_GEMINI_MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      {/* Temperature Slider */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground">Creativity / Temperature</span>
          <span className="text-[11px] font-mono text-primary font-bold">{settings.temperature.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min="0.0"
          max="1.0"
          step="0.05"
          value={settings.temperature}
          onChange={(e) => updateSettings({ temperature: parseFloat(e.target.value) })}
          className="w-full accent-primary h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
          <span>Precise (0.0)</span>
          <span>Balanced (0.2)</span>
          <span>Creative (1.0)</span>
        </div>
      </div>

      {/* Max Tokens */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground">Max Output Tokens</span>
          <span className="text-[11px] font-mono text-primary font-bold">{settings.maxOutputTokens}</span>
        </div>
        <input
          type="range"
          min="256"
          max="4096"
          step="256"
          value={settings.maxOutputTokens}
          onChange={(e) => updateSettings({ maxOutputTokens: parseInt(e.target.value, 10) })}
          className="w-full accent-primary h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Context Size */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground">Catalog Context Limit</span>
          <span className="text-[11px] font-mono text-primary font-bold">{settings.contextSize} resources</span>
        </div>
        <input
          type="range"
          min="10"
          max="200"
          step="10"
          value={settings.contextSize}
          onChange={(e) => updateSettings({ contextSize: parseInt(e.target.value, 10) })}
          className="w-full accent-primary h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Streaming Toggle */}
      <div className="p-3 rounded-xl bg-secondary/30 border border-border/40 flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Zap className="size-3.5 text-amber-400" />
            <span>Streaming Responses</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Stream text character-by-character for faster perceived response times.
          </p>
        </div>
        <input
          type="checkbox"
          checked={settings.enableStreaming}
          onChange={(e) => updateSettings({ enableStreaming: e.target.checked })}
          className="size-4 accent-primary rounded cursor-pointer"
        />
      </div>

      {/* Reset Settings */}
      <div className="pt-2 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => resetSettings()}
          className="h-8 text-xs font-medium gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="size-3.5" />
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
}
