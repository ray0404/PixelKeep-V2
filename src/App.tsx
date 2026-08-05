import { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './stores/useAuthStore';
import { Unlock } from './views/Unlock';
import { Layout } from './components/Layout';
import { NotesList } from './views/NotesList';
import { QuestLog } from './views/QuestLog';
import { NoteEditor } from './views/NoteEditor';
import { TaskEditor } from './views/TaskEditor';
import { NoteDetails } from './views/NoteDetails';
import { Settings } from './views/Settings';
import { ShareTarget } from './views/ShareTarget';
import { useSettingsStore } from './stores/useSettingsStore';
import { AlarmManager } from './components/AlarmManager';
import { requestPersistentStorage } from './utils/storage';

import './styles/amber-console.css';

/**
 * Main application content logic.
 * Wraps routes and authentication checks inside the Router context.
 */
const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  const isShareTarget = location.pathname === '/share-target';

  if (!isAuthenticated && !isShareTarget) {
    return <Unlock />;
  }

  return (
    <>
      <AlarmManager />
      <Routes>
        <Route path="/share-target" element={<ShareTarget />} />
        <Route path="/notes" element={<Layout title="Pixel Keep"><NotesList /></Layout>} />
        <Route path="/notes/new" element={<Layout title="New Scroll"><NoteEditor /></Layout>} />
        <Route path="/notes/edit/:id" element={<Layout title="Edit Scroll"><NoteEditor /></Layout>} />
        <Route path="/notes/view/:id" element={<Layout title="View Scroll"><NoteDetails /></Layout>} />
        <Route path="/tasks" element={<Layout title="Quest Log"><QuestLog /></Layout>} />
        <Route path="/tasks/new" element={<Layout title="New Quest"><TaskEditor /></Layout>} />
        <Route path="/tasks/edit/:id" element={<Layout title="Edit Quest"><TaskEditor /></Layout>} />
        <Route path="/settings" element={<Layout title="Settings"><Settings /></Layout>} />
        <Route path="/" element={<Navigate to="/notes" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
};

function App() {
  const { initialize } = useAuthStore();
  const settings = useSettingsStore();

  useEffect(() => {
    initialize();
    requestPersistentStorage();
  }, [initialize]);

  useEffect(() => {
    // Apply theme
    document.body.classList.remove('theme-pixel', 'theme-amber-console');
    if (settings.theme === 'Pixel') {
      document.body.classList.add('theme-pixel');
    } else if (settings.theme === 'AmberConsole') {
      document.body.classList.add('theme-amber-console');
    }

    // Set gas attribute for Amber Console
    document.documentElement.setAttribute('data-ac-gas', settings.amberGas || 'neon');

    // Apply background
    const bgClasses = [
      'bg-solid-black', 'bg-solid-gray', 'bg-midnight', 'bg-forest', 
      'bg-pattern-grid', 'bg-pattern-dots',
      'bg-pixel-geometric', 'bg-pixel-space', 'bg-pixel-rpg-grass', 'bg-pixel-cyber-grid',
      'bg-pixel-dungeon', 'bg-pixel-forest-ground', 'bg-pixel-adventure-water', 'bg-pixel-nes-rpg-map'
    ];
    document.body.classList.remove(...bgClasses);
    if (settings.background !== 'bg-default') {
      document.body.classList.add(settings.background);
    }

    // Update theme-color meta tag for mobile nav controls
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }
    
    // Set a color that matches the theme or background
    const themeColor = settings.background.startsWith('bg-solid') ? '#000000' : settings.primaryColor;
    metaThemeColor.setAttribute('content', themeColor);

    // Apply font
    const fontClasses = ['font-display', 'font-sans', 'font-serif', 'font-mono', 'font-Inter', 'font-Roboto', 'font-Open-Sans', 'font-Exo'];
    document.body.classList.remove(...fontClasses);
    document.body.classList.add(settings.font);

    // Apply CSS variables
    document.documentElement.style.setProperty('--color-primary', settings.primaryColor);
    document.documentElement.style.setProperty('--color-secondary', settings.secondaryColor);
    document.documentElement.style.setProperty('--color-text-light', settings.textColor);
    document.documentElement.style.setProperty('--content-font-size', `${(settings.contentFontSize / 100) * 0.6}rem`);
    
    // Apply interface scale
    document.documentElement.style.fontSize = `${settings.scale}%`;

    // Apply compact mode
    if (settings.compact) {
      document.body.classList.add('compact-mode');
    } else {
      document.body.classList.remove('compact-mode');
    }

    // Apply word wrap
    if (settings.wordWrap) {
      document.body.classList.add('wrap-mode-standard');
      document.body.classList.remove('wrap-mode-break-all');
    } else {
      document.body.classList.add('wrap-mode-break-all');
      document.body.classList.remove('wrap-mode-standard');
    }
  }, [settings]);

  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;