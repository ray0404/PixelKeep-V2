import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { PixelButton } from '../components/ui/PixelButton';
import { PixelInput } from '../components/ui/PixelInput';

export const Unlock: React.FC = () => {
  const [password, setPassword] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { unlock } = useAuthStore();
  const settings = useSettingsStore();

  const isAmber = settings.theme === 'AmberConsole';

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const success = await unlock(password);
      if (success) {
        const redirect = searchParams.get('redirect');
        if (redirect) {
          // Reconstruct search params excluding redirect
          const params = new URLSearchParams(searchParams);
          params.delete('redirect');
          const search = params.toString();
          navigate(`${redirect}${search ? '?' + search : ''}`);
        }
      } else {
        alert('Wrong password.');
      }
    } catch (err: any) {
      console.error('Unlock error:', err);
      alert(`The Ritual Failed: ${err.message}`);
    }
  };

  return (
    <div className={`relative flex min-h-screen w-full flex-col items-center justify-center p-4 antialiased ${
      isAmber 
        ? `ac-screen ${settings.amberBloom ? 'ac-bloom' : ''} ${settings.amberCrt ? 'ac-crt' : ''} ${settings.amberAfterglow ? 'ac-afterglow' : ''}`
        : 'bg-background-dark'
    }`}>
      {isAmber && settings.amberBloom && <span className="ac-mesh" />}
      {isAmber && settings.amberCrt && <span className="ac-retrace" />}
      {isAmber && settings.amberAfterglow && <span className="ac-persist" />}

      <form 
        onSubmit={handleUnlock}
        className={`flex flex-col items-center gap-4 max-w-sm w-full z-10 ${
          isAmber
            ? 'ac-panel p-8'
            : 'rounded border-2 border-border-light bg-surface p-8 shadow-pixel-container'
        }`}
      >
        {isAmber && <span className="ac-panel__title">SYS.AUTH // TERMINAL LOCK</span>}
        <span className="material-symbols-outlined text-6xl text-primary">shield_lock</span>
        <h1 className="text-lg font-bold uppercase text-primary text-shadow-pixel">Pixel Keep</h1>
        <p className="text-xs text-text-meta text-center">
          {isAmber ? 'ENTER DECRYPTION KEY TO AUTHORIZE' : 'Enter your password to unlock.'}
        </p>
        <PixelInput 
          type="password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="text-center" 
          placeholder={isAmber ? "PASSCODE..." : "Your secret key..."}
          required
          autoFocus
        />
        <PixelButton type="submit" className="h-14 w-full text-sm uppercase">
          {isAmber ? 'AUTHORIZE / UNLOCK' : 'Unlock'}
        </PixelButton>
      </form>
    </div>
  );
};
