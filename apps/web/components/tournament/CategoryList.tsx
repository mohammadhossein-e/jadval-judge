'use client';

import { useState } from 'react';
import type { Gender, AgeGroup, BeltLevel } from '@jadval/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Pencil, Trash2, Tag } from 'lucide-react';
import { GENDER_LABELS, AGE_GROUP_LABELS, BELT_LEVEL_LABELS } from '@/lib/constants';

interface CategoryItem {
  id: string;
  name: string;
  gender: Gender | null;
  ageGroup: AgeGroup | null;
  beltLevel: BeltLevel | null;
}

interface CategoryListProps {
  categories: CategoryItem[];
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
}

function formatTags(
  gender: Gender | null,
  ageGroup: AgeGroup | null,
  beltLevel: BeltLevel | null,
): string[] {
  const tags: string[] = [];
  if (gender) tags.push(GENDER_LABELS[gender]);
  if (ageGroup) tags.push(AGE_GROUP_LABELS[ageGroup]);
  if (beltLevel) tags.push(BELT_LEVEL_LABELS[beltLevel]);
  return tags;
}

export function CategoryList({ categories, onEdit, onRemove }: CategoryListProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  if (categories.length === 0) {
    return (
      <EmptyState
        icon={<Tag className="size-5" />}
        title="No categories yet"
        description="Add at least one category to define competition brackets."
      />
    );
  }

  return (
    <>
      <div className="space-y-2">
        {categories.map((category) => {
          const tags = formatTags(category.gender, category.ageGroup, category.beltLevel);

          return (
            <div
              key={category.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{category.name}</p>
                {tags.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onEdit(category.id)}
                >
                  <Pencil />
                  <span className="sr-only">Edit category</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setPendingDeleteId(category.id)}
                >
                  <Trash2 />
                  <span className="sr-only">Remove category</span>
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null);
        }}
        title="Delete this category?"
        description="This will permanently remove the category and all of its competitors. This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
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
