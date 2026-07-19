import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ChampionBannerProps {
  name: string;
}

export function ChampionBanner({ name }: ChampionBannerProps) {
  return (
    <Card className="border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50 shadow-sm dark:border-amber-700 dark:from-amber-950/40 dark:to-yellow-950/30">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-5 w-5"
          >
            <path
              fillRule="evenodd"
              d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
              clipRule="evenodd"
            />
          </svg>
          Champion
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-xl font-bold tracking-tight text-amber-900 dark:text-amber-200">
          {name}
        </div>
      </CardContent>
    </Card>
  );
}
