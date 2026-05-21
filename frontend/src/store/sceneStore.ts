export const Phase = {
  IDLE: 'IDLE',
  EXPANDING: 'EXPANDING',
  SEARCHING: 'SEARCHING',
  CONVERGING: 'CONVERGING',
  COMPLETE: 'COMPLETE'
} as const;

interface SceneState {
  phase: typeof Phase[keyof typeof Phase];
  query: string;
  taskId: string | null;
  sources: string[];
  finalReport: string | null;
  logs: string[];
  currentStep: string;
  history: any[];
  llmModel: string;
  template: string;
  isHistoryOpen: boolean;
  setPhase: (phase: typeof Phase[keyof typeof Phase]) => void;
  setQuery: (query: string) => void;
  setTaskId: (id: string | null) => void;
  setSources: (sources: string[]) => void;
  setFinalReport: (report: string | null) => void;
  setLogs: (logs: string[]) => void;
  setCurrentStep: (step: string) => void;
  setHistory: (history: any[]) => void;
  setLlmModel: (model: string) => void;
  setTemplate: (template: string) => void;
  setIsHistoryOpen: (open: boolean) => void;
}

import { create } from 'zustand';

export const useSceneStore = create<SceneState>((set) => ({
  phase: Phase.IDLE,
  query: '',
  taskId: null,
  sources: [],
  finalReport: null,
  logs: [],
  currentStep: 'idle',
  history: [],
  llmModel: 'Llama 3 (Local)',
  template: 'DEEP_DIVE',
  isHistoryOpen: false,
  setPhase: (phase) => set({ phase }),
  setQuery: (query) => set({ query }),
  setTaskId: (id) => set({ taskId: id }),
  setSources: (sources) => set({ sources }),
  setFinalReport: (report) => set({ finalReport: report }),
  setLogs: (logs) => set({ logs }),
  setCurrentStep: (currentStep) => set({ currentStep }),
  setHistory: (history) => set({ history }),
  setLlmModel: (llmModel) => set({ llmModel }),
  setTemplate: (template) => set({ template }),
  setIsHistoryOpen: (isHistoryOpen) => set({ isHistoryOpen }),
}));
