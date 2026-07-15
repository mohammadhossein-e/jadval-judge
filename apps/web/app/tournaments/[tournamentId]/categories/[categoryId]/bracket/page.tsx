import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default async function BracketPage({
  params,
}: {
  params: Promise<{ tournamentId: string; categoryId: string }>;
}) {
  const { tournamentId, categoryId } = await params;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bracket</h1>
          <p className="text-muted-foreground">Male Kata Under 12 - Single Elimination</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/tournaments/${tournamentId}/categories/${categoryId}/public`}
            target="_blank"
          >
            <Button variant="outline">View Public</Button>
          </Link>
          <Button variant="destructive">Reset Bracket</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Round 1</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2 rounded border p-3">
              <div className="font-medium">Match 1</div>
              <div className="text-sm">Tanaka Kenji vs BYE</div>
              <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                Auto-advance
              </span>
            </div>
            <div className="space-y-2 rounded border p-3">
              <div className="font-medium">Match 2</div>
              <div className="text-sm">Suzuki Yuki vs Yamamoto Takeshi</div>
              <Button size="sm" className="w-full">
                Select Winner
              </Button>
            </div>
            <div className="space-y-2 rounded border p-3">
              <div className="font-medium">Match 3</div>
              <div className="text-sm">Sato Hiroshi vs Watanabe Akiko</div>
              <Button size="sm" className="w-full">
                Select Winner
              </Button>
            </div>
            <div className="space-y-2 rounded border p-3">
              <div className="font-medium">Match 4</div>
              <div className="text-sm">Kimura Ryo vs Kobayashi Yui</div>
              <Button size="sm" className="w-full">
                Select Winner
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Semifinals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 rounded border p-3 opacity-50">
              <div className="font-medium">Match 5</div>
              <div className="text-sm">Waiting for Round 1 results...</div>
            </div>
            <div className="space-y-2 rounded border p-3 opacity-50">
              <div className="font-medium">Match 6</div>
              <div className="text-sm">Waiting for Round 1 results...</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Final</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 rounded border p-3 opacity-50">
            <div className="font-medium">Match 7</div>
            <div className="text-sm">Waiting for Semifinal results...</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
