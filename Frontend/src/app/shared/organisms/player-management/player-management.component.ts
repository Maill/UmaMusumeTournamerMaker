import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BaseButtonComponent } from '../../atoms/button/base-button.component';
import { BaseIconComponent } from '../../atoms/icon/base-icon.component';
import { ErrorDisplayComponent } from '../../molecules/error-display/error-display.component';
import { PlayerInputComponent } from '../../molecules/player-input/player-input.component';
import { PlayerManagementState } from '../../types/components.types';
import { Player } from '../../types/tournament.types';

@Component({
  selector: 'app-player-management',
  standalone: true,
  imports: [
    CommonModule,
    PlayerInputComponent,
    BaseButtonComponent,
    BaseIconComponent,
    ErrorDisplayComponent,
  ],
  template: `
    <div class="player-management-container">
      <!-- Section Header -->
      <div class="section-header">
        <div class="header-info">
          <h2 class="section-title">
            <app-icon name="users" size="md" color="primary" ariaLabel="Players"> </app-icon>
            Players ({{ players.length }})
          </h2>
          @if (minPlayersRequired > 0) {
          <p class="section-subtitle">
            @if (players.length < minPlayersRequired) { Need at least
            {{ minPlayersRequired }} players to start (currently {{ players.length }}) } @else {
            Ready to start with {{ players.length }} players }
          </p>
          }
        </div>
      </div>

      <!-- General Error Display -->
      @if (state.error) {
      <app-error-display
        [message]="state.error"
        type="error"
        [dismissible]="true"
        (dismissed)="onErrorDismiss()"
      >
      </app-error-display>
      }

      <!-- Add Player Form -->
      @if (state.canManage) {
      <div class="add-player-section">
        <app-player-input
          placeholder="Enter player name"
          buttonText="Add Player"
          [isLoading]="state.isAddingPlayer"
          [error]="state.addPlayerError"
          [autoFocus]="true"
          [clearOnAdd]="true"
          [minLength]="1"
          [maxLength]="50"
          (playerAdded)="onPlayerAdd($event)"
        >
        </app-player-input>
      </div>
      }

      <!-- Players List -->
      @if (players.length > 0) {
      <div class="players-section">
        <div class="players-list">
          @for (player of players; track player.id; let i = $index) {
          <div class="player-item" [class.removing]="isPlayerBeingRemoved(player.id)">
            <div class="player-info">
              <span class="player-number">{{ i + 1 }}.</span>
              <span class="player-name" [title]="player.name">{{ player.name }}</span>

              @if (showPlayerStats) {
              <div class="player-stats">
                <span class="stat">{{ player.points }}pts</span>
                <span class="stat">{{ player.wins }}W</span>
                <span class="stat">{{ player.losses }}L</span>
              </div>
              }
            </div>

            @if (state.canManage && allowPlayerRemoval) {
            <div class="player-actions">
              <app-button
                variant="outline-danger"
                size="sm"
                [disabled]="state.isRemovingPlayer || isPlayerBeingRemoved(player.id)"
                [loading]="isPlayerBeingRemoved(player.id)"
                loadingText="Removing..."
                (clicked)="onPlayerRemove(player.id, player.name)"
                [title]="'Remove ' + player.name"
              >
                <app-icon name="close" size="xs"> </app-icon>
              </app-button>
            </div>
            }
          </div>
          }
        </div>
      </div>
      } @else {
      <!-- Empty State -->
      <div class="empty-state">
        <app-icon name="users" size="xl" color="secondary" ariaLabel="No players"> </app-icon>
        <h3>No players yet</h3>
        <p>
          {{
            state.canManage
              ? 'Add players to get started with your tournament.'
              : 'This tournament has no players yet.'
          }}
        </p>
      </div>
      }

      <!-- Start Tournament Section -->
      @if (state.canManage && canStartTournament()) {
      <div class="start-tournament-section">
        <div class="start-info">
          <app-icon name="trophy" size="md" color="success" ariaLabel="Ready to start"> </app-icon>
          <div class="start-text">
            <h3>Ready to Start!</h3>
            <p>You have {{ players.length }} players registered. The tournament can begin.</p>
          </div>
        </div>

        <app-button
          variant="success"
          size="lg"
          [loading]="state.isStartingTournament"
          loadingText="Starting Tournament..."
          [disabled]="state.isStartingTournament"
          (clicked)="onStartTournament()"
        >
          <app-icon name="play" size="sm"> </app-icon>
          Start Tournament
        </app-button>
      </div>
      }

      <!-- Minimum Players Warning -->
      @if (players.length < minPlayersRequired && players.length > 0) {
      <div class="warning-section">
        <app-icon name="warning" size="md" color="warning" ariaLabel="Warning"> </app-icon>
        <div class="warning-text">
          <h4>More Players Needed</h4>
          <p>
            Add at least {{ minPlayersRequired - players.length }} more players to start the
            tournament.
          </p>
        </div>
      </div>
      }
    </div>
  `,
  styleUrl: './player-management.component.css',
})
export class PlayerManagementComponent {
  @Input() players: Player[] = [];
  @Input() state: PlayerManagementState = {
    isAddingPlayer: false,
    isRemovingPlayer: false,
    isStartingTournament: false,
    canManage: false,
    error: null,
    addPlayerError: null,
  };
  @Input() minPlayersRequired: number = 3;
  @Input() allowPlayerRemoval: boolean = true;
  @Input() showPlayerStats: boolean = false;
  @Input() removingPlayerId: number | null = null;

  @Output() playerAdded = new EventEmitter<string>();
  @Output() playerRemoved = new EventEmitter<{ playerId: number; playerName: string }>();
  @Output() tournamentStarted = new EventEmitter<void>();
  @Output() errorDismissed = new EventEmitter<void>();

  onPlayerAdd(playerName: string): void {
    if (playerName.trim()) {
      this.playerAdded.emit(playerName.trim());
    }
  }

  onPlayerRemove(playerId: number, playerName: string): void {
    this.playerRemoved.emit({ playerId, playerName });
  }

  onStartTournament(): void {
    this.tournamentStarted.emit();
  }

  onErrorDismiss(): void {
    this.errorDismissed.emit();
  }

  canStartTournament(): boolean {
    return (
      this.players.length >= this.minPlayersRequired &&
      !this.state.isAddingPlayer &&
      !this.state.isRemovingPlayer &&
      !this.state.isStartingTournament
    );
  }

  isPlayerBeingRemoved(playerId: number): boolean {
    return this.removingPlayerId === playerId;
  }

  getPlayerCount(): number {
    return this.players.length;
  }

  getRemainingPlayersNeeded(): number {
    return Math.max(0, this.minPlayersRequired - this.players.length);
  }

  getTournamentReadyStatus(): { ready: boolean; message: string } {
    const count = this.players.length;
    const needed = this.minPlayersRequired;

    if (count < needed) {
      return {
        ready: false,
        message: `Need ${needed - count} more players to start`,
      };
    }

    return {
      ready: true,
      message: `Ready to start with ${count} players`,
    };
  }
}
