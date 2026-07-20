'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { TournamentType } from '@jadval/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Plus } from 'lucide-react';
import { CategoryForm, type CategoryFormData } from './CategoryForm';
import { CategoryList } from './CategoryList';
import { TOURNAMENT_TYPE_OPTIONS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { getRepository } from '@/lib/repositories';

interface LocalCategory extends CategoryFormData {
  localId: string;
}

export function CreateTournamentForm() {
  const router = useRouter();
  const nextId = useRef(0);

  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [organization, setOrganization] = useState('');
  const [tournamentType, setTournamentType] = useState<TournamentType>('kata');
  const [categories, setCategories] = useState<LocalCategory[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  const isFormValid =
    name.trim().length > 0 && date.length > 0 && categories.length > 0;

  function handleAddCategory(data: CategoryFormData): void {
    const newCategory: LocalCategory = {
      ...data,
      localId: `cat-${++nextId.current}`,
    };
    setCategories((prev) => [...prev, newCategory]);
    setShowCategoryForm(false);
    toast.success('Category added');
  }

  function handleEditCategory(data: CategoryFormData): void {
    if (!editingCategoryId) return;
    setCategories((prev) =>
      prev.map((c) => (c.localId === editingCategoryId ? { ...c, ...data } : c)),
    );
    setEditingCategoryId(null);
    toast.success('Category updated');
  }

  function handleRemoveCategory(id: string): void {
    setCategories((prev) => prev.filter((c) => c.localId !== id));
    if (editingCategoryId === id) setEditingCategoryId(null);
    toast.success('Category removed');
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    console.log('[CreateTournamentForm] handleSubmit START');
    e.preventDefault();
    if (!isFormValid) {
      console.log('[CreateTournamentForm] BLOCKED: form invalid');
      return;
    }
    console.log('[CreateTournamentForm] validation passed');

    setIsSubmitting(true);
    try {
      const repo = getRepository();
      console.log('[CreateTournamentForm] BEFORE createTournament');
      const tournament = repo.createTournament({
        name: name.trim(),
        date,
        organization: organization.trim() || null,
        tournamentType,
        categories: categories.map((c) => ({
          name: c.name,
          gender: c.gender,
          ageGroup: c.ageGroup,
          beltLevel: c.beltLevel,
        })),
      });
      console.log('[CreateTournamentForm] AFTER createTournament, id:', tournament.id);
      toast.success('Tournament created');
      console.log('[CreateTournamentForm] BEFORE router.push to', `/tournaments/${tournament.id}`);
      router.push(`/tournaments/${tournament.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      console.error('[CreateTournamentForm] ERROR:', message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const editingCategory = editingCategoryId
    ? categories.find((c) => c.localId === editingCategoryId)
    : undefined;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tournament Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="tournament-name">Tournament Name *</Label>
              <Input
                id="tournament-name"
                placeholder="e.g. Spring Open 2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tournament-date">Date *</Label>
              <Input
                id="tournament-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tournament-organization">Organization</Label>
              <Input
                id="tournament-organization"
                placeholder="e.g. Tokyo Karate Federation"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>Tournament Type</Label>
              <div className="flex gap-1 rounded-lg border border-input p-0.5">
                {TOURNAMENT_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTournamentType(opt.value)}
                    className={cn(
                      'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                      tournamentType === opt.value
                        ? 'bg-secondary text-secondary-foreground'
                        : 'text-muted-foreground hover:bg-muted/50',
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CategoryList
            categories={categories.map((c) => ({
              id: c.localId,
              name: c.name,
              gender: c.gender,
              ageGroup: c.ageGroup,
              beltLevel: c.beltLevel,
            }))}
            onEdit={(id) => setEditingCategoryId(id)}
            onRemove={handleRemoveCategory}
          />

          {editingCategory && (
            <>
              <Separator />
              <CategoryForm
                initialData={{
                  name: editingCategory.name,
                  gender: editingCategory.gender,
                  ageGroup: editingCategory.ageGroup,
                  beltLevel: editingCategory.beltLevel,
                }}
                onSubmit={handleEditCategory}
                onCancel={() => setEditingCategoryId(null)}
                submitLabel="Save Changes"
              />
            </>
          )}

          {showCategoryForm && !editingCategoryId && (
            <>
              <Separator />
              <CategoryForm onSubmit={handleAddCategory} onCancel={() => setShowCategoryForm(false)} />
            </>
          )}

          {!showCategoryForm && !editingCategoryId && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCategoryForm(true)}
            >
              <Plus className="size-4" />
              Add Category
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={!isFormValid || isSubmitting}>
          {isSubmitting ? (
            <>
              <LoadingSpinner size="sm" />
              Creating...
            </>
          ) : (
            'Create Tournament'
          )}
        </Button>
      </div>
    </form>
  );
}
