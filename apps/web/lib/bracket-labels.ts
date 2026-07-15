const ROUND_LABELS: Record<number, string> = {
  1: 'Final',
  2: 'Semifinals',
  4: 'Quarterfinals',
  8: 'Round of 16',
  16: 'Round of 32',
  32: 'Round of 64',
  64: 'Round of 128',
};

export function getRoundLabel(round: number, totalRounds: number): string {
  const matchesInRound = Math.pow(2, totalRounds - round);
  if (matchesInRound in ROUND_LABELS) {
    return ROUND_LABELS[matchesInRound];
  }
  return `Round ${round}`;
}
