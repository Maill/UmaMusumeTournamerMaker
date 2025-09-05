import { TournamentType } from './tournament.types';

export interface AddPlayerRequest {
  tournamentId: number;
  name: string;
  password: string;
}

export interface RemovePlayerRequest {
  tournamentId: number;
  playerId: number;
  password: string;
}

export interface SetMatchWinnerRequest {
  tournamentId: number;
  matchId: number;
  winnerId: number;
  password?: string;
}

export interface StartTournamentRequest {
  tournamentId: number;
  password: string;
}

export interface StartNextRoundRequest {
  tournamentId: number;
  matchResults: { matchId: number; winnerId: number }[];
  password?: string;
}

export interface UpdateTournamentRequest {
  tournamentId: number;
  name?: string;
  password?: string;
}

export interface DeleteTournamentRequest {
  tournamentId: number;
  password?: string;
}

export interface ValidatePasswordRequest {
  tournamentId: number;
  password: string;
}

export interface PasswordValidationResponse {
  message: string;
}

export interface CreateTournamentRequest {
  name: string;
  type: TournamentType;
  password?: string;
}
