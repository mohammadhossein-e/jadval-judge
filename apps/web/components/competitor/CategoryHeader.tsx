import { Button } from '@/components/ui/button';
import { Plus, ClipboardList } from 'lucide-react';

interface CategoryHeaderProps {
  categoryName: string;
  isAtLimit: boolean;
  onAdd: () => void;
  onBulkAdd: () => void;
}

export function CategoryHeader({
  categoryName,
  isAtLimit,
  onAdd,
  onBulkAdd,
}: CategoryHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">{categoryName}</h1>
        <p className="text-muted-foreground">Manage competitors and generate bracket</p>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          disabled={isAtLimit}
          onClick={onBulkAdd}
        >
          <ClipboardList className="size-4" />
          Bulk Add
        </Button>
        <Button disabled={isAtLimit} onClick={onAdd}>
          <Plus className="size-4" />
          Add Competitor
        </Button>
      </div>
    </div>
  );
}
