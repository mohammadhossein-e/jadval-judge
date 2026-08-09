'use client';

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
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
  drawEntriesToOrder,
  manualSlotsToPlacements,
} from '@/lib/draw';
import { getRepository } from '@/lib/repositories';
import type { Competitor } from '@jadval/types';
import type { EngineBracket } from '@jadval/bracket-engine';
import type { CreateCompetitorInput } from '@/lib/repositories';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const MAX_COMPETITORS = 128;
const MIN_COMPETITORS_FOR_BRACKET = 2;

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
  const [competitors, setCompetitorsState] = useState<Competitor[]>([]);
  const [hydratedBracket, setHydratedBracket] = useState<EngineBracket | null>(null);

  const [prevCategoryId, setPrevCategoryId] = useState<string | null>(null);
  if (categoryId !== prevCategoryId) {
    setPrevCategoryId(categoryId);
    setCompetitorsState(getRepository().listCompetitors(categoryId));
    setHydratedBracket(getRepository().getBracket(categoryId));
  }

  const setCompetitors = useCallback(
    (inputs: CreateCompetitorInput[]) => {
      const persisted = getRepository().setCompetitors(categoryId, inputs);
      setCompetitorsState(persisted);
    },
    [categoryId],
  );

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [showRegenDialog, setShowRegenDialog] = useState(false);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
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

  const competitorSignature = useMemo(
    () => competitors.map((c) => c.id).sort().join('-'),
    [competitors],
  );

  const isDrawReady = drawType === 'random' ? randomDrawStatus.hasDraw : manualDrawStatus.isComplete;

  const {
    bracket,
    isGenerated,
    preview,
    generate,
    reset,
  } = useBracketGeneration(competitors, drawType, hydratedBracket);

  const [prevSignature, setPrevSignature] = useState(competitorSignature);
  if (competitorSignature !== prevSignature) {
    setPrevSignature(competitorSignature);
    setRandomDrawStatus({ hasDraw: false, drawResult: null });
    getRepository().deleteBracket(categoryId);
    setHydratedBracket(null);
    reset();
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
    setCompetitors([
      ...competitors.map((c) => ({ name: c.name, club: c.club, seed: c.seed })),
      { name: data.name, club: data.club, seed: data.seed },
    ]);
    setShowAddForm(false);
    toast.success('Competitor added');
  }, [competitors, setCompetitors]);

  const handleEdit = useCallback(
    (data: CompetitorFormData) => {
      if (!editingId) return;
      setCompetitors(
        competitors.map((c) =>
          c.id === editingId
            ? { name: data.name, club: data.club, seed: data.seed }
            : { name: c.name, club: c.club, seed: c.seed },
        ),
      );
      setEditingId(null);
      toast.success('Competitor updated');
    },
    [editingId, competitors, setCompetitors],
  );

  const handleRemove = useCallback((id: string) => {
    setCompetitors(
      competitors
        .filter((c) => c.id !== id)
        .map((c) => ({ name: c.name, club: c.club, seed: c.seed })),
    );
    setEditingId((eid) => (eid === id ? null : eid));
    toast.success('Competitor removed');
  }, [competitors, setCompetitors]);

  const handleDeleteAll = useCallback(() => {
    setEditingId(null);
    setShowAddForm(false);
    setCompetitors([]);
    toast.success('All competitors removed');
  }, [setCompetitors]);

  const handleMoveUp = useCallback((id: string) => {
    const idx = competitors.findIndex((c) => c.id === id);
    if (idx <= 0) return;
    const next = [...competitors];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    setCompetitors(next.map((c) => ({ name: c.name, club: c.club, seed: c.seed })));
  }, [competitors, setCompetitors]);

  const handleMoveDown = useCallback((id: string) => {
    const idx = competitors.findIndex((c) => c.id === id);
    if (idx < 0 || idx >= competitors.length - 1) return;
    const next = [...competitors];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    setCompetitors(next.map((c) => ({ name: c.name, club: c.club, seed: c.seed })));
  }, [competitors, setCompetitors]);

  const handleBulkAdd = useCallback((items: CompetitorFormData[]) => {
    let added = 0;
    let skipped = 0;
    let capped = 0;
    const existingLower = new Set(competitors.map((c) => c.name.toLowerCase()));
    const inputs: CreateCompetitorInput[] = competitors.map((c) => ({
      name: c.name,
      club: c.club,
      seed: c.seed,
    }));
    for (const item of items) {
      if (existingLower.has(item.name.toLowerCase())) {
        skipped++;
        continue;
      }
      if (inputs.length >= MAX_COMPETITORS) {
        capped++;
        continue;
      }
      existingLower.add(item.name.toLowerCase());
      inputs.push({ name: item.name, club: item.club, seed: item.seed });
      added++;
    }
    setCompetitors(inputs);
    if (capped > 0) toast.warning(`${capped} competitor${capped === 1 ? '' : 's'} skipped — category limit (${MAX_COMPETITORS}) reached`);
    if (skipped > 0) toast.warning(`${skipped} duplicate${skipped === 1 ? '' : 's'} skipped`);
    if (added > 0) toast.success(`${added} competitor${added === 1 ? '' : 's'} added`);
  }, [competitors, setCompetitors]);

  const handleRandomDrawStatusChange = useCallback((status: DrawStatus) => {
    setRandomDrawStatus(status);
  }, []);

  const handleManualDrawStatusChange = useCallback((status: PlacementStatus) => {
    setManualDrawStatus(status);
  }, []);

  const performGenerate = useCallback(() => {
    if (competitors.length < MIN_COMPETITORS_FOR_BRACKET) {
      toast.error('At least 2 competitors required');
      return;
    }

    let generateInput: { placements?: Map<number, string>; placementOrder?: string[] } = {};

    if (drawType === 'random') {
      if (!randomDrawStatus.hasDraw || !randomDrawStatus.drawResult) {
        toast.error('Perform a random draw first');
        return;
      }
      generateInput = { placementOrder: drawEntriesToOrder(randomDrawStatus.drawResult) };
    } else {
      if (!manualDrawStatus.isComplete) {
        toast.error('Place all competitors before generating');
        return;
      }
      generateInput = { placements: manualSlotsToPlacements(manualDrawStatus.slots) };
    }

    try {
      const generatedBracket = generate(generateInput);
      getRepository().saveBracket(categoryId, generatedBracket);
      toast.success('Bracket generated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate bracket');
    }
  }, [competitors.length, drawType, randomDrawStatus, manualDrawStatus, generate, categoryId]);

  const handleGenerateClick = useCallback(() => {
    if (isGenerated) {
      setShowRegenDialog(true);
    } else {
      performGenerate();
    }
  }, [isGenerated, performGenerate]);

  const handleBracketChange = useCallback(
    (bracket: EngineBracket) => {
      getRepository().saveBracket(categoryId, bracket);
    },
    [categoryId],
  );

  const {
    bracket: resolvedBracket,
    champion,
    isComplete,
    resolveWinner,
    undoMatch,
    canResolveMatch,
    canUndoMatch,
  } = useMatchResolution(bracket, handleBracketChange);

  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  const handleResetBracket = useCallback(() => {
    reset();
    setSelectedMatchId(null);
    getRepository().deleteBracket(categoryId);
    toast.success('Bracket reset');
  }, [reset, categoryId]);

  void tournamentId;

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
          <CardAction>
            <Button
              type="button"
              variant="destructive"
              disabled={competitors.length === 0}
              onClick={() => setShowDeleteAllDialog(true)}
            >
              <Trash2 className="size-4" />
              Delete All
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-4">
          <CompetitorList
            competitors={competitors}
            editingId={editingId}
            existingNames={existingNames}
            onEdit={(id) => setEditingId(id)}
            onEditSave={handleEdit}
            onEditCancel={() => setEditingId(null)}
            onRemove={handleRemove}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
          />

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
              competitors={competitors}
              onDrawStatusChange={handleRandomDrawStatusChange}
            />
          </div>
          <div hidden={drawType !== 'manual'}>
            <ManualDrawCard
              competitors={competitors}
              onPlacementStatusChange={handleManualDrawStatusChange}
            />
          </div>
        </>
      )}

      {competitors.length >= MIN_COMPETITORS_FOR_BRACKET && isDrawReady && (
        <BracketPreviewCard
          preview={preview}
          drawType={drawType}
          onGenerate={handleGenerateClick}
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

      <ConfirmDialog
        open={showRegenDialog}
        onOpenChange={setShowRegenDialog}
        title="Regenerate Bracket?"
        description="A bracket has already been generated. Regenerating it will discard all recorded match results. Continue?"
        confirmText="Regenerate"
        cancelText="Cancel"
        onConfirm={() => {
          setShowRegenDialog(false);
          performGenerate();
        }}
      />

      <ConfirmDialog
        open={showDeleteAllDialog}
        onOpenChange={setShowDeleteAllDialog}
        title="Delete all competitors?"
        description="This will remove ALL competitors from this category. This action cannot be undone."
        confirmText="Delete All"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={() => {
          setShowDeleteAllDialog(false);
          handleDeleteAll();
        }}
      />
    </div>
  );
}
