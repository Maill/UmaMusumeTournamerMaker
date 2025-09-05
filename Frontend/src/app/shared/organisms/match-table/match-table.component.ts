import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BaseBadgeComponent } from '../../atoms/badge/base-badge.component';
import { BaseButtonComponent } from '../../atoms/button/base-button.component';
import { BaseIconComponent, IconName } from '../../atoms/icon/base-icon.component';
import { LoadingSpinnerComponent } from '../../atoms/spinner/loading-spinner.component';
import { ErrorDisplayComponent } from '../../molecules/error-display/error-display.component';
import { MatchRowComponent } from '../../molecules/match-row/match-row.component';
import { MatchTableData, MatchTableState } from '../../types/components.types';

@Component({
  selector: 'app-match-table',
  standalone: true,
  imports: [
    CommonModule,
    MatchRowComponent,
    BaseIconComponent,
    LoadingSpinnerComponent,
    ErrorDisplayComponent,
    BaseBadgeComponent,
    BaseButtonComponent,
  ],
  template: `
    <div class="match-table-container">
      <!-- Table Header -->
      <div class="table-header">
        <div class="header-info">
          <h3 class="table-title">
            <app-icon [name]="getTitleIcon()" size="md" color="primary" ariaLabel="Matches">
            </app-icon>
            {{ getTitleText() }}
          </h3>

          <div class="round-status">
            @if (data.round.isCompleted) {
            <app-badge variant="success">
              <app-icon name="check" size="xs"></app-icon>
              Round Complete
            </app-badge>
            } @else {
            <app-badge variant="warning">
              <app-icon name="clock" size="xs"></app-icon>
              In Progress
            </app-badge>
            }

            <span class="match-count">
              {{ getCompletedMatchesCount() }} / {{ data.round.matches.length }} matches complete
            </span>
          </div>
        </div>
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
        <app-loading-spinner size="lg" variant="primary" loadingText="Loading matches...">
        </app-loading-spinner>
      </div>
      } @else {
      <!-- Matches Table -->
      @if (data.round.matches.length > 0) {
      <div class="table-container">
        <table class="matches-table">
          <thead>
            <tr>
              <th class="match-col">Match</th>
              <th class="players-col">Players</th>
              <th class="status-col">Status</th>
              <th class="winner-col">Winner</th>
              @if (data.canManage) {
              <th class="actions-col">Actions</th>
              } @if (showCompletedTime) {
              <th class="completed-col">Completed</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (match of getMatchesWithNumbers(); track match.id) {
            <tr
              app-match-row
              [match]="match"
              [allowWinnerChange]="data.canManage"
              [showCompletedAt]="showCompletedTime"
              (winnerChanged)="onWinnerChange($event)"
            ></tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Table Summary -->
      <div class="table-summary">
        <div class="summary-stats">
          <div class="stat-item">
            <app-icon name="check" size="sm" color="success"></app-icon>
            <span>{{ getCompletedMatchesCount() }} Completed</span>
          </div>

          <div class="stat-item">
            <app-icon name="clock" size="sm" color="warning"></app-icon>
            <span>{{ getPendingMatchesCount() }} Pending</span>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill" [style.width.%]="getProgressPercentage()"></div>
          </div>
          <span class="progress-text">{{ getProgressPercentage() }}% Complete</span>
        </div>
      </div>

      <!-- Next Round Action -->
      @if (data.canManage && state.canStartNextRound) {
      <div class="next-round-section">
        <div class="next-round-info">
          <app-icon [name]="getNextRoundIcon()" size="md" color="primary"> </app-icon>
          <div class="next-round-text">
            <h4>{{ getNextRoundTitle() }}</h4>
            <p>{{ getNextRoundText() }}</p>
          </div>
        </div>

        <app-button
          variant="primary"
          size="lg"
          [loading]="state.isStartingNextRound"
          loadingText="Loading..."
          [disabled]="state.isStartingNextRound"
          (clicked)="onStartNextRound()"
        >
          {{ state.nextRoundButtonText }}
        </app-button>
      </div>
      }

      <!-- Round Instructions -->
      @if (!data.round.isCompleted && getPendingMatchesCount() > 0) {
      <div class="instructions">
        <app-icon name="info" size="sm" color="info"> </app-icon>
        <p>
          @if (data.canManage) { Select winners for all matches to complete this round and proceed
          to the next. } @else { Waiting for tournament organizer to set match winners. }
        </p>
      </div>
      } } @else {
      <!-- Empty State -->
      <div class="empty-state">
        <app-icon name="target" size="xl" color="secondary" ariaLabel="No matches"> </app-icon>
        <h3>No Matches</h3>
        <p>This round has no matches scheduled.</p>
      </div>
      } }
    </div>
  `,
  styleUrl: './match-table.component.css',
})
export class MatchTableComponent {
  @Input() data!: MatchTableData;
  @Input() state: MatchTableState = {
    updatingMatchId: null,
    canStartNextRound: false,
    isStartingNextRound: false,
    nextRoundButtonText: 'Start Next Round',
  };
  @Input() showCompletedTime: boolean = false;

  @Output() winnerChanged = new EventEmitter<{
    matchId: number;
    winnerId: number | null;
    playerName?: string;
  }>();
  @Output() nextRoundStarted = new EventEmitter<void>();
  @Output() errorDismissed = new EventEmitter<void>();

  onWinnerChange(event: { matchId: number; winnerId: number | null; playerName?: string }): void {
    this.winnerChanged.emit(event);
  }

  onStartNextRound(): void {
    this.nextRoundStarted.emit();
  }

  onErrorDismiss(): void {
    this.errorDismissed.emit();
  }

  getMatchesWithNumbers(): any[] {
    return this.data.round.matches.map((match, index) => ({
      ...match,
      matchNumber: index + 1,
      canManage: this.data.canManage,
    }));
  }

  getCompletedMatchesCount(): number {
    return this.data.round.matches.filter((match) => match.winnerId).length;
  }

  getPendingMatchesCount(): number {
    return this.data.round.matches.filter((match) => !match.winnerId).length;
  }

  getProgressPercentage(): number {
    const total = this.data.round.matches.length;
    if (total === 0) return 100;

    const completed = this.getCompletedMatchesCount();
    return Math.round((completed / total) * 100);
  }

  getTotalMatches(): number {
    return this.data.round.matches.length;
  }

  isRoundComplete(): boolean {
    return this.data.round.isCompleted || this.getPendingMatchesCount() === 0;
  }

  getMatchStatusSummary(): { completed: number; pending: number; total: number } {
    const total = this.data.round.matches.length;
    const completed = this.getCompletedMatchesCount();
    const pending = total - completed;

    return { completed, pending, total };
  }

  getNextRoundText(): string {
    return this.isRoundFinal()
      ? 'Crown you tournament winner!'
      : 'All matches have been completed. Ready to proceed to the next round.';
  }

  getNextRoundTitle(): string {
    return this.isRoundFinal() ? 'Finale complete!' : 'Round Complete!';
  }

  getNextRoundIcon(): IconName {
    return this.isRoundFinal() ? 'confetti' : 'chevron-right';
  }

  getTitleIcon(): IconName {
    return this.isRoundFinal() ? 'trophy' : 'target';
  }

  getTitleText(): string {
    const baseText: string = `Round ${this.data.round.roundNumber} matches`;

    if (this.isRoundFinal()) {
      return 'Final Round';
    }

    if (this.data.round.roundType == 'Tiebreaker') {
      return `Tiebreaker - ${baseText}`;
    }

    return baseText;
  }

  isRoundFinal(): boolean {
    return this.data.round.roundType == 'Final';
  }
}
