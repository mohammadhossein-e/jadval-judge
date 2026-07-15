import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function TournamentDashboardPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = await params;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tournament Dashboard</h1>
          <p className="text-muted-foreground">Manage categories and competitors</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/tournaments/${tournamentId}/edit`}>
            <Button variant="outline">Edit Tournament</Button>
          </Link>
          <Link href={`/tournaments/${tournamentId}/categories/new`}>
            <Button>Add Category</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Male Kata Under 12</CardTitle>
            <CardDescription>8 competitors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Badge variant="secondary">Setup</Badge>
              <Link href={`/tournaments/${tournamentId}/categories/1`}>
                <Button variant="outline" size="sm">
                  Manage
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Female Kata 12-14</CardTitle>
            <CardDescription>6 competitors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Badge variant="secondary">Setup</Badge>
              <Link href={`/tournaments/${tournamentId}/categories/2`}>
                <Button variant="outline" size="sm">
                  Manage
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
