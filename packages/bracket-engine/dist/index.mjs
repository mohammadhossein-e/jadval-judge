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

// src/single-elimination/seeding.ts
function standardSeeding(bracketSize) {
  if (bracketSize === 2) return [1, 2];
  const half = standardSeeding(bracketSize / 2);
  const result = [];
  for (let i = 0; i < half.length; i++) {
    result.push(half[i]);
    result.push(bracketSize + 1 - half[i]);
  }
  return result;
}
function placeCompetitors(competitors, bracketSize, drawType, manualPlacements) {
  if (manualPlacements && manualPlacements.size > 0) {
    return manualPlacement(competitors, manualPlacements, bracketSize);
  }
  if (drawType === "random") {
    return randomPlacement(competitors, bracketSize);
  }
  return seededPlacement(competitors, bracketSize);
}
function seededPlacement(competitors, bracketSize) {
  const seeding = standardSeeding(bracketSize);
  const seedMap = /* @__PURE__ */ new Map();
  const claimedSeeds = /* @__PURE__ */ new Set();
  const unseeded = [];
  for (const c of competitors) {
    if (c.seed !== null && c.seed >= 1 && c.seed <= bracketSize && !claimedSeeds.has(c.seed)) {
      seedMap.set(c.seed, c);
      claimedSeeds.add(c.seed);
    } else {
      unseeded.push(c);
    }
  }
  const positions = new Array(bracketSize).fill(null);
  for (let pos = 0; pos < bracketSize; pos++) {
    const competitor = seedMap.get(seeding[pos]);
    if (competitor) {
      positions[pos] = competitor;
    }
  }
  let idx = 0;
  for (let pos = 0; pos < bracketSize; pos++) {
    if (positions[pos] === null && idx < unseeded.length) {
      positions[pos] = unseeded[idx++];
    }
  }
  return positions;
}
function randomPlacement(competitors, bracketSize) {
  const shuffled = shuffleArray(competitors);
  const virtualSeeded = shuffled.map((c, i) => ({ ...c, seed: i + 1 }));
  return seededPlacement(virtualSeeded, bracketSize);
}
function manualPlacement(competitors, placements, bracketSize) {
  const positions = new Array(bracketSize).fill(null);
  const competitorMap = new Map(competitors.map((c) => [c.id, c]));
  const placedIds = /* @__PURE__ */ new Set();
  for (const [position, competitorId] of placements) {
    if (position < 0 || position >= bracketSize) continue;
    const competitor = competitorMap.get(competitorId);
    if (competitor) {
      positions[position] = competitor;
      placedIds.add(competitorId);
    }
  }
  const unplaced = competitors.filter((c) => !placedIds.has(c.id));
  let idx = 0;
  for (let pos = 0; pos < bracketSize; pos++) {
    if (positions[pos] === null && idx < unplaced.length) {
      positions[pos] = unplaced[idx++];
    }
  }
  return positions;
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
function getBracketPreview(competitorCount, seeds) {
  const { bracketSize, totalRounds: rounds, byeCount } = calculateBracketInfo(competitorCount);
  if (byeCount === 0) {
    return { competitorCount, bracketSize, byeCount, totalRounds: rounds, seededByes: [] };
  }
  const existingSeeds = new Set(
    seeds.filter((s) => s !== null && s >= 1 && s <= bracketSize)
  );
  const seeding = standardSeeding(bracketSize);
  const seededByes = [];
  for (let i = 0; i < bracketSize; i += 2) {
    const seedA = seeding[i];
    const seedB = seeding[i + 1];
    const aExists = existingSeeds.has(seedA);
    const bExists = existingSeeds.has(seedB);
    if (aExists && !bExists) seededByes.push(seedA);
    else if (!aExists && bExists) seededByes.push(seedB);
  }
  seededByes.sort((a, b) => a - b);
  return {
    competitorCount,
    bracketSize,
    byeCount,
    totalRounds: rounds,
    seededByes
  };
}

// src/single-elimination/generator.ts
function generateBracket(competitors, drawType = "random", manualPlacements) {
  if (competitors.length < 2) {
    throw new Error("At least 2 competitors are required to generate a bracket");
  }
  if (competitors.length > 128) {
    throw new Error("Maximum 128 competitors allowed");
  }
  const { bracketSize, totalRounds: rounds, byeCount } = calculateBracketInfo(competitors.length);
  const positions = placeCompetitors(competitors, bracketSize, drawType, manualPlacements);
  const matches = buildMatches(positions, bracketSize, rounds);
  autoResolveByes(matches);
  const bracket = { size: bracketSize, totalRounds: rounds, matches };
  const byes = collectByeInfo(matches);
  return { bracket, byes };
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
function buildMatches(positions, bracketSize, rounds) {
  const matches = [];
  const round1Count = bracketSize / 2;
  for (let p = 0; p < round1Count; p++) {
    const posA = p * 2;
    const posB = p * 2 + 1;
    const compA = positions[posA] ?? null;
    const compB = positions[posB] ?? null;
    const isBye = compA === null !== (compB === null);
    matches.push({
      id: `R1P${p}`,
      round: 1,
      position: p,
      competitorA: compA,
      competitorB: compB,
      winner: null,
      isBye,
      nextMatchId: rounds > 1 ? `R2P${Math.floor(p / 2)}` : null,
      nextSlot: rounds > 1 ? p % 2 === 0 ? "A" : "B" : null
    });
  }
  for (let r = 2; r <= rounds; r++) {
    const count = bracketSize / Math.pow(2, r);
    for (let p = 0; p < count; p++) {
      matches.push({
        id: `R${r}P${p}`,
        round: r,
        position: p,
        competitorA: null,
        competitorB: null,
        winner: null,
        isBye: false,
        nextMatchId: r < rounds ? `R${r + 1}P${Math.floor(p / 2)}` : null,
        nextSlot: r < rounds ? p % 2 === 0 ? "A" : "B" : null
      });
    }
  }
  return matches;
}
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
function collectByeInfo(matches) {
  const byes = [];
  for (const match of matches) {
    if (match.round !== 1 || !match.isBye || !match.winner) continue;
    byes.push({ competitorId: match.winner.id, position: match.position * 2 });
  }
  return byes;
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
function cloneMatches(matches) {
  return matches.map((m) => ({
    ...m,
    competitorA: m.competitorA ? { ...m.competitorA } : null,
    competitorB: m.competitorB ? { ...m.competitorB } : null,
    winner: m.winner ? { ...m.winner } : null
  }));
}

// src/single-elimination/cascade.ts
function cascadeUndo(bracket, matchId) {
  const matches = cloneMatches2(bracket.matches);
  const match = matches.find((m) => m.id === matchId);
  if (!match?.winner) return { ...bracket, matches };
  const oldWinner = match.winner;
  match.winner = null;
  cascadeForward(matches, matchId, oldWinner);
  return { ...bracket, matches };
}
function cloneMatches2(matches) {
  return matches.map((m) => ({
    ...m,
    competitorA: m.competitorA ? { ...m.competitorA } : null,
    competitorB: m.competitorB ? { ...m.competitorB } : null,
    winner: m.winner ? { ...m.winner } : null
  }));
}
export {
  calculateBracketInfo,
  cascadeUndo,
  generateBracket,
  getBracketPreview,
  getChampion,
  isBracketComplete,
  placeCompetitors,
  resolveMatch,
  shuffleArray,
  standardSeeding
};
//# sourceMappingURL=index.mjs.map