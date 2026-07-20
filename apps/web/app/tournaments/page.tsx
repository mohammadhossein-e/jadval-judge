'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getRepository } from '@/lib/repositories';

interface TournamentListItem {
  id: string;
  name: string;
  date: string;
  organization: string | null;
  categoryCount: number;
}

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<TournamentListItem[]>([]);

  useEffect(() => {
    console.log('[TournamentsPage] useEffect FIRED');
    void Promise.resolve().then(() => {
      console.log('[TournamentsPage] BEFORE getRepository');
      const repo = getRepository();
      console.log('[TournamentsPage] BEFORE listTournaments');
      const all = repo.listTournaments();
      console.log('[TournamentsPage] AFTER listTournaments, count:', all.length);
      setTournaments(
        all.map((t) => ({
          ...t,
          categoryCount: repo.listCategories(t.id).length,
        })),
      );
      console.log('[TournamentsPage] setTournaments called with', all.length, 'items');
    });
  }, []);

  console.log('[TournamentsPage] RENDER, tournaments count:', tournaments.length);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tournaments</h1>
          <p className="text-muted-foreground">Manage your karate tournaments</p>
        </div>
        <Link href="/tournaments/new">
          <Button>Create Tournament</Button>
        </Link>
      </div>

      {tournaments.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No tournaments yet. Create your first tournament to get started.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tournaments.map((t) => (
          <Link key={t.id} href={`/tournaments/${t.id}`}>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>{t.name}</CardTitle>
                <CardDescription>
                  {t.date}
                  {t.organization ? ` • ${t.organization}` : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t.categoryCount} {t.categoryCount === 1 ? 'category' : 'categories'}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
