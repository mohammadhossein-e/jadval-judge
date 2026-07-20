'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { getRepository } from '@/lib/repositories';
import { CategoryForm, type CategoryFormData } from '@/components/tournament/CategoryForm';
import { CategoryList } from '@/components/tournament/CategoryList';
import type { Tournament, Category } from '@jadval/types';
import { Plus } from 'lucide-react';

export default function EditTournamentPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const router = useRouter();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [organization, setOrganization] = useState('');
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [tournamentId, setTournamentId] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ tournamentId: id }) => {
      const repo = getRepository();
      const t = repo.getTournament(id);
      if (t) {
        setTournament(t);
        setTournamentId(id);
        setName(t.name);
        setDate(t.date);
        setOrganization(t.organization ?? '');
        setCategories(repo.listCategories(id));
      }
    });
  }, [params]);

  if (!tournament) {
    return <div className="text-muted-foreground p-6">Loading...</div>;
  }

  const isFormDirty =
    name.trim() !== tournament.name ||
    date !== tournament.date ||
    (organization.trim() || null) !== tournament.organization;

  function handleSaveTournament() {
    if (!name.trim() || !date || !tournamentId) return;
    const repo = getRepository();
    const updated = repo.updateTournament(tournamentId, {
      name: name.trim(),
      date,
      organization: organization.trim() || null,
    });
    setTournament(updated);
    toast.success('Tournament updated');
  }

  function handleAddCategory(data: CategoryFormData) {
    if (!tournamentId) return;
    const repo = getRepository();
    const cat = repo.createCategory(tournamentId, {
      name: data.name,
      gender: data.gender,
      ageGroup: data.ageGroup,
      beltLevel: data.beltLevel,
    });
    setCategories((prev) => [...prev, cat]);
    setShowCategoryForm(false);
    toast.success('Category added');
  }

  function handleEditCategory(data: CategoryFormData) {
    if (!editingCategoryId) return;
    const repo = getRepository();
    const updated = repo.updateCategory(editingCategoryId, { name: data.name });
    setCategories((prev) => prev.map((c) => (c.id === editingCategoryId ? updated : c)));
    setEditingCategoryId(null);
    toast.success('Category updated');
  }

  function handleRemoveCategory(id: string) {
    const repo = getRepository();
    repo.deleteCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
    if (editingCategoryId === id) setEditingCategoryId(null);
    toast.success('Category removed');
  }

  function requiresDeleteConfirmation(id: string) {
    const cat = categories.find((c) => c.id === id);
    return !!cat && cat.status !== 'SETUP';
  }

  const editingCategory = editingCategoryId
    ? categories.find((c) => c.id === editingCategoryId)
    : undefined;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manage Tournament</h1>
        <p className="text-muted-foreground">Update tournament details and manage categories</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tournament Details</CardTitle>
          <CardDescription>Modify the information for your tournament</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tournament Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="organization">Organization (optional)</Label>
            <Input
              id="organization"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button onClick={handleSaveTournament} disabled={!name.trim() || !date || !isFormDirty}>
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>
            {categories.length} {categories.length === 1 ? 'category' : 'categories'} in this tournament
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <CategoryList
            categories={categories.map((c) => ({
              id: c.id,
              name: c.name,
              gender: c.gender,
              ageGroup: c.ageGroup,
              beltLevel: c.beltLevel,
            }))}
            onEdit={(id) => setEditingCategoryId(id)}
            onRemove={handleRemoveCategory}
            requiresDeleteConfirmation={requiresDeleteConfirmation}
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
    </div>
  );
}
