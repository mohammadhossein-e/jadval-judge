import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">Karate Tournament Bracket Builder</h1>
        <p className="text-muted-foreground text-lg">
          Create and manage single-elimination brackets for kata tournaments
        </p>
      </div>
      <div className="flex gap-4">
        <Link href="/tournaments">
          <Button size="lg">View Tournaments</Button>
        </Link>
        <Link href="/tournaments/new">
          <Button variant="outline" size="lg">
            Create Tournament
          </Button>
        </Link>
      </div>
    </div>
  );
}
