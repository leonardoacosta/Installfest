import React from 'react';

export interface DateRangePickerProps {
  from?: Date;
  to?: Date;
  onChange: (from: Date | undefined, to: Date | undefined) => void;
}

export function DateRangePicker({ from, to, onChange }: DateRangePickerProps) {
  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value ? new Date(e.target.value) : undefined, to);
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(from, e.target.value ? new Date(e.target.value) : undefined);
  };

  return (
    <div className="flex gap-2">
      <input
        type="date"
        value={from?.toISOString().split('T')[0] || ''}
        onChange={handleFromChange}
        className="px-3 py-2 border border-gray-300 rounded-md"
      />
      <span className="self-center">to</span>
      <input
        type="date"
        value={to?.toISOString().split('T')[0] || ''}
        onChange={handleToChange}
        className="px-3 py-2 border border-gray-300 rounded-md"
      />
    </div>
  );
}
