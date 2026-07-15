'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shuffle, MousePointerClick } from 'lucide-react';

interface DrawTypeSelectorProps {
  drawType: 'random' | 'manual';
  onSelect: (drawType: 'random' | 'manual') => void;
}

export function DrawTypeSelector({ drawType, onSelect }: DrawTypeSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Draw Type</CardTitle>
        <CardDescription>
          Choose how to assign competitors to bracket positions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={drawType === 'random' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => onSelect('random')}
          >
            <Shuffle className="size-4" />
            Random
          </Button>
          <Button
            type="button"
            variant={drawType === 'manual' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => onSelect('manual')}
          >
            <MousePointerClick className="size-4" />
            Manual
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
