import * as React from 'react';
import { cn } from '@/lib/utils';

function Select({
  className,
  placeholder,
  children,
  ...props
}: React.ComponentProps<'select'> & { placeholder?: string }) {
  return (
    <select
      className={cn(
        'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none',
        'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
        'md:text-sm dark:bg-input/30',
        className,
      )}
      {...props}
    >
      {placeholder && (
        <option value="">{placeholder}</option>
      )}
      {children}
    </select>
  );
}

export { Select };
