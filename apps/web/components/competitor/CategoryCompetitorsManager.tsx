'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CompetitorForm, type CompetitorFormData } from '@/components/competitor/CompetitorForm';
import { CompetitorList } from '@/components/competitor/CompetitorList';
import { RandomDrawCard, type DrawStatus } from '@/components/competitor/RandomDrawCard';
import { ManualDrawCard, type PlacementStatus } from '@/components/competitor/ManualDrawCard';
import { BracketPreviewCard } from '@/components/competitor/BracketPreviewCard';
import { CategoryHeader } from '@/components/competitor/CategoryHeader';
import { DrawTypeSelector } from '@/components/competitor/DrawTypeSelector';
import { BracketResultSection } from '@/components/competitor/BracketResultSection';
import { BulkAddDialog } from '@/components/competitor/BulkAddDialog';
import { useBracketGeneration } from '@/hooks/useBracketGeneration';
import { useMatchResolution } from '@/hooks/useMatchResolution';
import {
  drawEntriesToPlacements,
  manualSlotsToPlacements,
} from '@/lib/draw';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

const MAX_COMPETITORS = 128;
const MIN_COMPETITORS_FOR_BRACKET = 2;

interface LocalCompetitor extends CompetitorFormData {
  localId: string;
}

interface CategoryCompetitorsManagerProps {
  tournamentId: string;
  categoryId: string;
  categoryName?: string;
}

export function CategoryCompetitorsManager({
  tournamentId,
  categoryId,
  categoryName = 'Category',
}: CategoryCompetitorsManagerProps) {
  const [competitors, setCompetitors] = useState<LocalCompetitor[]>([]);
  const nextIdRef = useRef(1);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [drawType, setDrawType] = useState<'random' | 'manual'>('random');
  const [randomDrawStatus, setRandomDrawStatus] = useState<DrawStatus>({
    hasDraw: false,
    drawResult: null,
  });
  const [manualDrawStatus, setManualDrawStatus] = useState<PlacementStatus>({
    isComplete: false,
    placedCount: 0,
    unplacedCount: 0,
    slots: [],
  });

  const existingNames = useMemo(() => competitors.map((c) => c.name), [competitors]);
  const isAtLimit = competitors.length >= MAX_COMPETITORS;

  const competitorItems = useMemo(
    () => competitors.map((c) => ({ ...c, id: c.localId })),
    [competitors],
  );

  const competitorSignature = useMemo(
    () => competitorItems.map((c) => c.id).sort().join('-'),
    [competitorItems],
  );

  const isDrawReady = drawType === 'random' ? randomDrawStatus.hasDraw : manualDrawStatus.isComplete;

  const {
    bracket,
    isGenerated,
    preview,
    generate,
    reset,
  } = useBracketGeneration(competitorItems, drawType);

  const [prevSignature, setPrevSignature] = useState(competitorSignature);
  if (competitorSignature !== prevSignature) {
    setPrevSignature(competitorSignature);
    setRandomDrawStatus({ hasDraw: false, drawResult: null });
  }

  const [prevDrawType, setPrevDrawType] = useState(drawType);
  if (drawType !== prevDrawType) {
    setPrevDrawType(drawType);
    if (drawType === 'random') {
      setManualDrawStatus({ isComplete: false, placedCount: 0, unplacedCount: 0, slots: [] });
    } else {
      setRandomDrawStatus({ hasDraw: false, drawResult: null });
    }
  }

  const handleAdd = useCallback((data: CompetitorFormData) => {
    const id = nextIdRef.current++;
    setCompetitors((prev) => [...prev, { ...data, localId: `comp-${id}` }]);
    setShowAddForm(false);
    toast.success('Competitor added');
  }, []);

  const handleEdit = useCallback(
    (data: CompetitorFormData) => {
      if (!editingId) return;
      setCompetitors((prev) =>
        prev.map((c) => (c.localId === editingId ? { ...c, ...data } : c)),
      );
      setEditingId(null);
      toast.success('Competitor updated');
    },
    [editingId],
  );

  const handleRemove = useCallback((id: string) => {
    setCompetitors((prev) => prev.filter((c) => c.localId !== id));
    setEditingId((eid) => (eid === id ? null : eid));
    toast.success('Competitor removed');
  }, []);

  const handleMoveUp = useCallback((id: string) => {
    setCompetitors((prev) => {
      const idx = prev.findIndex((c) => c.localId === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  }, []);

  const handleMoveDown = useCallback((id: string) => {
    setCompetitors((prev) => {
      const idx = prev.findIndex((c) => c.localId === id);
      if (idx < 0 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  }, []);

  const handleBulkAdd = useCallback((items: CompetitorFormData[]) => {
    let added = 0;
    let skipped = 0;
    let capped = 0;
    setCompetitors((prev) => {
      const existingLower = new Set(prev.map((c) => c.name.toLowerCase()));
      let id = nextIdRef.current;
      const newItems: LocalCompetitor[] = [];
      for (const item of items) {
        if (existingLower.has(item.name.toLowerCase())) {
          skipped++;
          continue;
        }
        if (prev.length + newItems.length >= MAX_COMPETITORS) {
          capped++;
          continue;
        }
        existingLower.add(item.name.toLowerCase());
        newItems.push({ ...item, localId: `comp-${id++}` });
        added++;
      }
      nextIdRef.current = id;
      return [...prev, ...newItems];
    });
    if (capped > 0) toast.warning(`${capped} competitor${capped === 1 ? '' : 's'} skipped — category limit (${MAX_COMPETITORS}) reached`);
    if (skipped > 0) toast.warning(`${skipped} duplicate${skipped === 1 ? '' : 's'} skipped`);
    if (added > 0) toast.success(`${added} competitor${added === 1 ? '' : 's'} added`);
  }, []);

  const handleRandomDrawStatusChange = useCallback((status: DrawStatus) => {
    setRandomDrawStatus(status);
  }, []);

  const handleManualDrawStatusChange = useCallback((status: PlacementStatus) => {
    setManualDrawStatus(status);
  }, []);

  const handleGenerate = useCallback(() => {
    if (competitorItems.length < MIN_COMPETITORS_FOR_BRACKET) {
      toast.error('At least 2 competitors required');
      return;
    }

    let placements: Map<number, string> | undefined;

    if (drawType === 'random') {
      if (!randomDrawStatus.hasDraw || !randomDrawStatus.drawResult) {
        toast.error('Perform a random draw first');
        return;
      }
      placements = drawEntriesToPlacements(randomDrawStatus.drawResult);
    } else {
      if (!manualDrawStatus.isComplete) {
        toast.error('Place all competitors before generating');
        return;
      }
      placements = manualSlotsToPlacements(manualDrawStatus.slots);
    }

    try {
      generate(placements);
      toast.success('Bracket generated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate bracket');
    }
  }, [competitorItems.length, drawType, randomDrawStatus, manualDrawStatus, generate]);

  const {
    bracket: resolvedBracket,
    champion,
    isComplete,
    resolveWinner,
    undoMatch,
    canResolveMatch,
    canUndoMatch,
  } = useMatchResolution(bracket);

  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  const handleResetBracket = useCallback(() => {
    reset();
    setSelectedMatchId(null);
    toast.success('Bracket reset');
  }, [reset]);

  const editingCompetitor = editingId
    ? competitors.find((c) => c.localId === editingId)
    : undefined;

  void tournamentId;
  void categoryId;

  return (
    <div className="space-y-6">
      <CategoryHeader
        categoryName={categoryName}
        isAtLimit={isAtLimit}
        onAdd={() => setShowAddForm(true)}
        onBulkAdd={() => setShowBulkDialog(true)}
      />

      <Card>
        <CardHeader>
          <CardTitle>Competitors</CardTitle>
          <CardDescription>
            {competitors.length} / {MAX_COMPETITORS} competitors registered
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <CompetitorList
            competitors={competitorItems}
            onEdit={(id) => setEditingId(id)}
            onRemove={handleRemove}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
          />

          {editingCompetitor && (
            <>
              <Separator />
              <CompetitorForm
                initialData={{
                  name: editingCompetitor.name,
                  club: editingCompetitor.club,
                  seed: editingCompetitor.seed,
                }}
                existingNames={existingNames}
                onSubmit={handleEdit}
                onCancel={() => setEditingId(null)}
                submitLabel="Save Changes"
              />
            </>
          )}

          {showAddForm && !editingId && (
            <>
              <Separator />
              <CompetitorForm
                existingNames={existingNames}
                onSubmit={handleAdd}
                onCancel={() => setShowAddForm(false)}
              />
            </>
          )}

          {!showAddForm && !editingId && (
            <Button
              type="button"
              variant="outline"
              disabled={isAtLimit}
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="size-4" />
              Add Competitor
            </Button>
          )}
        </CardContent>
      </Card>

      {competitors.length > 0 && (
        <DrawTypeSelector drawType={drawType} onSelect={setDrawType} />
      )}

      {competitors.length > 0 && (
        <>
          <div hidden={drawType !== 'random'}>
            <RandomDrawCard
              key={`random-${competitorSignature}`}
              competitors={competitorItems}
              onDrawStatusChange={handleRandomDrawStatusChange}
            />
          </div>
          <div hidden={drawType !== 'manual'}>
            <ManualDrawCard
              competitors={competitorItems}
              onPlacementStatusChange={handleManualDrawStatusChange}
            />
          </div>
        </>
      )}

      {competitorItems.length >= MIN_COMPETITORS_FOR_BRACKET && isDrawReady && !isGenerated && (
        <BracketPreviewCard
          preview={preview}
          drawType={drawType}
          onGenerate={handleGenerate}
        />
      )}

      {isGenerated && resolvedBracket && (
        <BracketResultSection
          bracket={resolvedBracket}
          selectedMatchId={selectedMatchId}
          isComplete={isComplete}
          champion={champion}
          onSelectMatch={setSelectedMatchId}
          onResolveWinner={resolveWinner}
          onUndoMatch={undoMatch}
          onResetBracket={handleResetBracket}
          canResolveMatch={canResolveMatch}
          canUndoMatch={canUndoMatch}
        />
      )}

      <BulkAddDialog
        open={showBulkDialog}
        onOpenChange={setShowBulkDialog}
        onAdd={handleBulkAdd}
      />
    </div>
  );
}
