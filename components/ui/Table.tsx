import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface TableProps<T> {
  data: T[];
  columns: Array<{
    key: keyof T;
    label: string;
    render?: (value: any, row: T) => React.ReactNode;
    sortable?: boolean;
    width?: string;
  }>;
  onRowClick?: (row: T) => void;
  sortBy?: keyof T;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: keyof T) => void;
}

export function Table<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  sortBy,
  sortOrder = 'asc',
  onSort
}: TableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-lg border" style={{ borderColor: '#E5E5E5' }}>
      <table className="w-full text-sm">
        <thead className="border-b" style={{ backgroundColor: '#f5f5f5', borderColor: '#E5E5E5' }}>
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className="px-6 py-3 text-left font-semibold"
                style={{ color: '#666', width: col.width }}
              >
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => col.sortable && onSort?.(col.key)}>
                  {col.label}
                  {col.sortable && (
                    <div className="flex flex-col gap-0.5">
                      <ChevronUp className={`w-3 h-3 ${sortBy === col.key && sortOrder === 'asc' ? 'text-gray-900' : 'text-gray-300'}`} />
                      <ChevronDown className={`w-3 h-3 ${sortBy === col.key && sortOrder === 'desc' ? 'text-gray-900' : 'text-gray-300'}`} />
                    </div>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr 
              key={idx}
              className="border-b hover:bg-gray-50 transition-colors cursor-pointer"
              style={{ borderColor: '#E5E5E5' }}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <td key={String(col.key)} className="px-6 py-4" style={{ color: '#333' }}>
                  {col.render ? col.render(row[col.key], row) : String(row[col.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
