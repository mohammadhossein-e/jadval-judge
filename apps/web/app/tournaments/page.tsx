import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TournamentsPage() {
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Spring Open 2026</CardTitle>
            <CardDescription>March 15, 2026 • Tokyo Karate Center</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">2 categories • 24 competitors</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
