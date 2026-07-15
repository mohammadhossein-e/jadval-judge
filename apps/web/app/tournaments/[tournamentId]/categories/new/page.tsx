import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default async function NewCategoryPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  await params;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Category</h1>
        <p className="text-muted-foreground">Add a new competition category to your tournament</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Category Details</CardTitle>
          <CardDescription>Enter the information for this category</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Category Name</Label>
            <Input id="name" placeholder="e.g. Male Kata Under 12" />
          </div>
          <div className="flex justify-end gap-4">
            <Button variant="outline">Cancel</Button>
            <Button>Create Category</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
