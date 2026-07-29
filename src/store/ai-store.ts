import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AISettings } from '@/types';

export const DEFAULT_AI_SETTINGS: AISettings = {
  selectedModel: 'gemini-1.5-flash',
  temperature: 0.2,
  maxOutputTokens: 1024,
  contextSize: 50,
  enableStreaming: true,
};

export const AVAILABLE_GEMINI_MODELS = [
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Fast & Lightweight)', maxTokens: 8192 },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (High Reasoning)', maxTokens: 8192 },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Latest Next-Gen)', maxTokens: 8192 },
];

interface AIState {
  settings: AISettings;
  updateSettings: (partial: Partial<AISettings>) => void;
  resetSettings: () => void;
}

export const useAIStore = create<AIState>()(
  persist(
    (set) => ({
      settings: DEFAULT_AI_SETTINGS,
      updateSettings: (partial) =>
        set((state) => ({
          settings: { ...state.settings, ...partial },
        })),
      resetSettings: () => set({ settings: DEFAULT_AI_SETTINGS }),
    }),
    {
      name: 'trackr_ai_settings_v1',
    }
  )
);
