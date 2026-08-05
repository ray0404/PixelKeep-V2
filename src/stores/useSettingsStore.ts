import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  theme: 'Standard' | 'Pixel' | 'AmberConsole';
  amberGas: 'neon' | 'amber';
  amberBloom: boolean;
  amberCrt: boolean;
  amberAfterglow: boolean;
  font: string;
  background: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  terminalTextColor: string;
  lineHeight: string;
  compact: boolean;
  scale: number;
  contentFontSize: number;
  wordWrap: boolean;
  dualDirectory: boolean;
  includeTitleInCopy: boolean;
  disableTaskEncryption: boolean;
  hasSeenEncryptionPrompt: boolean;
  defaultAlarmSound: { data: string; name: string } | null;
  enableMarkdownFeature: boolean;
  enableLineNumbersFeature: boolean;
  setTheme: (theme: 'Standard' | 'Pixel' | 'AmberConsole') => void;
  setSetting: (key: keyof Omit<SettingsState, 'setTheme' | 'setSetting'>, value: any) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'Standard',
      amberGas: 'neon',
      amberBloom: true,
      amberCrt: false,
      amberAfterglow: false,
      font: 'font-display',
      background: 'bg-default',
      primaryColor: '#4ade80',
      secondaryColor: '#a855f7',
      textColor: '#f0fdf4',
      terminalTextColor: '#f0fdf4',
      lineHeight: 'leading-normal',
      compact: false,
      scale: 100,
      contentFontSize: 100,
      wordWrap: true,
      dualDirectory: false,
      includeTitleInCopy: true,
      disableTaskEncryption: true,
      hasSeenEncryptionPrompt: false,
      defaultAlarmSound: null,
      enableMarkdownFeature: false,
      enableLineNumbersFeature: false,

      setTheme: (theme) => set({ theme }),
      setSetting: (key, value) => set({ [key]: value } as any),
    }),
    {
      name: 'pixel-keep-settings',
    }
  )
);
