import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BaseIconComponent, IconName } from '../../atoms/icon/base-icon.component';
import { LoadingSpinnerComponent } from '../../atoms/spinner/loading-spinner.component';
import { ErrorDisplayComponent } from '../../molecules/error-display/error-display.component';
import { StandingsRowComponent } from '../../molecules/standings-row/standings-row.component';
import { StandingsTableData } from '../../types/components.types';
import { Player } from '../../types/tournament.types';

export type StandingsViewMode = 'current' | 'final' | 'live';

@Component({
  selector: 'app-standings-table',
  standalone: true,
  imports: [
    CommonModule,
    StandingsRowComponent,
    BaseIconComponent,
    LoadingSpinnerComponent,
    ErrorDisplayComponent,
  ],
  template: `
    <div class="standings-table-container">
      <!-- Table Header -->
      <div class="table-header">
        <div class="header-info">
          <h3 class="table-title">
            <app-icon
              [name]="getTitleIcon()"
              size="md"
              [color]="getTitleColor()"
              [ariaLabel]="getAriaLabel()"
            >
            </app-icon>
            {{ getTableTitle() }}
          </h3>
        </div>

        <!-- Champion Banner (Tournament Complete) -->
        @if (data.tournamentComplete && data.winnerId && data.winnerName) {
        <div class="champion-banner">
          <div class="champion-content">
            <div class="champion-text">
              <div>
                <app-icon name="trophy" size="xl" color="warning" ariaLabel="Tournament Champion" />
                <h2>Tournament Champion</h2>
                <app-icon name="trophy" size="xl" color="warning" ariaLabel="Tournament Champion" />
              </div>

              <p class="champion-name">{{ data.winnerName }}</p>
              <p class="champion-subtitle">Congratulations to our tournament winner!</p>
            </div>
          </div>
        </div>
        }
      </div>

      <!-- Error Display -->
      @if (data.error) {
      <app-error-display
        [message]="data.error"
        type="error"
        [dismissible]="true"
        (dismissed)="onErrorDismiss()"
      >
      </app-error-display>
      }

      <!-- Loading State -->
      @if (data.isLoading) {
      <div class="loading-container">
        <app-loading-spinner size="lg" variant="primary" loadingText="Loading standings...">
        </app-loading-spinner>
      </div>
      } @else {
      <!-- Standings Table -->
      @if (data.players.length > 0) {
      <div class="table-container">
        <table class="standings-table">
          <thead>
            <tr>
              <th class="rank-col">Rank</th>
              <th class="player-col">Player</th>
              <th class="points-col">Points</th>
              <th class="wins-col">Wins</th>
              <th class="losses-col">Losses</th>
              <th class="winrate-col">Win Rate</th>
              @if (showGamesPlayed) {
              <th class="games-col">Games</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (player of getPlayersWithRankings(); track player.id) {
            <tr
              app-standings-row
              [player]="player"
              [showGamesPlayed]="showGamesPlayed"
              [highlightTop3]="highlightTop3"
            ></tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Table Summary -->
      <div class="table-summary">
        <div class="summary-stats">
          <div class="stat-group">
            <div class="stat-item">
              <app-icon name="users" size="sm" color="primary"></app-icon>
              <span class="stat-label">Total Players:</span>
              <span class="stat-value">{{ data.players.length }}</span>
            </div>

            <div class="stat-item">
              <app-icon name="target" size="sm" color="success"></app-icon>
              <span class="stat-label">Total Games:</span>
              <span class="stat-value">{{ this.data.totalGames }}</span>
            </div>
          </div>

          <div class="stat-group">
            <div class="stat-item">
              <app-icon name="trending-up" size="sm" color="info"></app-icon>
              <span class="stat-label">Avg Win Rate:</span>
              <span class="stat-value">{{ getAverageWinRate() }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Top 3 Podium (Tournament Complete) -->
      @if (data.tournamentComplete && showPodium && data.players.length >= 3) {
      <div class="podium-section">
        <h4 class="podium-title">🏆 Final Podium</h4>
        <div class="podium">
          @for (player of getTopThreePlayers(); track player.id; let i = $index) {
          <div class="podium-place" [class]="getPodiumClass(i)">
            <div class="podium-rank">
              <app-icon [name]="getPodiumIcon(i)" size="lg" [color]="getPodiumColor(i)"> </app-icon>
            </div>
            <div class="podium-player">
              <span class="podium-name">{{ player.name }}</span>
              <span class="podium-points">{{ player.points }} pts</span>
              <span class="podium-record">{{ player.wins }}W - {{ player.losses }}L</span>
            </div>
          </div>
          }
        </div>
      </div>
      } } @else {
      <!-- Empty State -->
      <div class="empty-state">
        <app-icon name="users" size="xl" color="secondary" ariaLabel="No players"> </app-icon>
        <h3>No Players</h3>
        <p>{{ getEmptyStateMessage() }}</p>
      </div>
      } }
    </div>
  `,
  styleUrl: './standings-table.component.css',
})
export class StandingsTableComponent {
  @Input() data!: StandingsTableData;
  @Input() viewMode: StandingsViewMode = 'current';
  @Input() showGamesPlayed: boolean = false;
  @Input() highlightTop3: boolean = true;
  @Input() showPodium: boolean = true;
  @Input() title?: string;

  @Output() errorDismissed = new EventEmitter<void>();

  onErrorDismiss(): void {
    this.errorDismissed.emit();
  }

  getTableTitle(): string {
    if (this.title) return this.title;

    switch (this.viewMode) {
      case 'final':
        return 'Final Standings';
      case 'live':
        return 'Live Standings';
      case 'current':
      default:
        return this.data.tournamentComplete ? 'Final Standings' : 'Current Standings';
    }
  }

  getTitleIcon(): IconName {
    if (this.data.tournamentComplete) return 'podium';
    return 'trending-up';
  }

  getTitleColor(): string {
    if (this.data.tournamentComplete) return 'warning';
    return 'primary';
  }

  getAriaLabel(): string {
    return this.data.tournamentComplete
      ? 'Final tournament standings'
      : 'Current tournament standings';
  }

  getPlayersWithRankings(): any[] {
    const sortedPlayers = [...this.data.players].sort((a, b) => {
      // Sort by points first, then by wins, then by win rate
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.winRate - a.winRate;
    });

    return sortedPlayers.map((player, index) => ({
      ...player,
      rank: index + 1,
      isChampion: index === 0 && this.data.tournamentComplete,
      isRunnerUp: index === 1 && this.data.tournamentComplete,
      isThirdPlace: index === 2 && this.data.tournamentComplete,
    }));
  }

  getTopThreePlayers(): Player[] {
    return this.getPlayersWithRankings().slice(0, 3);
  }

  getHighestPoints(): number {
    return this.data.players.length > 0 ? Math.max(...this.data.players.map((p) => p.points)) : 0;
  }

  getAverageWinRate(): number {
    if (this.data.players.length === 0) return 0;
    const totalWinRate = this.data.players.reduce((sum, player) => sum + player.winRate, 0);
    return Math.round((totalWinRate / this.data.players.length) * 100);
  }

  getPodiumClass(index: number): string {
    const classes = ['first-place', 'second-place', 'third-place'];
    return classes[index] || '';
  }

  getPodiumIcon(index: number): IconName {
    const icons: IconName[] = ['medal-first', 'medal-second', 'medal-thrid'];
    return icons[index] || 'medal-first';
  }

  getPodiumColor(index: number): string {
    const colors = ['warning', 'secondary', 'success'];
    return colors[index] || 'secondary';
  }

  getEmptyStateMessage(): string {
    if (this.data.tournamentComplete) {
      return 'This tournament had no players.';
    }
    return 'No players have joined this tournament yet.';
  }

  // Utility methods for external use
  getPlayerByRank(rank: number): Player | null {
    const rankedPlayers = this.getPlayersWithRankings();
    return rankedPlayers.find((p) => p.rank === rank) || null;
  }

  getPlayerRank(playerId: number): number {
    const rankedPlayers = this.getPlayersWithRankings();
    const player = rankedPlayers.find((p) => p.id === playerId);
    return player?.rank || 0;
  }
}
