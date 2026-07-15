export type CategoryStatus = 'SETUP' | 'IN_PROGRESS' | 'COMPLETED';
export type DrawType = 'RANDOM' | 'MANUAL';
export type Gender = 'male' | 'female';
export type AgeGroup =
  | 'under-12'
  | '12-14'
  | '15-17'
  | '18-34'
  | '35-44'
  | '45-54'
  | '55-64'
  | '65-plus';
export type BeltLevel =
  | 'white'
  | 'yellow'
  | 'orange'
  | 'green'
  | 'blue'
  | 'purple'
  | 'brown'
  | 'black'
  | 'all';

export interface Category {
  id: string;
  tournamentId: string;
  name: string;
  status: CategoryStatus;
  gender: Gender | null;
  ageGroup: AgeGroup | null;
  beltLevel: BeltLevel | null;
  bracketSize: number | null;
  drawType: DrawType | null;
  totalRounds: number | null;
  slug: string;
  createdAt: string;
  updatedAt: string;
}
