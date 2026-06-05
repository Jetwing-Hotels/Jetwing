import React from 'react';
import { cn } from '@/lib/utils';
import './button.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ 
  children, 
  className, 
  variant = 'primary', 
  size = 'md', 
  ...props 
}: ButtonProps) {
  const variants = {
    default: "jetwing-btn-primary text-white dark:text-white transition-all duration-200",
    primary: "jetwing-btn-primary text-white dark:text-white transition-all duration-200",
    secondary: "jetwing-btn-secondary text-white dark:text-white transition-all duration-200",
    outline: "jetwing-btn-outline bg-transparent border-2 transition-all duration-200",
    ghost: "jetwing-btn-ghost bg-transparent transition-all duration-200",
    danger: "jetwing-btn-danger text-white transition-all duration-200"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
