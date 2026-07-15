'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import type { CompetitorInput } from '@/lib/draw';
import { Pencil, Trash2, Users, Search, ChevronUp, ChevronDown } from 'lucide-react';

export type CompetitorItem = CompetitorInput;

interface CompetitorListProps {
  competitors: CompetitorItem[];
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
}

export function CompetitorList({
  competitors,
  onEdit,
  onRemove,
  onMoveUp,
  onMoveDown,
}: CompetitorListProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return competitors;
    const q = search.trim().toLowerCase();
    return competitors.filter(
      (c) => c.name.toLowerCase().includes(q) || c.club.toLowerCase().includes(q),
    );
  }, [competitors, search]);

  const pendingCompetitor = competitors.find((c) => c.id === pendingDeleteId);

  if (competitors.length === 0) {
    return (
      <EmptyState
        icon={<Users className="size-5" />}
        title="No competitors yet"
        description="Add competitors individually or paste a list from Excel."
      />
    );
  }

  return (
    <>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or club..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No competitors match &quot;{search}&quot;
          </p>
        )}
        {filtered.map((competitor, index) => (
          <div
            key={competitor.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {index + 1}. {competitor.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">{competitor.club}</p>
            </div>

            <div className="flex shrink-0 items-center gap-0.5">
              {competitor.seed != null && (
                <Badge variant="outline" className="mr-1 text-xs">
                  Seed {competitor.seed}
                </Badge>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                disabled={index === 0}
                onClick={() => onMoveUp(competitor.id)}
              >
                <ChevronUp />
                <span className="sr-only">Move up</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                disabled={index === filtered.length - 1}
                onClick={() => onMoveDown(competitor.id)}
              >
                <ChevronDown />
                <span className="sr-only">Move down</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => onEdit(competitor.id)}
              >
                <Pencil />
                <span className="sr-only">Edit competitor</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => setPendingDeleteId(competitor.id)}
              >
                <Trash2 />
                <span className="sr-only">Remove competitor</span>
              </Button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null);
        }}
        title="Remove competitor"
        description={
          pendingCompetitor
            ? `Are you sure you want to remove "${pendingCompetitor.name}"?`
            : ''
        }
        confirmText="Remove"
        variant="destructive"
        onConfirm={() => {
          if (pendingDeleteId) {
            onRemove(pendingDeleteId);
            setPendingDeleteId(null);
          }
        }}
      />
    </>
  );
}
