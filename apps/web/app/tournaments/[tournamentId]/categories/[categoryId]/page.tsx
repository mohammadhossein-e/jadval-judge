'use client';

import { useState, useEffect } from 'react';
import { CategoryCompetitorsManager } from '@/components/competitor/CategoryCompetitorsManager';
import { getRepository } from '@/lib/repositories';

export default function CategoryManagementPage({
  params,
}: {
  params: Promise<{ tournamentId: string; categoryId: string }>;
}) {
  const [resolved, setResolved] = useState<{ tournamentId: string; categoryId: string } | null>(
    null,
  );
  const [categoryName, setCategoryName] = useState('Category');

  useEffect(() => {
    params.then(({ tournamentId, categoryId }) => {
      setResolved({ tournamentId, categoryId });
      const cat = getRepository().getCategory(categoryId);
      setCategoryName(cat?.name ?? 'Category');
    });
  }, [params]);

  if (!resolved) {
    return <div className="text-muted-foreground p-6">Loading...</div>;
  }

  return (
    <CategoryCompetitorsManager
      tournamentId={resolved.tournamentId}
      categoryId={resolved.categoryId}
      categoryName={categoryName}
    />
  );
}
