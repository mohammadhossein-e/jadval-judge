"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  BalancedByePlacementStrategy: () => BalancedByePlacementStrategy,
  ByePlacementRule: () => ByePlacementRule,
  DefaultByePlacementStrategy: () => DefaultByePlacementStrategy,
  DefaultCompetitorPlacementStrategy: () => DefaultCompetitorPlacementStrategy,
  DefaultSeedPlacementStrategy: () => DefaultSeedPlacementStrategy,
  DuplicateSeedsValidator: () => DuplicateSeedsValidator,
  FilterPlacementRule: () => FilterPlacementRule,
  GenerationPipeline: () => GenerationPipeline,
  InvalidSeedValuesValidator: () => InvalidSeedValuesValidator,
  ManualPlacementRule: () => ManualPlacementRule,
  MaximumCompetitorsValidator: () => MaximumCompetitorsValidator,
  MinimumCompetitorsValidator: () => MinimumCompetitorsValidator,
  NonEmptyMatchIdValidator: () => NonEmptyMatchIdValidator,
  NonEmptyNamesValidator: () => NonEmptyNamesValidator,
  NonEmptyWinnerIdValidator: () => NonEmptyWinnerIdValidator,
  RequiredFieldsValidator: () => RequiredFieldsValidator,
  SeedPlacementRule: () => SeedPlacementRule,
  SeededCountValidator: () => SeededCountValidator,
  SingleEliminationStrategy: () => SingleEliminationStrategy,
  TournamentEngine: () => TournamentEngine,
  UniqueIdsValidator: () => UniqueIdsValidator,
  ValidationError: () => ValidationError,
  ValidationPipeline: () => ValidationPipeline,
  buildGenerationContext: () => buildGenerationContext,
  cascadeUndo: () => cascadeUndo,
  computeSeedClaims: () => computeSeedClaims,
  createPipelineContext: () => createPipelineContext,
  defaultGenerateValidators: () => defaultGenerateValidators,
  defaultResolveValidators: () => defaultResolveValidators,
  generateBracket: () => generateBracket,
  generateByePriority: () => generateByePriority,
  getBracketPreview: () => getBracketPreview,
  getChampion: () => getChampion,
  isBracketComplete: () => isBracketComplete,
  resolveMatch: () => resolveMatch,
  resolvePlacementClaims: () => resolvePlacementClaims,
  validateSeeds: () => validateSeeds
});
module.exports = __toCommonJS(index_exports);

// src/utils.ts
function nextPowerOf2(n) {
  if (n <= 0) return 1;
  let power = 1;
  while (power < n) {
    power *= 2;
  }
  return power;
}
function logBase2(n) {
  return Math.log2(n);
}
function shuffleArray(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function cloneMatches(matches) {
  return matches.map((m) => ({
    ...m,
    competitorA: m.competitorA ? { ...m.competitorA } : null,
    competitorB: m.competitorB ? { ...m.competitorB } : null,
    winner: m.winner ? { ...m.winner } : null
  }));
}

// src/engine/generation-context.ts
function buildGenerationContext(competitors) {
  const competitorCount = competitors.length;
  const bracketSize = nextPowerOf2(competitorCount);
  const byeCount = bracketSize - competitorCount;
  const roundCount = logBase2(bracketSize);
  return { competitorCount, bracketSize, byeCount, roundCount };
}

// src/engine/pipeline.ts
function createPipelineContext(competitors, drawType, manualPlacements, placementOrder, context) {
  return {
    competitors,
    drawType,
    manualPlacements,
    placementOrder,
    generationContext: context ?? buildGenerationContext(competitors),
    skeleton: null,
    positionMap: null,
    byePositions: null,
    placements: null,
    matches: null,
    bracket: null,
    byes: null
  };
}
var GenerationPipeline = class {
  constructor(steps) {
    this.steps = steps;
  }
  /** Execute every step in order and return the final context. */
  run(context) {
    let current = context;
    for (const step of this.steps) {
      current = step.execute(current);
    }
    return current;
  }
};

// src/engine/validators/generate.ts
var MinimumCompetitorsValidator = class {
  validate(input) {
    if (input.competitors.length < 2) {
      return { valid: false, errors: ["At least 2 competitors are required"] };
    }
    return { valid: true, errors: [] };
  }
};
var MaximumCompetitorsValidator = class {
  validate(input) {
    if (input.competitors.length > 256) {
      return { valid: false, errors: ["Maximum 256 competitors allowed"] };
    }
    return { valid: true, errors: [] };
  }
};
var UniqueIdsValidator = class {
  validate(input) {
    const seen = /* @__PURE__ */ new Set();
    const duplicates = [];
    for (const c of input.competitors) {
      if (seen.has(c.id)) {
        duplicates.push(c.id);
      }
      seen.add(c.id);
    }
    if (duplicates.length > 0) {
      return {
        valid: false,
        errors: [`Duplicate competitor IDs: ${[...new Set(duplicates)].join(", ")}`]
      };
    }
    return { valid: true, errors: [] };
  }
};
var NonEmptyNamesValidator = class {
  validate(input) {
    const errors = [];
    for (const c of input.competitors) {
      if (typeof c.name !== "string" || c.name.trim() === "") {
        errors.push(`Competitor "${c.id}" has empty or missing name`);
      }
    }
    if (errors.length > 0) {
      return { valid: false, errors };
    }
    return { valid: true, errors: [] };
  }
};
var DuplicateSeedsValidator = class {
  validate(input) {
    const bySeed = /* @__PURE__ */ new Map();
    for (const c of input.competitors) {
      if (c.seed === null) continue;
      const ids = bySeed.get(c.seed) ?? [];
      ids.push(c.id);
      bySeed.set(c.seed, ids);
    }
    const duplicates = [...bySeed.entries()].filter(([, ids]) => ids.length > 1);
    if (duplicates.length > 0) {
      return {
        valid: false,
        errors: duplicates.map(
          ([seed, ids]) => `Duplicate seed ${seed} assigned to competitors: ${ids.join(", ")}`
        )
      };
    }
    return { valid: true, errors: [] };
  }
};
var InvalidSeedValuesValidator = class {
  validate(input) {
    const errors = [];
    for (const c of input.competitors) {
      if (c.seed === null) continue;
      if (!Number.isInteger(c.seed) || c.seed <= 0) {
        errors.push(
          `Competitor "${c.id}" has invalid seed ${String(c.seed)}: seeds must be positive integers`
        );
      }
    }
    if (errors.length > 0) {
      return { valid: false, errors };
    }
    return { valid: true, errors: [] };
  }
};
var SeededCountValidator = class {
  validate(input) {
    const seedCount = input.competitors.reduce(
      (count, c) => c.seed === null ? count : count + 1,
      0
    );
    if (seedCount > input.competitors.length) {
      return {
        valid: false,
        errors: [
          `Seed count (${seedCount}) exceeds competitor count (${input.competitors.length})`
        ]
      };
    }
    return { valid: true, errors: [] };
  }
};
function validateSeeds(input) {
  const validators = [
    new DuplicateSeedsValidator(),
    new InvalidSeedValuesValidator(),
    new SeededCountValidator()
  ];
  const errors = [];
  for (const validator of validators) {
    const result = validator.validate(input);
    if (!result.valid) {
      errors.push(...result.errors);
    }
  }
  return errors;
}
var RequiredFieldsValidator = class {
  validate(input) {
    const errors = [];
    for (const c of input.competitors) {
      if (typeof c.id !== "string" || c.id === "") {
        errors.push('Every competitor must have a non-empty string "id"');
      }
      if (c.name !== void 0 && typeof c.name !== "string") {
        errors.push(`Competitor "${String(c.id)}" has non-string name`);
      }
    }
    if (errors.length > 0) {
      return { valid: false, errors };
    }
    return { valid: true, errors: [] };
  }
};

// src/single-elimination/single-elimination-skeleton.ts
function buildSingleEliminationSkeleton(context) {
  const matches = [];
  const { bracketSize, roundCount } = context;
  const round1Count = bracketSize / 2;
  for (let p = 0; p < round1Count; p++) {
    matches.push({
      id: `R1P${p}`,
      round: 1,
      position: p,
      nextMatchId: roundCount > 1 ? `R2P${Math.floor(p / 2)}` : null,
      nextSlot: roundCount > 1 ? p % 2 === 0 ? "A" : "B" : null
    });
  }
  for (let r = 2; r <= roundCount; r++) {
    const count = bracketSize / Math.pow(2, r);
    for (let p = 0; p < count; p++) {
      matches.push({
        id: `R${r}P${p}`,
        round: r,
        position: p,
        nextMatchId: r < roundCount ? `R${r + 1}P${Math.floor(p / 2)}` : null,
        nextSlot: r < roundCount ? p % 2 === 0 ? "A" : "B" : null
      });
    }
  }
  return {
    size: bracketSize,
    totalRounds: roundCount,
    matches
  };
}

// src/single-elimination/single-elimination-position-map.ts
function buildSingleEliminationPositionMap(skeleton) {
  const entries = [];
  let index = 0;
  const round1 = skeleton.matches.filter((m) => m.round === 1);
  for (const match of round1) {
    entries.push({
      index,
      round: match.round,
      matchPosition: match.position,
      slot: "A",
      matchId: match.id
    });
    index++;
    entries.push({
      index,
      round: match.round,
      matchPosition: match.position,
      slot: "B",
      matchId: match.id
    });
    index++;
  }
  return entries;
}

// src/single-elimination/match-builder.ts
function buildBracketMatches(skeleton, positionMap, placements) {
  const slotByMatch = /* @__PURE__ */ new Map();
  for (const entry of positionMap) {
    let record = slotByMatch.get(entry.matchId);
    if (!record) {
      record = { A: 0, B: 0 };
      slotByMatch.set(entry.matchId, record);
    }
    record[entry.slot] = entry.index;
  }
  return skeleton.matches.map((skelMatch) => {
    const slots = slotByMatch.get(skelMatch.id);
    if (slots) {
      const compA = placements[slots.A] ?? null;
      const compB = placements[slots.B] ?? null;
      const isBye = compA === null !== (compB === null);
      return {
        id: skelMatch.id,
        round: skelMatch.round,
        position: skelMatch.position,
        competitorA: compA,
        competitorB: compB,
        winner: null,
        isBye,
        nextMatchId: skelMatch.nextMatchId,
        nextSlot: skelMatch.nextSlot
      };
    }
    return {
      id: skelMatch.id,
      round: skelMatch.round,
      position: skelMatch.position,
      competitorA: null,
      competitorB: null,
      winner: null,
      isBye: false,
      nextMatchId: skelMatch.nextMatchId,
      nextSlot: skelMatch.nextSlot
    };
  });
}

// src/single-elimination/bye-resolution.ts
function autoResolveByes(matches) {
  const matchMap = new Map(matches.map((m) => [m.id, m]));
  for (const match of matches) {
    if (!match.isBye) continue;
    const winner = match.competitorA ?? match.competitorB;
    if (!winner || !match.nextMatchId) continue;
    match.winner = winner;
    const next = matchMap.get(match.nextMatchId);
    if (next && match.nextSlot) {
      if (match.nextSlot === "A") {
        next.competitorA = winner;
      } else {
        next.competitorB = winner;
      }
    }
  }
}

// src/single-elimination/bye-info.ts
function collectByeInfo(matches, positionMap) {
  const indexByMatchSlot = /* @__PURE__ */ new Map();
  for (const entry of positionMap) {
    indexByMatchSlot.set(`${entry.matchId}:${entry.slot}`, entry.index);
  }
  const byes = [];
  for (const match of matches) {
    if (match.round !== 1 || !match.isBye || !match.winner) continue;
    const byeSlot = match.competitorA === null ? "A" : "B";
    const position = indexByMatchSlot.get(`${match.id}:${byeSlot}`);
    if (position === void 0) continue;
    byes.push({ competitorId: match.winner.id, position });
  }
  return byes;
}

// src/single-elimination/bye-priority.ts
var BYE_PRIORITY = /* @__PURE__ */ new Map([
  [
    2,
    [
      0
    ]
  ],
  [
    4,
    [
      0
    ]
  ],
  [
    8,
    [
      0,
      7,
      4
    ]
  ],
  [
    16,
    [
      0,
      15,
      8,
      7,
      12,
      3,
      11
    ]
  ],
  [
    32,
    [
      0,
      31,
      16,
      15,
      24,
      7,
      23,
      8,
      28,
      3,
      27,
      4,
      20,
      11,
      19
    ]
  ],
  [
    64,
    [
      0,
      63,
      32,
      31,
      48,
      15,
      47,
      16,
      56,
      7,
      39,
      24,
      55,
      8,
      40,
      23,
      60,
      3,
      35,
      28,
      51,
      12,
      44,
      19,
      59,
      4,
      36,
      27,
      52,
      11,
      43
    ]
  ],
  [
    128,
    [
      0,
      127,
      64,
      63,
      96,
      31,
      95,
      32,
      112,
      15,
      79,
      48,
      111,
      16,
      80,
      47,
      120,
      7,
      71,
      56,
      103,
      24,
      87,
      40,
      119,
      8,
      72,
      55,
      104,
      23,
      88,
      39,
      124,
      3,
      67,
      60,
      99,
      28,
      83,
      44,
      123,
      4,
      68,
      59,
      100,
      27,
      84,
      43,
      116,
      11,
      75,
      52,
      107,
      20,
      91,
      36,
      115,
      12,
      76,
      51,
      108,
      19,
      92
    ]
  ],
  [
    256,
    [
      0,
      255,
      128,
      127,
      192,
      63,
      191,
      64,
      224,
      31,
      159,
      96,
      223,
      32,
      160,
      95,
      240,
      15,
      143,
      112,
      207,
      48,
      176,
      79,
      239,
      16,
      144,
      111,
      208,
      47,
      175,
      80,
      248,
      7,
      135,
      120,
      199,
      56,
      184,
      71,
      247,
      8,
      136,
      119,
      200,
      55,
      183,
      72,
      232,
      23,
      151,
      104,
      215,
      40,
      168,
      87,
      231,
      24,
      152,
      103,
      216,
      39,
      167,
      88,
      252,
      3,
      131,
      124,
      195,
      60,
      188,
      67,
      251,
      4,
      132,
      123,
      196,
      59,
      187,
      68,
      236,
      27,
      155,
      100,
      219,
      36,
      164,
      91,
      235,
      28,
      156,
      99,
      220,
      35,
      163,
      92,
      244,
      11,
      139,
      116,
      203,
      52,
      180,
      75,
      243,
      12,
      140,
      115,
      204,
      51,
      179,
      76,
      228,
      19,
      147,
      108,
      211,
      44,
      172,
      83,
      227,
      20,
      148,
      107,
      212,
      43,
      171
    ]
  ]
]);
function generateByePriority(bracketSize) {
  const ref = BYE_PRIORITY.get(bracketSize);
  if (!ref) {
    throw new Error(
      `generateByePriority: unsupported bracket size ${bracketSize}. Supported sizes: 2, 4, 8, 16, 32, 64, 128, 256.`
    );
  }
  return [...ref];
}

// src/single-elimination/bye-distribution.ts
function generateByePriorityPositions(bracketSize) {
  if (bracketSize < 2) return [];
  return generateByePriority(bracketSize);
}
function calculateByeDistribution(competitorCount) {
  if (competitorCount <= 0) {
    return { bracketSize: 0, competitorCount: 0, byeCount: 0, byePositions: [] };
  }
  const bracketSize = Math.max(2, nextPowerOf2(competitorCount));
  const byeCount = bracketSize - competitorCount;
  if (byeCount === 0) {
    return { bracketSize, competitorCount, byeCount, byePositions: [] };
  }
  const priority = generateByePriorityPositions(bracketSize);
  const maxByes = priority.length;
  const effectiveByeCount = Math.min(byeCount, maxByes);
  const byePositions = [];
  const matchHasBye = /* @__PURE__ */ new Set();
  for (let i = 0; i < priority.length && byePositions.length < effectiveByeCount; i++) {
    const pos = priority[i];
    const matchIdx = Math.floor(pos / 2);
    if (!matchHasBye.has(matchIdx)) {
      matchHasBye.add(matchIdx);
      byePositions.push(pos);
    }
  }
  return { bracketSize, competitorCount, byeCount: byePositions.length, byePositions };
}

// src/single-elimination/default-bye-placement.ts
var DefaultByePlacementStrategy = class {
  placeByes(context, _positionMap) {
    return calculateByeDistribution(context.competitorCount).byePositions;
  }
};

// src/engine/claim-resolver.ts
function resolvePlacementClaims(input, rules, fillOrder) {
  const { competitors, generationContext, byePositions } = input;
  const bracketSize = generationContext.bracketSize;
  const positions = new Array(bracketSize).fill(null);
  const competitorMap = new Map(competitors.map((c) => [c.id, c]));
  const claimedCompetitors = /* @__PURE__ */ new Set();
  const claimedPositions = /* @__PURE__ */ new Set();
  const acceptedClaims = [];
  const baseInput = {
    competitors,
    generationContext,
    positionMap: input.positionMap,
    byePositions,
    claimed: acceptedClaims
  };
  const sortedRules = [...rules].sort((a, b) => a.priority - b.priority);
  for (const rule of sortedRules) {
    const ruleClaims = rule.claim(baseInput);
    for (const claim of ruleClaims) {
      const { position, competitorId } = claim;
      if (position < 0 || position >= bracketSize) continue;
      if (claimedPositions.has(position)) continue;
      if (competitorId === null) {
        claimedPositions.add(position);
        acceptedClaims.push(claim);
        continue;
      }
      if (claimedCompetitors.has(competitorId)) continue;
      const competitor = competitorMap.get(competitorId);
      if (!competitor) continue;
      positions[position] = competitor;
      claimedCompetitors.add(competitorId);
      claimedPositions.add(position);
      acceptedClaims.push(claim);
    }
  }
  for (const competitor of fillOrder) {
    if (claimedCompetitors.has(competitor.id)) continue;
    for (let pos = 0; pos < bracketSize; pos++) {
      if (!claimedPositions.has(pos)) {
        positions[pos] = competitor;
        claimedCompetitors.add(competitor.id);
        claimedPositions.add(pos);
        break;
      }
    }
  }
  return positions;
}

// src/engine/placement-claim.ts
var PlacementPriority = {
  /** Manual placements — highest priority. */
  manual: 1,
  /** Placement filters (Province / Club / Coach / Country). */
  filter: 2,
  /** Tournament seeding (official seeded positions). */
  seed: 3,
  /** BYE reservations. */
  bye: 4,
  /** Fill remaining competitors. */
  fill: 5
};

// src/single-elimination/seeding.ts
function standardSeeding(bracketSize) {
  if (bracketSize < 2) return [];
  if (bracketSize === 2) return [1, 2];
  const half = standardSeeding(bracketSize / 2);
  const result = [];
  for (let i = 0; i < half.length; i++) {
    result.push(half[i]);
    result.push(bracketSize + 1 - half[i]);
  }
  return result;
}

// src/single-elimination/seed-placement.ts
function computeSeedClaims(competitors, bracketSize, byePositions) {
  const seeding = standardSeeding(bracketSize);
  const byeSet = byePositions ?? new Set(calculateByeDistribution(competitors.length).byePositions);
  const claimedSeeds = /* @__PURE__ */ new Set();
  const seedClaims = [];
  for (const competitor of competitors) {
    const { seed } = competitor;
    if (seed === null || seed < 1 || seed > bracketSize) continue;
    if (claimedSeeds.has(seed)) continue;
    const standardPosition = seeding.indexOf(seed);
    if (standardPosition === -1) continue;
    claimedSeeds.add(seed);
    seedClaims.push({
      seed,
      position: byeSet.has(standardPosition) ? standardPosition ^ 1 : standardPosition,
      competitorId: competitor.id
    });
  }
  seedClaims.sort((a, b) => a.seed - b.seed);
  guaranteeTopRecipients(seedClaims, byeSet, bracketSize);
  const claims = seedClaims.map(({ position, competitorId }) => ({
    position,
    competitorId,
    source: "seeding"
  }));
  return claims;
}
function guaranteeTopRecipients(claims, byeSet, bracketSize) {
  const byeOrder = generateByePriorityPositions(bracketSize).filter(
    (pos) => byeSet.has(pos)
  );
  const guaranteedCount = Math.min(byeOrder.length, claims.length);
  for (let i = 0; i < guaranteedCount; i++) {
    const claim = claims[i];
    const target = byeOrder[i] ^ 1;
    if (claim.position === target) continue;
    const occupant = claims.find(
      (c) => c.position === target && c.seed > claim.seed
    );
    if (occupant) {
      occupant.position = claim.position;
    }
    claim.position = target;
  }
}
var DefaultSeedPlacementStrategy = class {
  constructor() {
    this.name = "seeding";
    this.priority = PlacementPriority.seed;
  }
  placeSeeds(input) {
    return computeSeedClaims(
      input.competitors,
      input.generationContext.bracketSize,
      input.byePositions
    );
  }
  claim(input) {
    return this.placeSeeds(input);
  }
};

// src/single-elimination/placement-rules.ts
var ManualPlacementRule = class {
  constructor(manualPlacements) {
    this.manualPlacements = manualPlacements;
    this.name = "manual";
    this.priority = PlacementPriority.manual;
  }
  claim(input) {
    const { competitors, generationContext, byePositions } = input;
    const bracketSize = generationContext.bracketSize;
    const knownIds = new Set(competitors.map((c) => c.id));
    const nonByePositions = [];
    for (let pos = 0; pos < bracketSize; pos++) {
      if (!byePositions.has(pos)) {
        nonByePositions.push(pos);
      }
    }
    const orderedEntries = [...this.manualPlacements.entries()].filter(([pos]) => pos >= 0 && pos < bracketSize).sort((a, b) => a[0] - b[0]);
    const claims = [];
    const claimedCompetitors = /* @__PURE__ */ new Set();
    let placeIdx = 0;
    for (const [, competitorId] of orderedEntries) {
      if (!knownIds.has(competitorId) || claimedCompetitors.has(competitorId)) continue;
      if (placeIdx >= nonByePositions.length) break;
      claims.push({
        position: nonByePositions[placeIdx],
        competitorId,
        source: this.name
      });
      claimedCompetitors.add(competitorId);
      placeIdx++;
    }
    return claims;
  }
};
var FilterPlacementRule = class {
  constructor(filter) {
    this.filter = filter;
    this.priority = PlacementPriority.filter;
  }
  get name() {
    return this.filter.name;
  }
  claim(input) {
    return this.filter.apply(input, input.claimed);
  }
};
var SeedPlacementRule = class {
  constructor(strategy, drawType, manualPlacements) {
    this.strategy = strategy;
    this.drawType = drawType;
    this.manualPlacements = manualPlacements;
    this.priority = PlacementPriority.seed;
  }
  get name() {
    return this.strategy.name;
  }
  claim(input) {
    const seedInput = {
      ...input,
      drawType: this.drawType,
      manualPlacements: this.manualPlacements
    };
    return this.strategy.placeSeeds(seedInput);
  }
};
var ByePlacementRule = class {
  constructor() {
    this.name = "bye";
    this.priority = PlacementPriority.bye;
  }
  claim(input) {
    return [...input.byePositions].sort((a, b) => a - b).map((position) => ({ position, competitorId: null, source: this.name }));
  }
};

// src/single-elimination/default-competitor-placement.ts
var DefaultCompetitorPlacementStrategy = class {
  constructor(config = {}) {
    this.seedStrategy = config.seedPlacement ?? new DefaultSeedPlacementStrategy();
    this.filters = config.filters ?? [];
  }
  placeCompetitors(input) {
    const {
      competitors,
      generationContext,
      positionMap,
      byePositions,
      drawType,
      manualPlacements,
      placementOrder
    } = input;
    const rules = [];
    if (manualPlacements && manualPlacements.size > 0) {
      rules.push(new ManualPlacementRule(manualPlacements));
    }
    for (const filter of this.filters) {
      rules.push(new FilterPlacementRule(filter));
    }
    rules.push(new SeedPlacementRule(this.seedStrategy, drawType, manualPlacements));
    rules.push(new ByePlacementRule());
    const fillOrder = buildFillOrder(
      competitors,
      drawType,
      placementOrder
    );
    return resolvePlacementClaims(
      {
        competitors,
        generationContext,
        positionMap,
        byePositions,
        claimed: []
      },
      rules,
      fillOrder
    );
  }
};
function buildFillOrder(competitors, drawType, placementOrder) {
  if (placementOrder) {
    const byId = new Map(competitors.map((competitor) => [competitor.id, competitor]));
    const seen = /* @__PURE__ */ new Set();
    const order = [];
    for (const id of placementOrder) {
      const competitor = byId.get(id);
      if (competitor && !seen.has(id)) {
        seen.add(id);
        order.push(competitor);
      }
    }
    if (order.length > 0) {
      return order;
    }
  }
  return drawType === "random" ? shuffleArray(competitors) : competitors;
}

// src/single-elimination/generation-steps.ts
function createByePlacementStep(strategy) {
  return {
    name: "ByePlacement",
    execute(context) {
      const { generationContext, positionMap } = context;
      const byePositions = new Set(
        strategy.placeByes(generationContext, positionMap ?? [])
      );
      return { ...context, byePositions };
    }
  };
}
function createCompetitorPlacementStep(strategy) {
  return {
    name: "CompetitorPlacement",
    execute(context) {
      if (!context.positionMap) {
        throw new Error("CompetitorPlacement requires PositionMapBuilder to run first");
      }
      if (!context.byePositions) {
        throw new Error("CompetitorPlacement requires ByePlacement to run first");
      }
      const placements = strategy.placeCompetitors({
        competitors: context.competitors,
        generationContext: context.generationContext,
        positionMap: context.positionMap,
        byePositions: context.byePositions,
        drawType: context.drawType,
        manualPlacements: context.manualPlacements,
        placementOrder: context.placementOrder
      });
      return { ...context, placements };
    }
  };
}
var ByePlacement = createByePlacementStep(
  new DefaultByePlacementStrategy()
);
var CompetitorPlacement = createCompetitorPlacementStep(
  new DefaultCompetitorPlacementStrategy()
);
var SkeletonBuilder = {
  name: "SkeletonBuilder",
  execute(context) {
    const skeleton = buildSingleEliminationSkeleton(context.generationContext);
    return { ...context, skeleton };
  }
};
var PositionMapBuilder = {
  name: "PositionMapBuilder",
  execute(context) {
    if (!context.skeleton) {
      throw new Error("PositionMapBuilder requires SkeletonBuilder to run first");
    }
    const positionMap = buildSingleEliminationPositionMap(context.skeleton);
    return { ...context, positionMap };
  }
};
var MatchPopulation = {
  name: "MatchPopulation",
  execute(context) {
    if (!context.skeleton) {
      throw new Error("MatchPopulation requires SkeletonBuilder to run first");
    }
    if (!context.positionMap) {
      throw new Error("MatchPopulation requires PositionMapBuilder to run first");
    }
    if (!context.placements) {
      throw new Error("MatchPopulation requires CompetitorPlacement to run first");
    }
    const matches = buildBracketMatches(context.skeleton, context.positionMap, context.placements);
    return { ...context, matches };
  }
};
var ByeResolution = {
  name: "ByeResolution",
  execute(context) {
    if (!context.matches) {
      throw new Error("ByeResolution requires MatchPopulation to run first");
    }
    autoResolveByes(context.matches);
    return context;
  }
};
var BracketAssembly = {
  name: "BracketAssembly",
  execute(context) {
    if (!context.matches) {
      throw new Error("BracketAssembly requires MatchPopulation to run first");
    }
    if (!context.positionMap) {
      throw new Error("BracketAssembly requires PositionMapBuilder to run first");
    }
    const { generationContext } = context;
    const bracket = {
      size: generationContext.bracketSize,
      totalRounds: generationContext.roundCount,
      matches: context.matches
    };
    const byes = collectByeInfo(context.matches, context.positionMap);
    return { ...context, bracket, byes };
  }
};
function createSingleEliminationSteps(byeStrategy, competitorStrategy) {
  const cs = competitorStrategy ?? new DefaultCompetitorPlacementStrategy();
  return [
    SkeletonBuilder,
    PositionMapBuilder,
    createByePlacementStep(byeStrategy),
    createCompetitorPlacementStep(cs),
    MatchPopulation,
    ByeResolution,
    BracketAssembly
  ];
}
var SINGLE_ELIMINATION_STEPS = createSingleEliminationSteps(new DefaultByePlacementStrategy());

// src/single-elimination/generator.ts
var pipeline = new GenerationPipeline(SINGLE_ELIMINATION_STEPS);
function generateBracket(competitors, drawType = "random", manualPlacements, placementOrder) {
  if (competitors.length < 2) {
    throw new Error("At least 2 competitors are required to generate a bracket");
  }
  if (competitors.length > 256) {
    throw new Error("Maximum 256 competitors allowed");
  }
  const seedErrors = validateSeeds({
    competitors,
    drawType,
    manualPlacements,
    placementOrder
  });
  if (seedErrors.length > 0) {
    throw new Error(seedErrors.join("; "));
  }
  const ctx = createPipelineContext(
    competitors,
    drawType,
    manualPlacements,
    placementOrder
  );
  const result = pipeline.run(ctx);
  return { bracket: result.bracket, byes: result.byes };
}
function isBracketComplete(bracket) {
  return bracket.matches.every((m) => m.winner !== null);
}
function getChampion(bracket) {
  const final = bracket.matches.find(
    (m) => m.round === bracket.totalRounds && m.position === 0
  );
  return final?.winner ?? null;
}

// src/single-elimination/cascade-utils.ts
function cascadeForward(matches, startMatchId, oldWinner) {
  const matchMap = new Map(matches.map((m) => [m.id, m]));
  let currentId = startMatchId;
  while (currentId) {
    const current = matchMap.get(currentId);
    if (!current?.nextMatchId) break;
    const next = matchMap.get(current.nextMatchId);
    if (!next) break;
    if (next.competitorA?.id === oldWinner.id) {
      next.competitorA = null;
    } else if (next.competitorB?.id === oldWinner.id) {
      next.competitorB = null;
    }
    if (next.winner?.id === oldWinner.id) {
      next.winner = null;
      currentId = next.id;
    } else {
      break;
    }
  }
}

// src/single-elimination/advancement.ts
function resolveMatch(bracket, matchId, winnerId) {
  const matches = cloneMatches(bracket.matches);
  const match = matches.find((m) => m.id === matchId);
  if (!match) throw new Error(`Match not found: ${matchId}`);
  if (!match.competitorA || !match.competitorB) {
    throw new Error("Cannot resolve match with missing competitors");
  }
  if (match.isBye) {
    throw new Error("Cannot resolve BYE match directly");
  }
  const winner = match.competitorA.id === winnerId ? match.competitorA : match.competitorB.id === winnerId ? match.competitorB : null;
  if (!winner) throw new Error("Winner must be one of the match competitors");
  const oldWinner = match.winner;
  if (oldWinner?.id === winnerId) {
    return bracket;
  }
  if (oldWinner) {
    cascadeForward(matches, matchId, oldWinner);
  }
  match.winner = winner;
  if (match.nextMatchId && match.nextSlot) {
    const matchMap = new Map(matches.map((m) => [m.id, m]));
    const next = matchMap.get(match.nextMatchId);
    if (next) {
      if (match.nextSlot === "A") {
        next.competitorA = winner;
      } else {
        next.competitorB = winner;
      }
    }
  }
  return { ...bracket, matches };
}

// src/single-elimination/cascade.ts
function cascadeUndo(bracket, matchId) {
  const matches = cloneMatches(bracket.matches);
  const match = matches.find((m) => m.id === matchId);
  if (!match?.winner) return { ...bracket, matches };
  const oldWinner = match.winner;
  match.winner = null;
  cascadeForward(matches, matchId, oldWinner);
  return { ...bracket, matches };
}

// src/single-elimination/byes.ts
function calculateBracketInfo(competitorCount) {
  const bracketSize = nextPowerOf2(competitorCount);
  return {
    bracketSize,
    totalRounds: logBase2(bracketSize),
    byeCount: bracketSize - competitorCount
  };
}
function getBracketPreview(competitorCount, _seeds) {
  if (competitorCount < 2) {
    return { competitorCount, bracketSize: 0, byeCount: 0, totalRounds: 0, seededByes: [] };
  }
  const { bracketSize, totalRounds: rounds } = calculateBracketInfo(competitorCount);
  const { byeCount, byePositions } = calculateByeDistribution(competitorCount);
  return {
    competitorCount,
    bracketSize,
    byeCount,
    totalRounds: rounds,
    seededByes: [...byePositions]
  };
}

// src/single-elimination/single-elimination-strategy.ts
var SingleEliminationStrategy = class {
  constructor(config) {
    this.format = "single-elimination";
    this.name = "Single Elimination";
    this.byeStrategy = config?.byePlacement ?? new DefaultByePlacementStrategy();
    this.competitorStrategy = buildCompetitorStrategy(config);
    this.pipeline = new GenerationPipeline(
      createSingleEliminationSteps(this.byeStrategy, this.competitorStrategy)
    );
  }
  generate(competitors, drawType, manualPlacements, placementOrder, context) {
    const pipelineContext = createPipelineContext(
      competitors,
      drawType,
      manualPlacements,
      placementOrder,
      context
    );
    const result = this.pipeline.run(pipelineContext);
    return {
      bracket: result.bracket,
      byes: result.byes
    };
  }
  resolve(bracket, matchId, winnerId) {
    return resolveMatch(bracket, matchId, winnerId);
  }
  undo(bracket, matchId) {
    return cascadeUndo(bracket, matchId);
  }
  isComplete(bracket) {
    return isBracketComplete(bracket);
  }
  getChampion(bracket) {
    return getChampion(bracket);
  }
  getPreview(competitorCount, seeds) {
    return getBracketPreview(competitorCount, seeds);
  }
};
function buildCompetitorStrategy(config) {
  if (config?.competitorPlacement) {
    return config.competitorPlacement;
  }
  return new DefaultCompetitorPlacementStrategy({
    seedPlacement: config?.seedPlacement,
    filters: config?.filters
  });
}

// src/single-elimination/balanced-bye-placement.ts
function distribute(size, byeCount) {
  if (byeCount === 0) return [];
  if (byeCount === size) {
    return Array.from({ length: size }, (_, i) => i);
  }
  const half = size / 2;
  const left = Math.floor(byeCount / 2);
  const right = byeCount - left;
  const leftPositions = distribute(half, left);
  const rightPositions = distribute(half, right).map((i) => i + half);
  return leftPositions.concat(rightPositions);
}
function placeByes(context, positionMap) {
  const { bracketSize, byeCount } = context;
  if (byeCount === 0) return [];
  const positions = distribute(bracketSize, byeCount);
  return positions.sort((a, b) => a - b);
}
var BalancedByePlacementStrategy = class {
  placeByes(context, positionMap) {
    return placeByes(context, positionMap);
  }
};

// src/engine/validator.ts
var ValidationPipeline = class {
  constructor(validators = []) {
    this.validators = validators;
  }
  run(input) {
    if (this.validators.length === 0) {
      return { valid: true, errors: [] };
    }
    const errors = [];
    for (const validator of this.validators) {
      const result = validator.validate(input);
      if (!result.valid) {
        errors.push(...result.errors);
      }
    }
    return errors.length === 0 ? { valid: true, errors: [] } : { valid: false, errors };
  }
};
var ValidationError = class extends Error {
  constructor(errors) {
    super(`Validation failed: ${errors.join("; ")}`);
    this.name = "ValidationError";
    this.errors = errors;
  }
};

// src/engine/tournament-engine.ts
var TournamentEngine = class {
  constructor(strategy, options) {
    this.strategy = strategy;
    this.generatePipeline = new ValidationPipeline(options?.generateValidators);
    this.resolvePipeline = new ValidationPipeline(options?.resolveValidators);
  }
  /** Return the currently active strategy. */
  getStrategy() {
    return this.strategy;
  }
  /** Switch to a different tournament format strategy. */
  setStrategy(strategy) {
    this.strategy = strategy;
  }
  /**
   * Generate a bracket from a list of competitors.
   *
   * Pipeline: Input → Validation → Build Context → TournamentStrategy → Result
   *
   * 1. Runs the generate validation pipeline. If any validator fails,
   *    a {@link ValidationError} is thrown before anything else happens.
   * 2. Builds a {@link GenerationContext} from the validated competitor list.
   * 3. Delegates to the strategy, passing the context alongside the raw input.
   *
   * @throws {ValidationError} if validation fails.
   * @throws If fewer than 2 competitors are provided (strategy-level).
   * @throws If more than 128 competitors are provided (strategy-level).
   */
  generate(competitors, drawType, manualPlacements, placementOrder) {
    const input = { competitors, drawType, manualPlacements, placementOrder };
    const validation = this.generatePipeline.run(input);
    if (!validation.valid) {
      throw new ValidationError(validation.errors);
    }
    const context = buildGenerationContext(competitors);
    return this.strategy.generate(
      competitors,
      drawType,
      manualPlacements,
      placementOrder,
      context
    );
  }
  /**
   * Resolve a match by declaring a winner.
   *
   * Runs the resolve validation pipeline first. If any validator fails,
   * a {@link ValidationError} is thrown before the strategy is called.
   *
   * @throws {ValidationError} if validation fails.
   * @throws If the match does not exist (strategy-level).
   * @throws If the winner is not one of the match competitors (strategy-level).
   * @throws If the match has missing competitors (strategy-level).
   */
  resolve(bracket, matchId, winnerId) {
    const input = { bracket, matchId, winnerId };
    const validation = this.resolvePipeline.run(input);
    if (!validation.valid) {
      throw new ValidationError(validation.errors);
    }
    return this.strategy.resolve(bracket, matchId, winnerId);
  }
  /**
   * Undo a match result and cascade the changes.
   */
  undo(bracket, matchId) {
    return this.strategy.undo(bracket, matchId);
  }
  /**
   * Check whether every match in the bracket has a winner.
   */
  isComplete(bracket) {
    return this.strategy.isComplete(bracket);
  }
  /**
   * Return the champion (final match winner), or null if unresolved.
   */
  getChampion(bracket) {
    return this.strategy.getChampion(bracket);
  }
  /**
   * Return bracket preview information for a given competitor count.
   */
  getPreview(competitorCount, seeds) {
    return this.strategy.getPreview(competitorCount, seeds);
  }
};

// src/engine/validators/resolve.ts
var NonEmptyMatchIdValidator = class {
  validate(input) {
    if (typeof input.matchId !== "string" || input.matchId.trim() === "") {
      return { valid: false, errors: ["Match ID is required"] };
    }
    return { valid: true, errors: [] };
  }
};
var NonEmptyWinnerIdValidator = class {
  validate(input) {
    if (typeof input.winnerId !== "string" || input.winnerId.trim() === "") {
      return { valid: false, errors: ["Winner ID is required"] };
    }
    return { valid: true, errors: [] };
  }
};

// src/engine/validators/index.ts
function defaultGenerateValidators() {
  return [
    new RequiredFieldsValidator(),
    new MinimumCompetitorsValidator(),
    new MaximumCompetitorsValidator(),
    new UniqueIdsValidator(),
    new NonEmptyNamesValidator(),
    new DuplicateSeedsValidator(),
    new InvalidSeedValuesValidator(),
    new SeededCountValidator()
  ];
}
function defaultResolveValidators() {
  return [
    new NonEmptyMatchIdValidator(),
    new NonEmptyWinnerIdValidator()
  ];
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BalancedByePlacementStrategy,
  ByePlacementRule,
  DefaultByePlacementStrategy,
  DefaultCompetitorPlacementStrategy,
  DefaultSeedPlacementStrategy,
  DuplicateSeedsValidator,
  FilterPlacementRule,
  GenerationPipeline,
  InvalidSeedValuesValidator,
  ManualPlacementRule,
  MaximumCompetitorsValidator,
  MinimumCompetitorsValidator,
  NonEmptyMatchIdValidator,
  NonEmptyNamesValidator,
  NonEmptyWinnerIdValidator,
  RequiredFieldsValidator,
  SeedPlacementRule,
  SeededCountValidator,
  SingleEliminationStrategy,
  TournamentEngine,
  UniqueIdsValidator,
  ValidationError,
  ValidationPipeline,
  buildGenerationContext,
  cascadeUndo,
  computeSeedClaims,
  createPipelineContext,
  defaultGenerateValidators,
  defaultResolveValidators,
  generateBracket,
  generateByePriority,
  getBracketPreview,
  getChampion,
  isBracketComplete,
  resolveMatch,
  resolvePlacementClaims,
  validateSeeds
});
//# sourceMappingURL=index.js.map