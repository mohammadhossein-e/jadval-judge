import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ChampionBannerProps {
  name: string;
}

export function ChampionBanner({ name }: ChampionBannerProps) {
  return (
    <Card className="border-green-500 bg-green-50">
      <CardHeader>
        <CardTitle className="text-green-700">Champion</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-lg font-bold text-green-800">{name}</div>
      </CardContent>
    </Card>
  );
}
