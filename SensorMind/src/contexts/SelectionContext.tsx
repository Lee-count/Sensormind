import type { ChatMode, Scene, PlanPayload } from '@/types';
import { createContext, useContext, useMemo, useState, type FC, type ReactNode } from 'react';

interface SelectionState {
  scene: Scene | null;
  setScene: (scene: Scene | null) => void;
  mode: ChatMode;
  setMode: (mode: ChatMode) => void;
  freeInput: string;
  setFreeInput: (input: string) => void;
  baseConstraints: Record<string, string> | null;
  setBaseConstraints: (constraints: Record<string, string> | null) => void;
  plan: PlanPayload | null;
  setPlan: (plan: PlanPayload | null) => void;
}

const SelectionContext = createContext<SelectionState | undefined>(undefined);

export const SelectionProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [scene, setScene] = useState<Scene | null>(null);
  const [mode, setMode] = useState<ChatMode>('guided');
  const [freeInput, setFreeInput] = useState('');
  const [baseConstraints, setBaseConstraints] = useState<Record<string, string> | null>(null);
  const [plan, setPlan] = useState<PlanPayload | null>(null);

  const value = useMemo<SelectionState>(() => ({
    scene,
    setScene,
    mode,
    setMode,
    freeInput,
    setFreeInput,
    baseConstraints,
    setBaseConstraints,
    plan,
    setPlan,
  }), [scene, mode, freeInput, baseConstraints, plan]);

  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  );
};

export function useSelection() {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error('useSelection must be used within SelectionProvider');
  }
  return context;
}
