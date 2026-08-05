import React from 'react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { PixelCheckbox } from '../components/ui/PixelCheckbox';
import { PixelButton } from '../components/ui/PixelButton';

export const Settings: React.FC = () => {
  const settings = useSettingsStore();

  const themes = ['Standard', 'Pixel', 'AmberConsole'];
  const fonts = [
    { name: 'Pixel (Default)', value: 'font-display' },
    { name: 'System Sans', value: 'font-sans' },
    { name: 'System Serif', value: 'font-serif' },
    { name: 'System Mono', value: 'font-mono' },
    { name: 'Inter', value: 'font-Inter' },
    { name: 'Roboto', value: 'font-Roboto' },
    { name: 'Open Sans', value: 'font-Open-Sans' },
    { name: 'Exo', value: 'font-Exo' },
  ];

  const backgrounds = [
    { name: 'Deep Indigo (Default)', value: 'bg-default' },
    { name: 'Solid Black', value: 'bg-solid-black' },
    { name: 'Solid Gray', value: 'bg-solid-gray' },
    { name: 'Midnight Blue', value: 'bg-midnight' },
    { name: 'Dark Forest', value: 'bg-forest' },
    { name: 'Pixel Grid', value: 'bg-pattern-grid' },
    { name: 'Polka Dots', value: 'bg-pattern-dots' },
    { name: 'Pixel Geometric', value: 'bg-pixel-geometric' },
    { name: 'Pixel Space', value: 'bg-pixel-space' },
    { name: 'Pixel RPG Grass', value: 'bg-pixel-rpg-grass' },
    { name: 'Pixel Cyber Grid', value: 'bg-pixel-cyber-grid' },
    { name: 'Pixel Dungeon', value: 'bg-pixel-dungeon' },
    { name: 'Pixel Forest Ground', value: 'bg-pixel-forest-ground' },
    { name: 'Pixel Adventure Water', value: 'bg-pixel-adventure-water' },
    { name: 'Pixel NES RPG Map', value: 'bg-pixel-nes-rpg-map' },
  ];

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto">
      <div className="mb-6 border-2 border-border-light bg-surface p-4 shadow-pixel-container">
        <h3 className="mb-4 text-xs uppercase text-primary font-bold border-b-2 border-border-light pb-2">Appearance</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-light uppercase">Theme</span>
            <select 
              className="h-10 w-40 border-2 border-border-light bg-[#f0fdf4] text-black text-[10px] px-2"
              value={settings.theme}
              onChange={(e) => settings.setTheme(e.target.value as any)}
            >
              {themes.map(t => <option key={t} value={t}>{t === 'AmberConsole' ? 'Amber Console' : t}</option>)}
            </select>
          </div>

          {settings.theme === 'AmberConsole' && (
            <div className="p-3 border-2 border-primary/40 bg-black/40 space-y-3">
              <div className="text-[10px] font-bold text-primary uppercase border-b border-primary/30 pb-1">
                Amber Console Configuration
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-light uppercase">Gas Discharge Palette</span>
                <select
                  className="h-9 w-40 border border-primary bg-black text-primary text-[10px] px-2"
                  value={settings.amberGas}
                  onChange={(e) => settings.setSetting('amberGas', e.target.value as any)}
                >
                  <option value="neon">NEON 24° (AC Plasma)</option>
                  <option value="amber">AMBER 38° (CRT Phosphor)</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-light uppercase">Plasma Bloom & Matrix</span>
                <PixelCheckbox
                  checked={settings.amberBloom}
                  onChange={(e) => settings.setSetting('amberBloom', e.target.checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-light uppercase">CRT Scanlines & Flicker</span>
                <PixelCheckbox
                  checked={settings.amberCrt}
                  onChange={(e) => settings.setSetting('amberCrt', e.target.checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-light uppercase">Persistence Afterglow</span>
                <PixelCheckbox
                  checked={settings.amberAfterglow}
                  onChange={(e) => settings.setSetting('amberAfterglow', e.target.checked)}
                />
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-light uppercase">Font</span>
            <select 
              className="h-10 w-40 border-2 border-border-light bg-[#f0fdf4] text-black text-[10px] px-2"
              value={settings.font}
              onChange={(e) => settings.setSetting('font', e.target.value)}
            >
              {fonts.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
            </select>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-text-light uppercase">Background</span>
            <select 
              className="h-10 w-40 border-2 border-border-light bg-[#f0fdf4] text-black text-[10px] px-2"
              value={settings.background}
              onChange={(e) => settings.setSetting('background', e.target.value)}
            >
              {backgrounds.map(bg => <option key={bg.value} value={bg.value}>{bg.name}</option>)}
            </select>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-text-light uppercase">Primary Color</span>
            <input 
              type="color" 
              value={settings.primaryColor}
              onChange={(e) => settings.setSetting('primaryColor', e.target.value)}
              className="h-10 w-40 p-1 bg-[#f0fdf4] border-2 border-border-light cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-text-light uppercase">Secondary Color</span>
            <input 
              type="color" 
              value={settings.secondaryColor}
              onChange={(e) => settings.setSetting('secondaryColor', e.target.value)}
              className="h-10 w-40 p-1 bg-[#f0fdf4] border-2 border-border-light cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-text-light uppercase">Terminal Text Color</span>
            <input 
              type="color" 
              value={settings.terminalTextColor}
              onChange={(e) => settings.setSetting('terminalTextColor', e.target.value)}
              className="h-10 w-40 p-1 bg-[#f0fdf4] border-2 border-border-light cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-text-light uppercase">Compact Mode</span>
            <PixelCheckbox 
              checked={settings.compact}
              onChange={(e) => settings.setSetting('compact', e.target.checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-text-light uppercase">Standard Word Wrap</span>
            <PixelCheckbox 
              checked={settings.wordWrap}
              onChange={(e) => settings.setSetting('wordWrap', e.target.checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-text-light uppercase">Dual Directory</span>
            <PixelCheckbox 
              checked={settings.dualDirectory}
              onChange={(e) => settings.setSetting('dualDirectory', e.target.checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-text-light uppercase">Include Title in Copy</span>
            <PixelCheckbox 
              checked={settings.includeTitleInCopy}
              onChange={(e) => settings.setSetting('includeTitleInCopy', e.target.checked)}
            />
          </div>

          <div className="pt-2">
            <div className="flex justify-between mb-2">
              <span className="text-[10px] text-text-light uppercase">Interface Scale</span>
              <span className="text-[10px] text-primary">{settings.scale}%</span>
            </div>
            <input 
              type="range" 
              min="75" max="125" step="5" 
              value={settings.scale}
              onChange={(e) => settings.setSetting('scale', parseInt(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-[10px] text-text-light uppercase">Content Font Size</span>
              <span className="text-[10px] text-primary">{settings.contentFontSize}%</span>
            </div>
            <input 
              type="range" 
              min="80" max="150" step="5" 
              value={settings.contentFontSize}
              onChange={(e) => settings.setSetting('contentFontSize', parseInt(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="mb-6 border-2 border-border-light bg-surface p-4 shadow-pixel-container">
        <h3 className="mb-4 text-xs uppercase text-primary font-bold border-b-2 border-border-light pb-2">Privacy & Security</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1 pr-4">
              <span className="text-xs text-text-light uppercase">Disable Quest Encryption</span>
              <p className="text-[9px] text-text-meta normal-case leading-tight">
                Increases performance by storing tasks as plaintext. Notes remain encrypted.
                <br />
                <span className="text-danger italic">Note: Existing quests stay encrypted until edited.</span>
              </p>
            </div>
            <PixelCheckbox 
              checked={settings.disableTaskEncryption}
              onChange={(e) => settings.setSetting('disableTaskEncryption', e.target.checked)}
            />
          </div>
        </div>
      </div>

      <div className="mb-6 border-2 border-border-light bg-surface p-4 shadow-pixel-container">
        <h3 className="mb-4 text-xs uppercase text-primary font-bold border-b-2 border-border-light pb-2">General</h3>
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <span className="text-xs text-text-light uppercase">Default Alarm Sound</span>
            <div className="flex items-center gap-3">
              <PixelButton variant="surface" className="w-full h-10 text-[10px]" onClick={() => document.getElementById('default-alarm-input')?.click()}>
                {settings.defaultAlarmSound ? settings.defaultAlarmSound.name : 'UPLOAD DEFAULT SOUND'}
              </PixelButton>
              {settings.defaultAlarmSound && (
                <button onClick={() => settings.setSetting('defaultAlarmSound', null)} className="text-danger">
                  <span className="material-symbols-outlined">delete</span>
                </button>
              )}
            </div>
            <input 
              id="default-alarm-input"
              type="file" 
              accept="audio/*" 
              className="hidden" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                  const data = event.target?.result as string;
                  settings.setSetting('defaultAlarmSound', { data, name: file.name });
                };
                reader.readAsDataURL(file);
              }}
            />
          </div>
        </div>
      </div>

      <div className="mb-6 border-2 border-border-light bg-surface p-4 shadow-pixel-container">
        <h3 className="mb-4 text-xs uppercase text-primary font-bold border-b-2 border-border-light pb-2">Features</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-light uppercase">Enable Markdown Mode</span>
            <PixelCheckbox 
              checked={settings.enableMarkdownFeature}
              onChange={(e) => settings.setSetting('enableMarkdownFeature', e.target.checked)}
            />
          </div>
        </div>
      </div>

      <div className="border-2 border-border-light bg-surface p-4 shadow-pixel-container">
        <h3 className="mb-4 text-xs uppercase text-primary font-bold border-b-2 border-border-light pb-2">About</h3>
        <p className="text-[10px] text-text-light/70 leading-relaxed">
          Pixel Keep v2.0 (Refactored)<br />
          Built with React, Vite, Zustand, and Dexie.js.<br />
          Secure, Offline-First PWA.<br />
          All data is encrypted locally using AES-256.<br />
          Pixel art assets by nanobanana.
        </p>
      </div>
    </div>
  );
};