import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default async function PublicBracketPage({
  params,
}: {
  params: Promise<{ tournamentId: string; categoryId: string }>;
}) {
  await params;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Spring Open 2026</h1>
        <p className="text-muted-foreground">Male Kata Under 12 - Single Elimination</p>
        <Badge className="mt-2">Live</Badge>
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
              <Badge variant="secondary">Completed</Badge>
            </div>
            <div className="space-y-2 rounded border p-3">
              <div className="font-medium">Match 2</div>
              <div className="text-sm">Suzuki Yuki vs Yamamoto Takeshi</div>
              <Badge>In Progress</Badge>
            </div>
            <div className="space-y-2 rounded border p-3">
              <div className="font-medium">Match 3</div>
              <div className="text-sm">Sato Hiroshi vs Watanabe Akiko</div>
              <Badge variant="outline">Pending</Badge>
            </div>
            <div className="space-y-2 rounded border p-3">
              <div className="font-medium">Match 4</div>
              <div className="text-sm">Kimura Ryo vs Kobayashi Yui</div>
              <Badge variant="outline">Pending</Badge>
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
              <div className="text-sm">Waiting for Round 1...</div>
            </div>
            <div className="space-y-2 rounded border p-3 opacity-50">
              <div className="font-medium">Match 6</div>
              <div className="text-sm">Waiting for Round 1...</div>
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
            <div className="text-sm">Waiting for Semifinals...</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
