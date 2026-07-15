import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default async function EditTournamentPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  await params;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Tournament</h1>
        <p className="text-muted-foreground">Update tournament details</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tournament Details</CardTitle>
          <CardDescription>Modify the information for your tournament</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tournament Name</Label>
            <Input id="name" defaultValue="Spring Open 2026" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" defaultValue="2026-03-15" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="organization">Organization (optional)</Label>
            <Input id="organization" defaultValue="Tokyo Karate Federation" />
          </div>
          <div className="flex justify-end gap-4">
            <Button variant="outline">Cancel</Button>
            <Button>Save Changes</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
