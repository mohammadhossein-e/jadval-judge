import { describe, it, expect } from 'vitest';
import type { EngineCompetitor } from '../../src/types';
import { buildGenerationContext } from '../../src/engine/generation-context';
import { buildSingleEliminationSkeleton } from '../../src/single-elimination/single-elimination-skeleton';
import { buildSingleEliminationPositionMap } from '../../src/single-elimination/single-elimination-position-map';
import { placeCompetitors } from '../../src/single-elimination/seeding';
import type { PositionMap } from '../../src/engine/position-map';

function skel(competitorCount: number) {
  const competitors: EngineCompetitor[] = Array.from({ length: competitorCount }, (_, i) => ({
    id: `c${i + 1}`,
    name: `Name ${i + 1}`,
    seed: null,
  }));
  return buildSingleEliminationSkeleton(buildGenerationContext(competitors));
}

// ─── Entry count ────────────────────────────────────────────────

describe('position map entry count', () => {
  it('2-slot bracket → 2 entries', () => {
    expect(buildSingleEliminationPositionMap(skel(2))).toHaveLength(2);
  });

  it('4-slot bracket → 4 entries', () => {
    expect(buildSingleEliminationPositionMap(skel(4))).toHaveLength(4);
  });

  it('8-slot bracket → 8 entries', () => {
    expect(buildSingleEliminationPositionMap(skel(8))).toHaveLength(8);
  });

  it('16-slot bracket → 16 entries', () => {
    expect(buildSingleEliminationPositionMap(skel(16))).toHaveLength(16);
  });

  it('128-slot bracket → 128 entries', () => {
    expect(buildSingleEliminationPositionMap(skel(128))).toHaveLength(128);
  });

  it('always equals skeleton.size', () => {
    for (const count of [2, 3, 4, 5, 8, 10, 16, 33, 64, 100, 128]) {
      const s = skel(count);
      const pm = buildSingleEliminationPositionMap(s);
      expect(pm).toHaveLength(s.size);
    }
  });
});

// ─── Sequential indices ─────────────────────────────────────────

describe('position map indices', () => {
  it('indices are 0-indexed and sequential', () => {
    const pm = buildSingleEliminationPositionMap(skel(8));
    const indices = pm.map((e) => e.index);
    expect(indices).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it('indices are unique', () => {
    const pm = buildSingleEliminationPositionMap(skel(16));
    const indices = pm.map((e) => e.index);
    expect(new Set(indices).size).toBe(indices.length);
  });

  it('last index equals size minus 1', () => {
    const pm = buildSingleEliminationPositionMap(skel(128));
    expect(pm[pm.length - 1].index).toBe(127);
  });
});

// ─── Slot alternation ───────────────────────────────────────────

describe('position map slot alternation', () => {
  it('entries alternate A, B within each match', () => {
    const pm = buildSingleEliminationPositionMap(skel(4));
    expect(pm[0].slot).toBe('A');
    expect(pm[1].slot).toBe('B');
    expect(pm[2].slot).toBe('A');
    expect(pm[3].slot).toBe('B');
  });

  it('all even-indexed entries are slot A', () => {
    const pm = buildSingleEliminationPositionMap(skel(8));
    for (let i = 0; i < pm.length; i += 2) {
      expect(pm[i].slot).toBe('A');
    }
  });

  it('all odd-indexed entries are slot B', () => {
    const pm = buildSingleEliminationPositionMap(skel(8));
    for (let i = 1; i < pm.length; i += 2) {
      expect(pm[i].slot).toBe('B');
    }
  });
});

// ─── Match ID mapping ───────────────────────────────────────────

describe('position map match IDs', () => {
  it('2-slot: both entries map to R1P0', () => {
    const pm = buildSingleEliminationPositionMap(skel(2));
    expect(pm[0].matchId).toBe('R1P0');
    expect(pm[1].matchId).toBe('R1P0');
  });

  it('4-slot: first two entries map to R1P0, next two to R1P1', () => {
    const pm = buildSingleEliminationPositionMap(skel(4));
    expect(pm[0].matchId).toBe('R1P0');
    expect(pm[1].matchId).toBe('R1P0');
    expect(pm[2].matchId).toBe('R1P1');
    expect(pm[3].matchId).toBe('R1P1');
  });

  it('8-slot: pairs map to R1P0, R1P1, R1P2, R1P3', () => {
    const pm = buildSingleEliminationPositionMap(skel(8));
    expect(pm[0].matchId).toBe('R1P0');
    expect(pm[1].matchId).toBe('R1P0');
    expect(pm[2].matchId).toBe('R1P1');
    expect(pm[3].matchId).toBe('R1P1');
    expect(pm[4].matchId).toBe('R1P2');
    expect(pm[5].matchId).toBe('R1P2');
    expect(pm[6].matchId).toBe('R1P3');
    expect(pm[7].matchId).toBe('R1P3');
  });

  it('all matchIds reference existing skeleton matches', () => {
    const s = skel(16);
    const pm = buildSingleEliminationPositionMap(s);
    const skeletonIds = new Set(s.matches.map((m) => m.id));
    for (const entry of pm) {
      expect(skeletonIds.has(entry.matchId)).toBe(true);
    }
  });
});

// ─── Round and position fields ──────────────────────────────────

describe('position map round and matchPosition', () => {
  it('all entries are in round 1', () => {
    const pm = buildSingleEliminationPositionMap(skel(8));
    for (const entry of pm) {
      expect(entry.round).toBe(1);
    }
  });

  it('matchPosition increments every 2 entries', () => {
    const pm = buildSingleEliminationPositionMap(skel(8));
    expect(pm[0].matchPosition).toBe(0);
    expect(pm[1].matchPosition).toBe(0);
    expect(pm[2].matchPosition).toBe(1);
    expect(pm[3].matchPosition).toBe(1);
    expect(pm[4].matchPosition).toBe(2);
    expect(pm[5].matchPosition).toBe(2);
    expect(pm[6].matchPosition).toBe(3);
    expect(pm[7].matchPosition).toBe(3);
  });

  it('matchPosition is 0-indexed', () => {
    const pm = buildSingleEliminationPositionMap(skel(4));
    const positions = [...new Set(pm.map((e) => e.matchPosition))].sort();
    expect(positions).toEqual([0, 1]);
  });
});

// ─── Structural properties ──────────────────────────────────────

describe('position map structural properties', () => {
  it('each entry has exactly the expected keys', () => {
    const pm = buildSingleEliminationPositionMap(skel(4));
    for (const entry of pm) {
      expect(Object.keys(entry).sort()).toEqual(
        ['index', 'round', 'matchPosition', 'slot', 'matchId'].sort(),
      );
    }
  });

  it('no competitor, winner, or bye fields', () => {
    const pm = buildSingleEliminationPositionMap(skel(8));
    for (const entry of pm) {
      expect(entry).not.toHaveProperty('competitor');
      expect(entry).not.toHaveProperty('winner');
      expect(entry).not.toHaveProperty('isBye');
      expect(entry).not.toHaveProperty('competitorId');
    }
  });
});

// ─── Immutability ───────────────────────────────────────────────

describe('position map immutability', () => {
  it('returns a new array each call', () => {
    const s = skel(4);
    const pm1 = buildSingleEliminationPositionMap(s);
    const pm2 = buildSingleEliminationPositionMap(s);
    expect(pm1).not.toBe(pm2);
  });

  it('entries are independent objects', () => {
    const s = skel(4);
    const pm1 = buildSingleEliminationPositionMap(s);
    const pm2 = buildSingleEliminationPositionMap(s);
    for (let i = 0; i < pm1.length; i++) {
      expect(pm1[i]).not.toBe(pm2[i]);
    }
  });
});

// ─── Consistency with existing placeCompetitors ─────────────────

describe('position map consistent with placeCompetitors', () => {
  it('same count as bracketSize from placeCompetitors', () => {
    for (const count of [2, 4, 8, 16]) {
      const competitors: EngineCompetitor[] = Array.from({ length: count }, (_, i) => ({
        id: `c${i + 1}`,
        name: `Name ${i + 1}`,
        seed: i + 1,
      }));
      const positions = placeCompetitors(competitors, count, 'random');
      const pm = buildSingleEliminationPositionMap(skel(count));
      expect(pm).toHaveLength(positions.length);
    }
  });

  it('position 0 maps to first match slot A, position 1 to slot B', () => {
    const pm = buildSingleEliminationPositionMap(skel(8));
    expect(pm[0].matchId).toBe('R1P0');
    expect(pm[0].slot).toBe('A');
    expect(pm[1].matchId).toBe('R1P0');
    expect(pm[1].slot).toBe('B');
  });
});

// ─── 2-slot edge case ──────────────────────────────────────────

describe('2-slot bracket', () => {
  it('has exactly 1 match with 2 entries', () => {
    const pm = buildSingleEliminationPositionMap(skel(2));
    expect(pm).toHaveLength(2);
    expect(pm[0].matchId).toBe('R1P0');
    expect(pm[1].matchId).toBe('R1P0');
    expect(pm[0].slot).toBe('A');
    expect(pm[1].slot).toBe('B');
  });
});

// ─── Non-power-of-2 bracket sizes ──────────────────────────────

describe('non-power-of-2 competitor counts', () => {
  it('3 competitors (bracketSize 4) → 4 entries', () => {
    expect(buildSingleEliminationPositionMap(skel(3))).toHaveLength(4);
  });

  it('5 competitors (bracketSize 8) → 8 entries', () => {
    expect(buildSingleEliminationPositionMap(skel(5))).toHaveLength(8);
  });

  it('100 competitors (bracketSize 128) → 128 entries', () => {
    expect(buildSingleEliminationPositionMap(skel(100))).toHaveLength(128);
  });
});
