import { useMemo } from 'react';
import type { EngineBracket, EngineMatch } from '@jadval/bracket-engine';
import { getRoundLabel } from '@/lib/bracket-labels';
import { TreeMatch } from './TreeMatch';

const MATCH_HEIGHT = 80;
const MATCH_GAP = 20;
const CELL_HEIGHT = MATCH_HEIGHT + MATCH_GAP;
const MATCH_WIDTH = 200;
const CONNECTOR_WIDTH = 48;
const ROUND_PADDING_Y = 32;
const ROUND_SPACING = 0;

interface BracketTreeProps {
  bracket: EngineBracket;
  selectedMatchId: string | null;
  onSelectMatch: (matchId: string | null) => void;
  onResolveWinner: (matchId: string, winnerId: string) => void;
  onUndoMatch: (matchId: string) => void;
  canResolveMatch: (matchId: string) => boolean;
  canUndoMatch: (matchId: string) => boolean;
}

interface RoundData {
  round: number;
  matches: EngineMatch[];
  positions: Map<string, number>;
}

function computeLayout(bracket: EngineBracket): RoundData[] {
  const roundGroups = new Map<number, EngineMatch[]>();
  for (const match of bracket.matches) {
    const group = roundGroups.get(match.round);
    if (group) {
      group.push(match);
    } else {
      roundGroups.set(match.round, [match]);
    }
  }
  for (const group of roundGroups.values()) {
    group.sort((a, b) => a.position - b.position);
  }

  const rounds: RoundData[] = [];

  for (let r = 1; r <= bracket.totalRounds; r++) {
    const matches = roundGroups.get(r) ?? [];
    const positions = new Map<string, number>();

    if (r === 1) {
      for (let i = 0; i < matches.length; i++) {
        positions.set(matches[i].id, ROUND_PADDING_Y + i * CELL_HEIGHT);
      }
    } else {
      const prevRound = rounds[r - 2];
      for (const match of matches) {
        const childAId = `R${r - 1}P${match.position * 2}`;
        const childBId = `R${r - 1}P${match.position * 2 + 1}`;
        const yA = prevRound.positions.get(childAId);
        const yB = prevRound.positions.get(childBId);

        if (yA !== undefined && yB !== undefined) {
          positions.set(match.id, (yA + yB) / 2);
        } else if (yA !== undefined) {
          positions.set(match.id, yA);
        } else if (yB !== undefined) {
          positions.set(match.id, yB);
        } else {
          positions.set(match.id, ROUND_PADDING_Y);
        }
      }
    }

    rounds.push({ round: r, matches, positions });
  }

  return rounds;
}

function ConnectorColumn({
  leftRound,
  rightRound,
}: {
  leftRound: RoundData;
  rightRound: RoundData;
}) {
  const halfMatch = MATCH_HEIGHT / 2;

  const forks = useMemo(() => {
    const result: Array<{
      yA: number;
      yB: number;
      midY: number;
    }> = [];

    for (const parentMatch of rightRound.matches) {
      const childAId = `R${leftRound.round}P${parentMatch.position * 2}`;
      const childBId = `R${leftRound.round}P${parentMatch.position * 2 + 1}`;
      const yA = leftRound.positions.get(childAId);
      const yB = leftRound.positions.get(childBId);

      if (yA !== undefined && yB !== undefined) {
        result.push({ yA, yB, midY: (yA + yB) / 2 });
      }
    }

    return result;
  }, [leftRound, rightRound]);

  return (
    <div
      className="relative shrink-0"
      style={{
        width: `${CONNECTOR_WIDTH}px`,
        minHeight: '100%',
      }}
    >
      {forks.map((fork, i) => (
        <div key={i} className="absolute inset-0 pointer-events-none">
          {/* Horizontal stub from child A center to midpoint */}
          <div
            className="absolute bg-border"
            style={{
              left: 0,
              top: `${fork.yA + halfMatch - 1}px`,
              width: '50%',
              height: '2px',
            }}
          />
          {/* Horizontal stub from child B center to midpoint */}
          <div
            className="absolute bg-border"
            style={{
              left: 0,
              top: `${fork.yB + halfMatch - 1}px`,
              width: '50%',
              height: '2px',
            }}
          />
          {/* Vertical bar connecting the two stubs */}
          <div
            className="absolute bg-border"
            style={{
              left: 'calc(50% - 1px)',
              top: `${fork.yA + halfMatch}px`,
              width: '2px',
              height: `${fork.yB - fork.yA}px`,
            }}
          />
          {/* Horizontal stub from midpoint to parent center */}
          <div
            className="absolute bg-border"
            style={{
              left: '50%',
              top: `${fork.midY + halfMatch - 1}px`,
              width: '50%',
              height: '2px',
            }}
          />
        </div>
      ))}
    </div>
  );
}

export function BracketTree({
  bracket,
  selectedMatchId,
  onSelectMatch,
  onResolveWinner,
  onUndoMatch,
  canResolveMatch,
  canUndoMatch,
}: BracketTreeProps) {
  const rounds = useMemo(() => computeLayout(bracket), [bracket]);

  const totalHeight = useMemo(() => {
    const r1 = rounds[0];
    if (!r1 || r1.matches.length === 0) return 0;
    const maxPos = Math.max(...r1.positions.values());
    return maxPos + MATCH_HEIGHT + ROUND_PADDING_Y;
  }, [rounds]);

  const isFinalRound = (round: number) => round === bracket.totalRounds;

  return (
    <div
      className="flex items-start overflow-x-auto overflow-y-auto pb-4"
      style={{
        maxHeight: '80vh',
        ['--bracket-match-height' as string]: `${MATCH_HEIGHT}px`,
        ['--bracket-match-width' as string]: `${MATCH_WIDTH}px`,
        ['--bracket-connector-width' as string]: `${CONNECTOR_WIDTH}px`,
      }}
    >
      {rounds.map((roundData, i) => (
        <div
          key={roundData.round}
          className="flex items-start shrink-0"
          style={{ gap: `${ROUND_SPACING}px` }}
        >
          {/* Round column */}
          <div className="flex flex-col items-center shrink-0">
            <h3
              className={`text-center whitespace-nowrap px-2 mb-3 ${
                isFinalRound(roundData.round)
                  ? 'text-sm font-bold text-foreground'
                  : 'text-xs font-semibold text-muted-foreground'
              }`}
            >
              {getRoundLabel(roundData.round, bracket.totalRounds)}
            </h3>
            <div
              className="relative shrink-0"
              style={{
                width: `${MATCH_WIDTH}px`,
                minHeight: `${totalHeight - 32}px`,
              }}
            >
              {roundData.matches.map((match) => {
                const top = roundData.positions.get(match.id) ?? 0;
                return (
                  <div
                    key={match.id}
                    className="absolute left-0 z-10"
                    style={{ top: `${top}px` }}
                  >
                    <TreeMatch
                      match={match}
                      isSelected={match.id === selectedMatchId}
                      isResolvable={canResolveMatch(match.id)}
                      isUndoable={canUndoMatch(match.id)}
                      isFinal={isFinalRound(roundData.round)}
                      onSelect={() => onSelectMatch(match.id)}
                      onUndo={(e) => {
                        e.stopPropagation();
                        onUndoMatch(match.id);
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Connector column */}
          {i < rounds.length - 1 && (
            <div className="relative shrink-0 z-0" style={{ width: `${CONNECTOR_WIDTH}px` }}>
              <div
                className="relative"
                style={{
                  width: `${CONNECTOR_WIDTH}px`,
                  minHeight: `${totalHeight - 32}px`,
                }}
              >
                <ConnectorColumn
                  leftRound={roundData}
                  rightRound={rounds[i + 1]}
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
