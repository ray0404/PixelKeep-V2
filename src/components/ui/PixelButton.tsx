import React from 'react';
import { cn } from '../../utils/ui';

interface PixelButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'surface' | 'danger' | 'ghost';
}

export const PixelButton: React.FC<PixelButtonProps> = ({ 
  children, 
  className, 
  variant = 'primary', 
  ...props 
}) => {
  const variants = {
    primary: 'bg-primary text-background-dark border-4 border-border-dark shadow-pixel-container hover:shadow-[6px_6px_0px_0px_#1e1b4b]',
    secondary: 'bg-secondary text-text-light border-4 border-border-dark shadow-pixel-container hover:shadow-[6px_6px_0px_0px_#1e1b4b]',
    surface: 'bg-surface text-text-light border-2 border-border-light shadow-pixel-btn hover:shadow-pixel-btn-hover size-10 flex items-center justify-center p-0',
    danger: 'bg-danger text-text-light border-4 border-border-dark shadow-pixel-container hover:shadow-[6px_6px_0px_0px_#1e1b4b]',
    ghost: 'bg-transparent text-text-light hover:text-primary p-2 flex items-center justify-center border-none shadow-none',
  };

  return (
    <button
      className={cn(
        'flex items-center justify-center transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};
