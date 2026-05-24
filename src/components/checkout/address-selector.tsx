'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Address } from '@/types';

type AddressSelectorProps = {
  addresses: Address[];
  selected: Address | null;
  onSelect: (address: Address) => void;
  onAddNew: () => void;
};

export function AddressSelector({
  addresses,
  selected,
  onSelect,
  onAddNew,
}: AddressSelectorProps) {
  const visible = addresses.filter((a) => !a.is_deleted);

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Shipping address
      </h3>

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
          No saved addresses yet. Add one to continue.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {visible.map((address) => {
            const isSelected = selected?.id === address.id;
            return (
              <li key={address.id}>
                <button
                  type="button"
                  onClick={() => onSelect(address)}
                  aria-pressed={isSelected}
                  className={cn(
                    'w-full rounded-2xl border p-4 text-left transition-all',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isSelected
                      ? 'border-foreground bg-card ring-1 ring-foreground'
                      : 'border-border bg-card hover:border-border-strong hover:bg-muted'
                  )}
                >
                  <p className="text-sm font-medium text-foreground">{address.full_address}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {address.city}, {address.state} {address.pincode}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <Button type="button" variant="outline" onClick={onAddNew} className="self-start">
        <Plus />
        Add new address
      </Button>
    </div>
  );
}
