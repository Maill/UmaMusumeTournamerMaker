export enum TournamentType {
  Swiss = 1,
  ChampionsMeeting = 2,
}

export enum TournamentStatus {
  Created = 1,
  InProgress = 2,
  Completed = 3,
}

export interface Player {
  id: number;
  name: string;
  points: number;
  wins: number;
  losses: number;
  winRate: number;
}

export interface MatchPlayer {
  id: number;
  name: string;
}

export interface Match {
  id: number;
  players: MatchPlayer[];
  winner?: MatchPlayer;
  winnerId?: number;
  completedAt?: Date;
}

export interface Round {
  id: number;
  roundNumber: number;
  matches: Match[];
  isCompleted: boolean;
  roundType: string;
}

export interface Tournament {
  id: number;
  name: string;
  type: TournamentType;
  status: TournamentStatus;
  players: Player[];
  rounds: Round[];
  currentRound: number;
  winnerId?: number;
  createdAt: Date;
  password?: string;
}

export interface TournamentListItem {
  id: number;
  name: string;
  type: TournamentType;
  status: TournamentStatus;
  playersCount: number;
  currentRound: number;
  createdAt: Date;
}
