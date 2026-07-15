export type TournamentType = 'kata' | 'kumite';

export interface Tournament {
  id: string;
  name: string;
  date: string;
  organization: string | null;
  tournamentType: TournamentType;
  editPin: string;
  createdAt: string;
  updatedAt: string;
}
