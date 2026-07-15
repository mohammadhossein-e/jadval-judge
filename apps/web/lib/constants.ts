import type { Gender, AgeGroup, BeltLevel, TournamentType } from '@jadval/types';

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

export const AGE_GROUP_OPTIONS: { value: AgeGroup; label: string }[] = [
  { value: 'under-12', label: 'Under 12' },
  { value: '12-14', label: '12-14' },
  { value: '15-17', label: '15-17' },
  { value: '18-34', label: '18-34' },
  { value: '35-44', label: '35-44' },
  { value: '45-54', label: '45-54' },
  { value: '55-64', label: '55-64' },
  { value: '65-plus', label: '65+' },
];

export const BELT_LEVEL_OPTIONS: { value: BeltLevel; label: string }[] = [
  { value: 'white', label: 'White' },
  { value: 'yellow', label: 'Yellow' },
  { value: 'orange', label: 'Orange' },
  { value: 'green', label: 'Green' },
  { value: 'blue', label: 'Blue' },
  { value: 'purple', label: 'Purple' },
  { value: 'brown', label: 'Brown' },
  { value: 'black', label: 'Black' },
  { value: 'all', label: 'All Levels' },
];

export const TOURNAMENT_TYPE_OPTIONS: { value: TournamentType; label: string }[] = [
  { value: 'kata', label: 'Kata' },
  { value: 'kumite', label: 'Kumite' },
];

export const GENDER_LABELS: Record<Gender, string> = Object.fromEntries(
  GENDER_OPTIONS.map((o) => [o.value, o.label]),
) as Record<Gender, string>;

export const AGE_GROUP_LABELS: Record<AgeGroup, string> = Object.fromEntries(
  AGE_GROUP_OPTIONS.map((o) => [o.value, o.label]),
) as Record<AgeGroup, string>;

export const BELT_LEVEL_LABELS: Record<BeltLevel, string> = Object.fromEntries(
  BELT_LEVEL_OPTIONS.map((o) => [o.value, o.label]),
) as Record<BeltLevel, string>;
