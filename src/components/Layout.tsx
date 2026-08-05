import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { useUIStore } from '../stores/useUIStore';
import { PixelButton } from './ui/PixelButton';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useFolderStore } from '../stores/useFolderStore';
import { exportData, importData, ExportFormat } from '../utils/backup';
import { PixelModal } from './ui/PixelModal';
import { PixelToast } from './ui/PixelToast';

import { useSettingsStore } from '../stores/useSettingsStore';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const { toggleSidebar } = useUIStore();
  const { password } = useAuthStore();
  const { currentFolderId, setCurrentFolderId, nodes } = useFolderStore();
  const settings = useSettingsStore();
  const navigate = useNavigate();
  const location = useLocation();

  const isAmber = settings.theme === 'AmberConsole';

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const handleExport = (format: ExportFormat) => {
    if (password) {
      exportData(password, format);
      setIsExportModalOpen(false);
    }
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && password) {
      try {
        await importData(file, password);
        alert("Import successful! Reloading...");
        window.location.reload();
      } catch (err: any) {
        alert("Import failed: " + err.message);
      }
    }
  };

  const isNotes = location.pathname.includes('notes');
  const isTasks = location.pathname.includes('tasks');

  const handleNavClick = (target: 'notes' | 'tasks') => {
    const isCurrent = (target === 'notes' && isNotes) || (target === 'tasks' && isTasks);
    
    if (isCurrent) {
      // Navigate up one directory
      const currentNode = nodes.find((n: any) => n.id === currentFolderId);
      if (currentNode && currentNode.parentId) {
        setCurrentFolderId(currentNode.parentId);
      } else {
        // Already at root or no node found, ensure we are at the correct root
        setCurrentFolderId(target === 'notes' ? 'root_notes' : 'root_tasks');
      }
    } else {
      // Switch view
      setCurrentFolderId(target === 'notes' ? 'root_notes' : 'root_tasks');
      navigate(`/${target}`);
    }
  };

  return (
    <div className={`relative flex min-h-screen w-full flex-col text-text-light antialiased ${isAmber ? `ac-screen ${settings.amberBloom ? 'ac-bloom' : ''} ${settings.amberCrt ? 'ac-crt' : ''} ${settings.amberAfterglow ? 'ac-afterglow' : ''}` : ''}`}>
      {isAmber && settings.amberBloom && <span className="ac-mesh" />}
      {isAmber && settings.amberCrt && <span className="ac-retrace" />}
      {isAmber && settings.amberAfterglow && <span className="ac-persist" />}
      <Sidebar />

      <header className="sticky top-0 z-10 flex items-center justify-between border-b-4 border-border-dark bg-surface p-4 pb-3 shadow-pixel-container">
        <button 
          onClick={toggleSidebar}
          className="flex size-10 shrink-0 items-center justify-center text-secondary hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-4xl">menu</span>
        </button>
        
        <h1 className="flex-1 text-center text-sm font-bold uppercase tracking-wider text-primary text-shadow-pixel">
          {title}
        </h1>

        <div className="flex items-center justify-end gap-2">
          <PixelButton variant="surface" onClick={() => fileInputRef.current?.click()} title="Import Data">
            <span className="material-symbols-outlined">file_upload</span>
          </PixelButton>
          <input type="file" ref={fileInputRef} className="hidden" accept=".json,.zip" onChange={handleImport} />
          
          <PixelButton variant="surface" onClick={() => setIsExportModalOpen(true)} title="Export Data">
            <span className="material-symbols-outlined">file_download</span>
          </PixelButton>
          <PixelButton variant="surface" onClick={() => navigate('/settings')}>
            <span className="material-symbols-outlined">settings</span>
          </PixelButton>
        </div>
      </header>

      <main className="flex-grow pb-24 overflow-x-hidden">
        {children}
      </main>

      <PixelModal 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)}
        title="EXPORT SCROLLS"
      >
        <div className="flex flex-col gap-3">
          <PixelButton className="w-full text-[10px] h-12" onClick={() => handleExport('json')}>JSON (FULL BACKUP)</PixelButton>
          <PixelButton className="w-full text-[10px] h-12" variant="secondary" onClick={() => handleExport('markdown')}>MARKDOWN (ZIP)</PixelButton>
          <PixelButton className="w-full text-[10px] h-12" variant="secondary" onClick={() => handleExport('txt_html')}>PLAINTEXT (W/ HTML)</PixelButton>
          <PixelButton className="w-full text-[10px] h-12" variant="secondary" onClick={() => handleExport('txt')}>PLAINTEXT (NO HTML)</PixelButton>
          <PixelButton className="w-full text-[10px] h-12" variant="secondary" onClick={() => handleExport('zip')}>FULL ARCHIVE (.ZIP)</PixelButton>
        </div>
      </PixelModal>

      <nav className="fixed bottom-0 left-0 right-0 z-10 flex h-20 items-center justify-around border-t-4 border-border-dark bg-surface shadow-pixel-container">
        <button 
          className={`flex flex-col items-center justify-center gap-1 p-2 transition-colors ${isNotes ? 'text-primary' : 'text-text-light/70'}`}
          onClick={() => handleNavClick('notes')}
        >
          <span className="material-symbols-outlined text-3xl">shield_lock</span>
          <span className="text-[10px] font-medium uppercase">Pixel Keep</span>
        </button>
        <button 
          className={`flex flex-col items-center justify-center gap-1 p-2 transition-colors ${isTasks ? 'text-primary' : 'text-text-light/70'}`}
          onClick={() => handleNavClick('tasks')}
        >
          <span className="material-symbols-outlined text-3xl">task_alt</span>
          <span className="text-[10px] font-medium uppercase">Quest Log</span>
        </button>
      </nav>
      
      <PixelToast />
    </div>
  );
};
