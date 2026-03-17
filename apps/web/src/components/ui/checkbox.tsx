'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, onChange, checked, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);
      onCheckedChange?.(e.target.checked);
    };

    return (
      <label className={cn('inline-flex items-center cursor-pointer', className)}>
        <input
          type="checkbox"
          ref={ref}
          checked={checked}
          onChange={handleChange}
          className="sr-only peer"
          {...props}
        />
        <div className="h-4 w-4 rounded border border-input bg-background peer-checked:bg-primary peer-checked:border-primary flex items-center justify-center transition-colors">
          <Check className={cn('h-3 w-3 text-primary-foreground', checked ? 'opacity-100' : 'opacity-0')} />
        </div>
      </label>
    );
  },
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
