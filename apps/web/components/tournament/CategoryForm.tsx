'use client';

import { useState } from 'react';
import type { Gender, AgeGroup, BeltLevel } from '@jadval/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { GENDER_OPTIONS, AGE_GROUP_OPTIONS, BELT_LEVEL_OPTIONS } from '@/lib/constants';
import { cn } from '@/lib/utils';

export interface CategoryFormData {
  name: string;
  gender: Gender | null;
  ageGroup: AgeGroup | null;
  beltLevel: BeltLevel | null;
}

interface CategoryFormProps {
  initialData?: CategoryFormData;
  onSubmit: (data: CategoryFormData) => void;
  onCancel: () => void;
  submitLabel?: string;
}

export function CategoryForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Add Category',
}: CategoryFormProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [gender, setGender] = useState<Gender | null>(initialData?.gender ?? null);
  const [ageGroup, setAgeGroup] = useState<AgeGroup | null>(initialData?.ageGroup ?? null);
  const [beltLevel, setBeltLevel] = useState<BeltLevel | null>(initialData?.beltLevel ?? null);

  const isValid = name.trim().length > 0;

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault();
    if (!isValid) return;
    onSubmit({
      name: name.trim(),
      gender,
      ageGroup,
      beltLevel,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="category-name">Category Name *</Label>
          <Input
            id="category-name"
            placeholder="e.g. Male Kata Under 14"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Gender</Label>
          <div className="flex gap-1 rounded-lg border border-input p-0.5">
            {GENDER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setGender(gender === opt.value ? null : opt.value)}
                className={cn(
                  'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  gender === opt.value
                    ? 'bg-secondary text-secondary-foreground'
                    : 'text-muted-foreground hover:bg-muted/50',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="category-age-group">Age Group</Label>
          <Select
            id="category-age-group"
            value={ageGroup ?? ''}
            onChange={(e) => setAgeGroup((e.target.value as AgeGroup) || null)}
            placeholder="Any age"
          >
            {AGE_GROUP_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="category-belt-level">Belt Level</Label>
          <Select
            id="category-belt-level"
            value={beltLevel ?? ''}
            onChange={(e) => setBeltLevel((e.target.value as BeltLevel) || null)}
            placeholder="All levels"
          >
            {BELT_LEVEL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!isValid}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
