import { CategoryCompetitorsManager } from '@/components/competitor/CategoryCompetitorsManager';

export default async function CategoryManagementPage({
  params,
}: {
  params: Promise<{ tournamentId: string; categoryId: string }>;
}) {
  const { tournamentId, categoryId } = await params;

  return (
    <CategoryCompetitorsManager
      tournamentId={tournamentId}
      categoryId={categoryId}
      categoryName="Male Kata Under 12"
    />
  );
}
