'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CategoryCompetitorsManager } from '@/components/competitor/CategoryCompetitorsManager';
import { getRepository } from '@/lib/repositories';

export default function CategoryManagementPage({
  params,
}: {
  params: Promise<{ tournamentId: string; categoryId: string }>;
}) {
  const [resolved, setResolved] = useState<{ tournamentId: string; categoryId: string } | 'not-found' | null>(
    null,
  );
  const [categoryName, setCategoryName] = useState('Category');

  useEffect(() => {
    params.then(({ tournamentId, categoryId }) => {
      const cat = getRepository().getCategory(categoryId);
      if (cat) {
        setResolved({ tournamentId, categoryId });
        setCategoryName(cat.name);
      } else {
        setResolved('not-found');
        setCategoryName('Category');
      }
    });
  }, [params]);

  if (resolved === null) {
    return <div className="text-muted-foreground p-6">Loading...</div>;
  }

  if (resolved === 'not-found') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <h1 className="text-3xl font-bold">Category not found</h1>
        <p className="text-muted-foreground">The category you are looking for does not exist.</p>
        <Link href="/tournaments">
          <Button>Back to Tournaments</Button>
        </Link>
      </div>
    );
  }

  return (
    <CategoryCompetitorsManager
      tournamentId={resolved.tournamentId}
      categoryId={resolved.categoryId}
      categoryName={categoryName}
    />
  );
}
