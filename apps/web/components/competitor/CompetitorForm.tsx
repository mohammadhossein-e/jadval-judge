'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface CompetitorFormData {
  name: string;
  club: string;
  seed: number | null;
}

interface CompetitorFormProps {
  initialData?: CompetitorFormData;
  existingNames: string[];
  onSubmit: (data: CompetitorFormData) => void;
  onCancel: () => void;
  submitLabel?: string;
}

export function CompetitorForm({
  initialData,
  existingNames,
  onSubmit,
  onCancel,
  submitLabel = 'Add Competitor',
}: CompetitorFormProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [club, setClub] = useState(initialData?.club ?? '');
  const [seed, setSeed] = useState(initialData?.seed?.toString() ?? '');

  const trimmedName = name.trim();
  const isNameEmpty = trimmedName.length === 0;
  const isNameDuplicate =
    trimmedName.length > 0 &&
    existingNames.some(
      (n) => n.toLowerCase() === trimmedName.toLowerCase() && n !== initialData?.name,
    );
  const isClubEmpty = club.trim().length === 0;
  const parsedSeed = seed ? parseInt(seed, 10) : null;
  const isSeedOutOfRange = parsedSeed !== null && (parsedSeed < 1 || parsedSeed > 128 || isNaN(parsedSeed));
  const isValid = !isNameEmpty && !isNameDuplicate && !isClubEmpty && !isSeedOutOfRange;

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault();
    if (!isValid) return;
    onSubmit({
      name: trimmedName,
      club: club.trim(),
      seed: parsedSeed,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="competitor-name">Full Name *</Label>
          <Input
            id="competitor-name"
            placeholder="e.g. Tanaka Kenji"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={isNameDuplicate}
          />
          {isNameDuplicate && (
            <p className="text-xs text-destructive">
              A competitor with this name already exists in this category.
            </p>
          )}
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="competitor-club">Club / Dojo *</Label>
          <Input
            id="competitor-club"
            placeholder="e.g. Tokyo Karate Club"
            value={club}
            onChange={(e) => setClub(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="competitor-seed">Seed (optional)</Label>
          <Input
            id="competitor-seed"
            type="number"
            min={1}
            max={128}
            placeholder="e.g. 1"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            aria-invalid={isSeedOutOfRange}
          />
          {isSeedOutOfRange && (
            <p className="text-xs text-destructive">
              Seed must be between 1 and 128.
            </p>
          )}
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
