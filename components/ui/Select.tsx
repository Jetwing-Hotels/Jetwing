import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps {
  options: Array<{ value: string | number; label: string }>;
  value?: string | number;
  onChange?: (value: string | number) => void;
  placeholder?: string;
  label?: string;
}

export function Select({ options, value, onChange, placeholder = 'Select...', label }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = options.find(opt => opt.value === value)?.label || placeholder;

  return (
    <div ref={ref} className="relative">
      {label && <label className="block text-sm font-medium mb-2" style={{ color: '#1a1a1a' }}>{label}</label>}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 rounded-lg border text-left flex items-center justify-between transition-all"
        style={{
          borderColor: isOpen ? '#8B9E23' : '#E5E5E5',
          backgroundColor: '#ffffff',
          color: '#333'
        }}
      >
        <span>{selectedLabel}</span>
        <ChevronDown className="w-4 h-4" style={{ color: '#999' }} />
      </button>

      {isOpen && (
        <div 
          className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50"
          style={{ borderColor: '#E5E5E5' }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange?.(opt.value);
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg transition-colors"
              style={{
                color: value === opt.value ? '#8B9E23' : '#333',
                fontWeight: value === opt.value ? 'bold' : 'normal'
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
