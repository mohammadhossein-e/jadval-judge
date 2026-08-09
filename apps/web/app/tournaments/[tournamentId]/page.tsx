'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { getRepository } from '@/lib/repositories';
import type { Tournament, Category } from '@jadval/types';
import { Trash2 } from 'lucide-react';

export default function TournamentDashboardPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const router = useRouter();
  const [data, setData] = useState<{ tournament: Tournament; categories: Category[] } | 'not-found' | null>(
    null,
  );
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    params.then(({ tournamentId }) => {
      const repo = getRepository();
      const t = repo.getTournament(tournamentId);
      if (t) {
        setData({ tournament: t, categories: repo.listCategories(t.id) });
      } else {
        setData('not-found');
      }
    });
  }, [params]);

  function handleDeleteTournament() {
    if (data === null || data === 'not-found') return;
    try {
      getRepository().deleteTournament(data.tournament.id);
      setShowDeleteDialog(false);
      toast.success('Tournament deleted');
      router.push('/tournaments');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete tournament');
    }
  }

  if (data === null) {
    return <div className="text-muted-foreground p-6">Loading...</div>;
  }

  if (data === 'not-found') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <h1 className="text-3xl font-bold">Tournament not found</h1>
        <p className="text-muted-foreground">The tournament you are looking for does not exist.</p>
        <Link href="/tournaments">
          <Button>Back to Tournaments</Button>
        </Link>
      </div>
    );
  }

  const { tournament, categories } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{tournament.name}</h1>
          <p className="text-muted-foreground">
            {tournament.date}
            {tournament.organization ? ` • ${tournament.organization}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/tournaments/${tournament.id}/edit`}>
            <Button variant="outline">Edit Tournament</Button>
          </Link>
          <Button type="button" variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="size-4" />
            Delete Tournament
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {categories.map((cat) => (
          <Card key={cat.id}>
            <CardHeader>
              <CardTitle>{cat.name}</CardTitle>
              <CardDescription>{cat.status}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Badge variant="secondary">{cat.status}</Badge>
                <Link href={`/tournaments/${tournament.id}/categories/${cat.id}`}>
                  <Button variant="outline" size="sm">
                    Manage
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}

        {categories.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No categories yet. Create your first category to get started.
            </CardContent>
          </Card>
        )}
      </div>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Tournament?"
        description="This will permanently delete this tournament and its categories, competitors, and tournament data."
        confirmText="Delete Tournament"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleDeleteTournament}
      />
    </div>
  );
}
