export function nextPowerOf2(n: number): number {
  if (n <= 0) return 1;
  let power = 1;
  while (power < n) {
    power *= 2;
  }
  return power;
}

export function logBase2(n: number): number {
  return Math.log2(n);
}

export function shuffleArray<T>(array: readonly T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function cloneMatches(matches: readonly import('./types').EngineMatch[]): import('./types').EngineMatch[] {
  return matches.map((m) => ({
    ...m,
    competitorA: m.competitorA ? { ...m.competitorA } : null,
    competitorB: m.competitorB ? { ...m.competitorB } : null,
    winner: m.winner ? { ...m.winner } : null,
  }));
}
