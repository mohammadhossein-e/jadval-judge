import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { BracketContainer } from '@/components/bracket/BracketContainer';

export default async function BracketPage({
  params,
}: {
  params: Promise<{ tournamentId: string; categoryId: string }>;
}) {
  const { tournamentId, categoryId } = await params;

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <BracketContainer tournamentId={tournamentId} categoryId={categoryId} />
    </Suspense>
  );
}
