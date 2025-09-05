import {
  Match,
  MatchPlayer,
  Player,
  Round,
  Tournament,
  TournamentStatus,
  TournamentType,
} from './tournament.types';

export interface TournamentDetailState {
  tournament: Tournament | null;
  isLoading: boolean;
  error: string | null;
  managementMode: boolean;
  isUpdating: boolean;
  passwordModal: PasswordModalData;
}

export interface PasswordModalData {
  isVisible: boolean;
  title: string;
  message: string;
  isLoading: boolean;
  error: string | null;
}

export interface CreateTournamentPageState {
  isCreating: boolean;
  error: string | null;
  formData: TournamentFormData | null;
}

export interface TournamentFormData {
  name: string;
  type: TournamentType;
  password?: string;
}

export interface TournamentFormState {
  isLoading: boolean;
  error: string | null;
  showPassword: boolean;
}

export interface StandingsTableData {
  players: Player[];
  isLoading: boolean;
  error: string | null;
  tournamentComplete: boolean;
  winnerId?: number;
  winnerName?: string;
  totalGames: number;
}

export interface PlayerManagementState {
  isAddingPlayer: boolean;
  isRemovingPlayer: boolean;
  isStartingTournament: boolean;
  canManage: boolean;
  error: string | null;
  addPlayerError: string | null;
}

export interface PlayerAction {
  type: 'add' | 'remove' | 'start-tournament';
  playerId?: number;
  playerName?: string;
}

export interface MatchTableData {
  round: Round;
  canManage: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface MatchTableState {
  updatingMatchId: number | null;
  canStartNextRound: boolean;
  isStartingNextRound: boolean;
  nextRoundButtonText: string;
}

export interface WinnerSelectorData {
  matchId: number;
  players: MatchPlayer[];
  selectedWinnerId: number | null;
  disabled: boolean;
  error: string | null;
}

export interface TournamentDeleteModalData {
  isVisible: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface TournamentCardData {
  id: number;
  name: string;
  type: TournamentType;
  status: TournamentStatus;
  playersCount: number;
  currentRound: number;
  createdAt: Date;
  winnerId?: number;
  winnerName?: string;
}

export interface StandingsRowData extends Player {
  rank: number;
  isChampion?: boolean;
  isRunnerUp?: boolean;
  isThirdPlace?: boolean;
}

export interface PlayerInputData {
  name: string;
  error: string | null;
  isLoading: boolean;
}

export interface MatchRowData extends Match {
  matchNumber: number;
  canManage: boolean;
}

export type ErrorType = 'error' | 'warning' | 'info';

export interface ErrorDisplayData {
  message: string;
  type: ErrorType;
  retryable: boolean;
  dismissible: boolean;
}

export interface SelectOption<T = any> {
  value: T;
  label: string;
  disabled?: boolean;
}
