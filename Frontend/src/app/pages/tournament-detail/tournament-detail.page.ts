import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, Subject, takeUntil } from 'rxjs';

// Import organisms
import { MatchTableComponent } from '../../shared/organisms/match-table/match-table.component';
import { PlayerManagementComponent } from '../../shared/organisms/player-management/player-management.component';
import { StandingsTableComponent } from '../../shared/organisms/standings-table/standings-table.component';

// Import molecules and atoms
import { BaseBadgeComponent } from '../../shared/atoms/badge/base-badge.component';
import { BaseButtonComponent } from '../../shared/atoms/button/base-button.component';
import { BaseIconComponent } from '../../shared/atoms/icon/base-icon.component';
import { LoadingSpinnerComponent } from '../../shared/atoms/spinner/loading-spinner.component';
import { ErrorDisplayComponent } from '../../shared/molecules/error-display/error-display.component';

// Import types and services
import { PasswordModalComponent } from '../../shared/molecules/password-modal/password-modal.component';
import { LocalStorageService } from '../../shared/services/local-storage.service';
import { TournamentService } from '../../shared/services/tournament.service';
import { WebSocketService, WebSocketUpdate } from '../../shared/services/websocket.service';
import {
  MatchTableData,
  MatchTableState,
  PlayerManagementState,
  StandingsTableData,
  TournamentDetailState,
} from '../../shared/types/components.types';
import {
  Round,
  Tournament,
  TournamentStatus,
  TournamentType,
} from '../../shared/types/tournament.types';

@Component({
  selector: 'app-tournament-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    PlayerManagementComponent,
    MatchTableComponent,
    StandingsTableComponent,
    ErrorDisplayComponent,
    LoadingSpinnerComponent,
    BaseButtonComponent,
    BaseIconComponent,
    BaseBadgeComponent,
    PasswordModalComponent,
  ],
  templateUrl: './tournament-detail.page.html',
  styleUrl: './tournament-detail.page.css',
})
export class TournamentDetailPageComponent implements OnInit, OnDestroy {
  // Dependency injection
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private tournamentService: TournamentService = inject(TournamentService);
  private webSocketService: WebSocketService = inject(WebSocketService);
  private localStorageService: LocalStorageService = inject(LocalStorageService);

  // Component state
  private destroy$ = new Subject<void>();
  private tournamentId: number = 0;

  state: TournamentDetailState = {
    tournament: null,
    isLoading: true,
    error: null,
    managementMode: false,
    isUpdating: false,
    passwordModal: {
      isVisible: false,
      title: 'Enter Management Mode',
      message: 'Enter the tournament password to manage this tournament.',
      isLoading: false,
      error: null,
    },
  };

  // Expose enums for template
  TournamentStatus = TournamentStatus;
  TournamentType = TournamentType;

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.tournamentId = +params['id'];
      this.loadTournament();
    });
  }

  private async initializeWebSocket(): Promise<void> {
    // Don't connect WebSocket for completed tournaments
    if (this.state.tournament?.status === TournamentStatus.Completed) {
      console.log('Skipping WebSocket connection for completed tournament');
      return;
    }

    try {
      // Join tournament WebSocket group
      await this.webSocketService.joinTournament(this.tournamentId);

      // Subscribe to updates
      this.webSocketService.updates$
        .pipe(takeUntil(this.destroy$))
        .subscribe((update: WebSocketUpdate) => {
          if (update.tournamentId === this.tournamentId) {
            this.handleWebSocketUpdate(update);
          }
        });
    } catch (error: unknown) {
      console.warn('Failed to initialize WebSocket:', error);
    }
  }

  ngOnDestroy(): void {
    this.webSocketService.leaveTournament(true).catch((error: unknown) => {
      console.warn('Failed to leave WebSocket group:', error);
    });
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTournament(): void {
    this.state.isLoading = true;
    this.state.error = null;

    this.tournamentService
      .getTournament(this.tournamentId)
      .pipe(
        finalize(() => (this.state.isLoading = false)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (tournament: Tournament) => {
          this.state.tournament = tournament;
          // Auto-enter management mode if password is stored
          if (this.localStorageService.hasPassword(this.tournamentId)) {
            this.state.managementMode = true;
          }
          // Initialize WebSocket connection after tournament data is loaded
          this.initializeWebSocket();
        },
        error: (error: any) => {
          console.error('Failed to load tournament:', error);
          this.state.error = error.message || 'Failed to load tournament. Please try again.';
        },
      });
  }

  // Navigation methods
  goBack(): void {
    this.router.navigate(['/tournaments']);
  }

  // Management mode methods
  enterManagementMode(): void {
    // Check if password is already stored
    if (this.localStorageService.hasPassword(this.tournamentId)) {
      this.state.managementMode = true;
    } else {
      // Show password modal
      this.state.passwordModal = {
        ...this.state.passwordModal,
        isVisible: true,
        error: null,
      };
    }
  }

  exitManagementMode(): void {
    this.state.managementMode = false;
  }

  onPasswordSubmitted(password: string): void {
    this.state.passwordModal.isLoading = true;
    this.state.passwordModal.error = null;

    const request = {
      tournamentId: this.tournamentId,
      password,
    };

    this.tournamentService
      .validateTournamentPassword(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.state.passwordModal.isLoading = false;
          if (response.isValid) {
            // Password is correct - store it and enter management mode
            this.localStorageService.setPassword(this.tournamentId, password);
            this.state.managementMode = true;
            this.state.passwordModal.isVisible = false;
          } else {
            // Password is incorrect - show error
            this.state.passwordModal.error = 'Invalid password. Please try again.';
          }
        },
        error: (error) => {
          this.state.passwordModal.isLoading = false;
          this.state.passwordModal.error = 'Failed to validate password. Please try again.';
          console.error('Password validation failed:', error);
        },
      });
  }

  onPasswordCancelled(): void {
    this.state.passwordModal.isVisible = false;
    this.state.passwordModal.error = null;
  }

  // Player management methods
  onPlayerAdd(playerName: string): void {
    if (!this.state.tournament) return;

    this.state.isUpdating = true;
    const request = {
      tournamentId: this.tournamentId,
      name: playerName,
      password: '', //Service will fetch password from localstorage
    };

    this.tournamentService
      .addPlayer(request)
      .pipe(
        finalize(() => (this.state.isUpdating = false)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: { message: string }) => {
          console.log('Player added successfully:', response.message);
          // Tournament data will be updated via WebSocket
        },
        error: (error: any) => {
          console.error('Failed to add player:', error);
          this.state.error = error.message || 'Failed to add player. Please try again.';
        },
      });
  }

  onPlayerRemove(event: { playerId: number; playerName: string }): void {
    if (!this.state.tournament) return;

    this.state.isUpdating = true;
    const request = {
      tournamentId: this.tournamentId,
      playerId: event.playerId,
      password: '', //Service will fetch password from localstorage
    };

    this.tournamentService
      .removePlayer(request)
      .pipe(
        finalize(() => (this.state.isUpdating = false)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: { message: string }) => {
          console.log('Player removed successfully:', response.message);
          // Tournament data will be updated via WebSocket
        },
        error: (error: any) => {
          console.error('Failed to remove player:', error);
          this.state.error = error.message || 'Failed to remove player. Please try again.';
        },
      });
  }

  onTournamentStart(): void {
    if (!this.state.tournament) return;

    this.state.isUpdating = true;
    const request = {
      tournamentId: this.tournamentId,
      password: '',
    };

    this.tournamentService
      .startTournament(request)
      .pipe(
        finalize(() => (this.state.isUpdating = false)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: { message: string }) => {
          console.log('Tournament started successfully:', response.message);
          // Tournament data will be updated via WebSocket
        },
        error: (error: any) => {
          console.error('Failed to start tournament:', error);
          console.error('Request was:', request);
          this.state.error = error.message || 'Failed to start tournament. Please try again.';
        },
      });
  }

  // Match management methods
  onWinnerChange(event: { matchId: number; winnerId: number | null; playerName?: string }): void {
    if (!this.state.tournament) return;

    const request = {
      tournamentId: this.tournamentId,
      matchId: event.matchId,
      winnerId: event.winnerId || 0,
    };

    this.tournamentService
      .setMatchWinner(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: { message: string }) => {
          console.log('Winner selection broadcasted:', response.message);
          // Tournament data will be updated via WebSocket
        },
        error: (error: any) => {
          console.error('Failed to set match winner:', error);
          this.state.error = error.message || 'Failed to set match winner. Please try again.';
        },
      });
  }

  onNextRoundStart(): void {
    if (!this.state.tournament) return;

    // Collect all match results with winners from current round
    const currentRound = this.getCurrentRound();
    if (!currentRound) {
      this.state.error = 'No current round found';
      return;
    }

    const matchResults = currentRound.matches
      .filter((match) => match.winnerId) // Only matches with winners
      .map((match) => ({
        matchId: match.id,
        winnerId: match.winnerId!,
      }));

    // Ensure all matches have winners before proceeding
    if (matchResults.length !== currentRound.matches.length) {
      this.state.error = 'All matches must have winners before starting the next round';
      return;
    }

    this.state.isUpdating = true;
    const request = {
      tournamentId: this.tournamentId,
      matchResults: matchResults,
    };

    this.tournamentService
      .startNextRound(request)
      .pipe(
        finalize(() => (this.state.isUpdating = false)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: { message: string }) => {
          console.log('Next round started:', response.message);
          // Tournament data will be updated via WebSocket
        },
        error: (error: any) => {
          console.error('Failed to start next round:', error);
          this.state.error = error.message || 'Failed to start next round. Please try again.';
        },
      });
  }

  clearError(): void {
    this.state.error = null;
  }

  // WebSocket update handling
  handleWebSocketUpdate(update: WebSocketUpdate): void {
    switch (update.type) {
      case 'PlayerAdded':
        // Add player to local state
        if (this.state.tournament && update.data) {
          this.state.tournament.players.push(update.data);
        }
        break;
      case 'PlayerRemoved':
        // Remove player from local state by ID
        if (this.state.tournament && update.data.playerId) {
          this.state.tournament.players = this.state.tournament.players.filter(
            (player) => player.id !== update.data.playerId
          );
        }
        break;
      case 'TournamentStarted':
      case 'NewRound':
      case 'TournamentUpdated':
        // Use the tournament data directly from WebSocket update
        this.state.tournament = update.data;

        // Check if tournament just completed and disconnect WebSocket
        if (update.data.status === TournamentStatus.Completed) {
          console.log('Tournament completed via WebSocket - disconnecting');
          this.webSocketService
            .leaveTournament()
            .catch(console.warn)
            .then(() => this.webSocketService.disconnect().catch(console.warn));
        }
        break;
      case 'WinnerSelected':
        // Handle winner selection locally without DB reload
        this.handleWinnerSelection(update.data);
        break;
    }
  }

  private handleWinnerSelection(data: any): void {
    if (!this.state.tournament || !data.matchId || !data.winnerId) return;

    // Find and update the match in the current tournament state
    const currentRound = this.getCurrentRound();
    if (currentRound) {
      const match = currentRound.matches.find((m) => m.id === data.matchId);
      if (match) {
        // Find the winner player
        const winner = match.players.find((p) => p.id === data.winnerId);
        if (winner) {
          // Update the match with the selected winner
          match.winnerId = data.winnerId;
          match.winner = winner;

          // Force change detection by creating a new tournament object
          this.state.tournament = { ...this.state.tournament };

          console.log(`Winner selected for match ${data.matchId}:`, winner.name);
        }
      }
    }
  }

  // Data mapping methods
  getPlayerManagementState(): PlayerManagementState {
    return {
      isAddingPlayer: this.state.isUpdating,
      isRemovingPlayer: this.state.isUpdating,
      isStartingTournament: this.state.isUpdating,
      canManage: this.state.managementMode,
      error: this.state.error,
      addPlayerError: null,
    };
  }

  getMatchTableData(): MatchTableData {
    const currentRound = this.getCurrentRound();
    return {
      round: currentRound!,
      canManage: this.state.managementMode,
      isLoading: this.state.isUpdating,
      error: this.state.error,
    };
  }

  getMatchTableState(): MatchTableState {
    return {
      updatingMatchId: this.state.isUpdating ? -1 : null,
      canStartNextRound: this.canStartNextRound(),
      isStartingNextRound: this.state.isUpdating,
      nextRoundButtonText: this.getNextRoundButtonText(),
    };
  }

  getStandingsData(): StandingsTableData {
    return {
      players: this.state.tournament?.players || [],
      isLoading: this.state.isUpdating,
      error: this.state.error,
      tournamentComplete: this.state.tournament?.status === TournamentStatus.Completed,
      winnerId: this.state.tournament?.winnerId,
      winnerName: this.getWinnerName(),
      totalGames:
        this.state.tournament?.rounds.reduce((sum, obj) => sum + obj.matches.length, 0) ?? 0,
    };
  }

  // Helper methods
  getCurrentRound(): Round | null {
    if (!this.state.tournament?.rounds) return null;
    return this.state.tournament.rounds.find((r) => !r.isCompleted) || null;
  }

  canStartNextRound(): boolean {
    const currentRound = this.getCurrentRound();
    if (!currentRound) return false;

    return currentRound.matches.every((match) => match.winnerId) && this.state.managementMode;
  }

  getNextRoundButtonText(): string {
    return this.getCurrentRound()?.roundType == 'Final'
      ? 'Complete Tournament'
      : 'Start Next Round';
  }

  getCompletedMatchesInRound(round: Round): number {
    return round.matches.filter((match) => match.winnerId).length;
  }

  getTournamentTypeName(): string {
    switch (this.state.tournament?.type) {
      case TournamentType.Swiss:
        return 'Swiss Tournament';
      case TournamentType.ChampionsMeeting:
        return 'Champions Meeting';
      default:
        return 'Unknown';
    }
  }

  getStatusText(): string {
    switch (this.state.tournament?.status) {
      case TournamentStatus.Created:
        return 'Setup Phase';
      case TournamentStatus.InProgress:
        return 'In Progress';
      case TournamentStatus.Completed:
        return 'Completed';
      default:
        return 'Unknown';
    }
  }

  getWinnerName(): string {
    if (!this.state.tournament?.winnerId) return '';
    const winner = this.state.tournament.players.find(
      (p) => p.id === this.state.tournament?.winnerId
    );
    return winner?.name || '';
  }

  getTypeVariant(): 'primary' | 'info' {
    return this.state.tournament?.type === TournamentType.Swiss ? 'primary' : 'info';
  }

  getStatusVariant(): 'warning' | 'primary' | 'success' {
    switch (this.state.tournament?.status) {
      case TournamentStatus.Created:
        return 'warning';
      case TournamentStatus.InProgress:
        return 'primary';
      case TournamentStatus.Completed:
        return 'success';
      default:
        return 'warning';
    }
  }
}
