import React from 'react';

interface TouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  fullWidth?: boolean;
}

export function TouchButton({ variant = 'primary', fullWidth = false, className = '', children, ...props }: TouchButtonProps) {
  const base = 'min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg font-medium text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed px-4';

  const variants = {
    primary:   'bg-brand-700 text-white hover:opacity-90',
    secondary: 'bg-brand-100 text-brand-900 border border-brand-200 hover:opacity-90',
    ghost:     'text-slate-500 hover:text-slate-800 hover:bg-brand-100',
    danger:    'text-red-500 hover:text-red-700 hover:bg-red-50',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
