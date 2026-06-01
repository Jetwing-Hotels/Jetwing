import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose?: () => void;
}

export function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const colors = {
    success: { bg: '#d4edda', text: '#155724', icon: CheckCircle },
    error: { bg: '#f8d7da', text: '#721c24', icon: AlertCircle },
    info: { bg: '#d1ecf1', text: '#0c5460', icon: Info },
    warning: { bg: '#fff3cd', text: '#856404', icon: AlertCircle }
  };

  const color = colors[type];
  const Icon = color.icon;

  return (
    <div 
      className="fixed bottom-4 right-4 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg max-w-sm animate-in"
      style={{ backgroundColor: color.bg }}
    >
      <Icon className="w-5 h-5 flex-shrink-0" style={{ color: color.text }} />
      <p style={{ color: color.text }} className="text-sm font-medium">
        {message}
      </p>
      <button 
        onClick={() => setIsVisible(false)}
        className="ml-auto"
      >
        <X className="w-4 h-4" style={{ color: color.text }} />
      </button>
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState<Array<{ id: string } & ToastProps>>([]);

  const showToast = (props: Omit<ToastProps, 'onClose'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(t => [...t, { ...props, id, onClose: () => removeToast(id) }]);
  };

  const removeToast = (id: string) => {
    setToasts(t => t.filter(toast => toast.id !== id));
  };

  return { toasts, showToast };
}
