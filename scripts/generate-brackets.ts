import { generateBracket } from '../packages/bracket-engine/dist/index.mjs';
import type { EngineCompetitor, EngineBracket, EngineMatch } from '../packages/bracket-engine/dist/index.mjs';
import { writeFileSync } from 'fs';
import { join } from 'path';

const SIZES = [3, 5, 6, 7, 9, 17];

function makeCompetitors(count: number): EngineCompetitor[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `c${i + 1}`,
    name: `Competitor ${i + 1}`,
    seed: i + 1,
  }));
}

function printFirstRound(bracket: EngineBracket, label: string) {
  const round1 = bracket.matches
    .filter((m) => m.round === 1)
    .sort((a, b) => a.position - b.position);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`${label} — First Round (${round1.length} matches, ${bracket.size} bracket)`);
  console.log(`${'='.repeat(60)}`);

  for (const match of round1) {
    const nameA = match.competitorA
      ? `Seed ${match.competitorA.seed ?? '?'} (${match.competitorA.name})`
      : 'BYE';
    const nameB = match.competitorB
      ? `Seed ${match.competitorB.seed ?? '?'} (${match.competitorB.name})`
      : 'BYE';
    console.log(
      `  Match ${match.position + 1}: ${nameA} vs ${nameB}${match.isBye ? ' [BYE]' : ''}`,
    );
  }
}

function groupByRun(arr: number[]): number[][] {
  if (arr.length === 0) return [];
  const runs: number[][] = [[arr[0]]];
  for (let i = 1; i < arr.length; i++) {
    const last = runs[runs.length - 1];
    if (arr[i] === last[last.length - 1] + 1) {
      last.push(arr[i]);
    } else {
      runs.push([arr[i]]);
    }
  }
  return runs;
}

interface BracketData {
  label: string;
  competitorCount: number;
  bracketSize: number;
  rounds: {
    round: number;
    label: string;
    matches: {
      id: string;
      position: number;
      competitorA: { name: string; seed: number | null } | null;
      competitorB: { name: string; seed: number | null } | null;
      winner: { name: string } | null;
      isBye: boolean;
    }[];
  }[];
}

function buildBracketData(bracket: EngineBracket, label: string, competitorCount: number): BracketData {
  const roundGroups = new Map<number, EngineMatch[]>();
  for (const match of bracket.matches) {
    const group = roundGroups.get(match.round);
    if (group) group.push(match);
    else roundGroups.set(match.round, [match]);
  }
  for (const group of roundGroups.values()) {
    group.sort((a, b) => a.position - b.position);
  }

  const totalRounds = bracket.totalRounds;
  const rounds = [];
  for (let r = 1; r <= totalRounds; r++) {
    const matches = (roundGroups.get(r) ?? []).map((m) => ({
      id: m.id,
      position: m.position,
      competitorA: m.competitorA ? { name: m.competitorA.name, seed: m.competitorA.seed } : null,
      competitorB: m.competitorB ? { name: m.competitorB.name, seed: m.competitorB.seed } : null,
      winner: m.winner ? { name: m.winner.name } : null,
      isBye: m.isBye,
    }));

    let roundLabel: string;
    if (totalRounds === 1) {
      roundLabel = 'Final';
    } else if (r === totalRounds) {
      roundLabel = 'Final';
    } else if (r === totalRounds - 1) {
      roundLabel = 'Semi-Final';
    } else if (r === 1) {
      roundLabel = 'First Round';
    } else {
      roundLabel = `Round ${r}`;
    }

    rounds.push({ round: r, label: roundLabel, matches });
  }

  return { label, competitorCount, bracketSize: bracket.size, rounds };
}

// --- Generate all brackets ---
const allData: BracketData[] = [];

for (const size of SIZES) {
  const competitors = makeCompetitors(size);
  const { bracket } = generateBracket(competitors, 'manual');

  const label = `${size} Competitors`;
  printFirstRound(bracket, label);

  const round1 = bracket.matches.filter((m) => m.round === 1).sort((a, b) => a.position - b.position);
  const byeMatches = round1.filter((m) => m.isBye);
  const matchPositions = byeMatches.map((m) => m.position);

  const byeSeeds: number[] = [];
  for (const m of byeMatches) {
    if (m.competitorA && !m.competitorB) byeSeeds.push(m.competitorA.seed!);
    else if (m.competitorB && !m.competitorA) byeSeeds.push(m.competitorB.seed!);
  }
  byeSeeds.sort((a, b) => a - b);

  console.log(`  Seeds with BYEs: [${byeSeeds.join(', ')}]`);
  console.log(`  BYE match positions (0-indexed): [${matchPositions.join(', ')}]`);
  console.log(`  Total BYEs: ${byeMatches.length}`);

  const byeMatchIndices = matchPositions.map((p) => Math.floor(p / 2));
  if (byeMatchIndices.length > 1) {
    const runs = groupByRun(byeMatchIndices);
    const maxRun = Math.max(...runs.map((r) => r.length));
    console.log(`  Consecutive BYE match indices: ${runs.map((r) => `[${r.join(',')}]`).join(' ')} (max consecutive: ${maxRun})`);
  } else if (byeMatchIndices.length === 1) {
    console.log(`  Consecutive BYE branches: 1 (single)`);
  }
  console.log();

  allData.push(buildBracketData(bracket, label, size));
}

// --- Write HTML file ---
const MATCH_HEIGHT = 80;
const MATCH_GAP = 20;
const CELL_HEIGHT = MATCH_HEIGHT + MATCH_GAP;
const MATCH_WIDTH = 220;
const CONNECTOR_WIDTH = 48;
const ROUND_PADDING_Y = 40;

function computeLayout(bracketData: BracketData) {
  const layoutRounds: Array<{ round: number; label: string; matches: BracketData['rounds'][0]['matches']; positions: Map<string, number> }> = [];

  for (const rd of bracketData.rounds) {
    const positions = new Map<string, number>();
    if (rd.round === 1) {
      for (let i = 0; i < rd.matches.length; i++) {
        positions.set(rd.matches[i].id, ROUND_PADDING_Y + i * CELL_HEIGHT);
      }
    } else {
      const prevRound = layoutRounds[rd.round - 2];
      if (prevRound) {
        for (const match of rd.matches) {
          const childAId = `R${rd.round - 1}P${match.position * 2}`;
          const childBId = `R${rd.round - 1}P${match.position * 2 + 1}`;
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
    }
    layoutRounds.push({ ...rd, positions });
  }

  const r1 = layoutRounds[0];
  const totalHeight = r1 && r1.matches.length > 0
    ? Math.max(...r1.positions.values()) + MATCH_HEIGHT + ROUND_PADDING_Y
    : 0;

  return { rounds: layoutRounds, totalHeight };
}

function renderBracketHtml(data: BracketData): string {
  const { rounds, totalHeight } = computeLayout(data);
  const halfMatch = MATCH_HEIGHT / 2;

  let columnsHtml = '';

  for (let i = 0; i < rounds.length; i++) {
    const rd = rounds[i];

    // Round column
    let matchesHtml = '';
    for (const match of rd.matches) {
      const top = rd.positions.get(match.id) ?? 0;
      const slotA = match.competitorA
        ? `<div class="slot ${match.winner?.name === match.competitorA.name ? 'winner' : ''}">
             <span class="seed">${match.competitorA.seed !== null ? match.competitorA.seed : ''}</span>
             <span class="name">${match.competitorA.name}</span>
           </div>`
        : `<div class="slot bye-slot"><span class="name bye-text">BYE</span></div>`;

      const slotB = match.competitorB
        ? `<div class="slot ${match.winner?.name === match.competitorB.name ? 'winner' : ''}">
             <span class="seed">${match.competitorB.seed !== null ? match.competitorB.seed : ''}</span>
             <span class="name">${match.competitorB.name}</span>
           </div>`
        : `<div class="slot bye-slot"><span class="name bye-text">BYE</span></div>`;

      const isBye = match.isBye;
      const isFinal = rd.round === rounds.length;

      matchesHtml += `
        <div class="match ${isBye ? 'bye-match' : ''} ${isFinal ? 'final-match' : ''}"
             style="position:absolute; left:0; top:${top}px; width:${MATCH_WIDTH}px; height:${MATCH_HEIGHT}px;">
          <div class="match-header">${isBye ? 'BYE' : `Match ${match.position + 1}`}</div>
          <div class="match-slots">${slotA}${slotB}</div>
        </div>`;
    }

    columnsHtml += `
      <div class="round-col" style="width:${MATCH_WIDTH}px;">
        <div class="round-label">${rd.label}</div>
        <div class="round-matches" style="position:relative; height:${totalHeight - 32}px; width:${MATCH_WIDTH}px;">
          ${matchesHtml}
        </div>
      </div>`;

    // Connector column
    if (i < rounds.length - 1) {
      const nextRd = rounds[i + 1];
      let forksHtml = '';
      for (const parentMatch of nextRd.matches) {
        const childAId = `R${rd.round}P${parentMatch.position * 2}`;
        const childBId = `R${rd.round}P${parentMatch.position * 2 + 1}`;
        const yA = rd.positions.get(childAId);
        const yB = rd.positions.get(childBId);
        if (yA !== undefined && yB !== undefined) {
          const midY = (yA + yB) / 2;
          forksHtml += `
            <div class="fork">
              <div class="fork-line fork-h" style="top:${yA + halfMatch - 1}px; left:0; width:50%;"></div>
              <div class="fork-line fork-h" style="top:${yB + halfMatch - 1}px; left:0; width:50%;"></div>
              <div class="fork-line fork-v" style="top:${yA + halfMatch}px; left:calc(50% - 1px); height:${yB - yA}px;"></div>
              <div class="fork-line fork-h" style="top:${midY + halfMatch - 1}px; left:50%; width:50%;"></div>
            </div>`;
        }
      }

      columnsHtml += `
        <div class="connector-col" style="width:${CONNECTOR_WIDTH}px;">
          <div class="connector-inner" style="position:relative; height:${totalHeight - 32}px; width:${CONNECTOR_WIDTH}px;">
            ${forksHtml}
          </div>
        </div>`;
    }
  }

  return `
    <div class="bracket-card">
      <h2>${data.label} — Bracket (${data.bracketSize} slots)</h2>
      <div class="bracket-tree">${columnsHtml}</div>
    </div>`;
}

const css = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #0f172a;
    color: #e2e8f0;
    padding: 40px;
  }
  h1 {
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 32px;
    color: #f8fafc;
  }
  .bracket-card {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 12px;
    padding: 24px 32px;
    margin-bottom: 32px;
    overflow-x: auto;
  }
  .bracket-card h2 {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 16px;
    color: #f1f5f9;
  }
  .bracket-tree {
    display: flex;
    align-items: flex-start;
  }
  .round-col {
    flex-shrink: 0;
  }
  .round-label {
    text-align: center;
    font-size: 12px;
    font-weight: 600;
    color: #94a3b8;
    margin-bottom: 12px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .match {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 8px;
    padding: 4px 8px;
    cursor: default;
    transition: border-color 0.15s;
  }
  .match:hover {
    border-color: #475569;
  }
  .match.bye-match {
    border-style: dashed;
    border-color: #475569;
    opacity: 0.7;
  }
  .match.final-match {
    border-color: #60a5fa;
    box-shadow: 0 0 0 1px rgba(96, 165, 250, 0.2);
  }
  .match-header {
    font-size: 11px;
    color: #64748b;
    font-weight: 500;
    margin-bottom: 4px;
  }
  .slot {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 3px 4px;
    border-radius: 4px;
    margin-bottom: 2px;
  }
  .slot.winner {
    background: rgba(34, 197, 94, 0.1);
  }
  .slot.bye-slot {
    opacity: 0.5;
  }
  .seed {
    font-size: 10px;
    font-weight: 700;
    color: #60a5fa;
    min-width: 16px;
    text-align: center;
  }
  .name {
    font-size: 12px;
    font-weight: 500;
    color: #cbd5e1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .bye-text {
    color: #475569;
    font-style: italic;
  }
  .connector-col {
    flex-shrink: 0;
  }
  .fork { position: absolute; inset: 0; pointer-events: none; }
  .fork-line {
    position: absolute;
    background: #334155;
  }
  .fork-h { height: 2px; }
  .fork-v { width: 2px; }
`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bracket Verification</title>
  <style>${css}</style>
</head>
<body>
  <h1>BYE Distribution Verification — ${new Date().toISOString().slice(0, 10)}</h1>
  ${allData.map(renderBracketHtml).join('\n')}
</body>
</html>`;

const outDir = join(import.meta.dirname ?? '.', '..', 'docs');
writeFileSync(join(outDir, 'brackets.html'), html);
console.log(`\n✅ HTML written to ${join(outDir, 'brackets.html')}`);
