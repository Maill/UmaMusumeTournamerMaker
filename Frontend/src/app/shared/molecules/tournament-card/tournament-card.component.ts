import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BaseBadgeComponent } from '../../atoms/badge/base-badge.component';
import { BaseIconComponent } from '../../atoms/icon/base-icon.component';
import { TournamentCardData } from '../../types/components.types';
import { TournamentStatus, TournamentType } from '../../types/tournament.types';

@Component({
  selector: 'app-tournament-card',
  standalone: true,
  imports: [CommonModule, BaseBadgeComponent, BaseIconComponent],
  template: `
    <div
      class="tournament-card"
      [class.clickable]="clickable"
      [class.selected]="selected"
      (click)="onCardClick()"
      (keydown.enter)="onCardClick()"
      (keydown.space)="onCardClick()"
      [tabindex]="clickable ? 0 : -1"
      role="button"
    >
      <!-- Card Header -->
      <div class="card-header">
        <div class="tournament-info">
          <h3 class="tournament-name" [title]="tournament.name">
            {{ tournament.name }}
          </h3>

          <div class="tournament-meta">
            <app-badge [variant]="getTypeVariant()" class="type-badge">
              {{ getTournamentTypeName() }}
            </app-badge>

            <app-badge [variant]="getStatusVariant()" class="status-badge">
              {{ getStatusText() }}
            </app-badge>
          </div>
        </div>

        @if (tournament.status === TournamentStatus.Completed && tournament.winnerId) {
        <div class="winner-info">
          <app-icon name="trophy" size="md" color="warning" ariaLabel="Tournament winner">
          </app-icon>
          <span class="winner-name">{{ tournament.winnerName }}</span>
        </div>
        }
      </div>

      <!-- Card Body -->
      <div class="card-body">
        <div class="stats-grid">
          <div class="stat-item">
            <app-icon name="users" size="sm" color="secondary" ariaLabel="Players"> </app-icon>
            <div class="stat-content">
              <span class="stat-value">{{ tournament.playersCount }}</span>
              <span class="stat-label">{{
                tournament.playersCount === 1 ? 'Player' : 'Players'
              }}</span>
            </div>
          </div>

          @if (tournament.status === TournamentStatus.InProgress) {
          <div class="stat-item">
            <app-icon name="target" size="sm" color="primary" ariaLabel="Current round"> </app-icon>
            <div class="stat-content">
              <span class="stat-value">{{ tournament.currentRound }}</span>
              <span class="stat-label">Current Round</span>
            </div>
          </div>
          }

          <div class="stat-item">
            <app-icon name="calendar" size="sm" color="secondary" ariaLabel="Created date">
            </app-icon>
            <div class="stat-content">
              <span class="stat-value">{{ tournament.createdAt | date : 'shortDate' }}</span>
              <span class="stat-label">Created</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Card Footer -->
      @if (showActions) {
      <div class="card-footer">
        <div class="actions">
          @if (clickable) {
          <span class="action-hint">
            <app-icon name="eye" size="xs" color="secondary"> </app-icon>
            Click to view details
          </span>
          }
        </div>
      </div>
      }
    </div>
  `,
  styleUrl: './tournament-card.component.css',
})
export class TournamentCardComponent {
  @Input() tournament!: TournamentCardData;
  @Input() clickable: boolean = true;
  @Input() selected: boolean = false;
  @Input() showActions: boolean = true;

  @Output() cardClicked = new EventEmitter<TournamentCardData>();

  // Expose enums to template
  TournamentType = TournamentType;
  TournamentStatus = TournamentStatus;

  onCardClick(): void {
    if (this.clickable) {
      this.cardClicked.emit(this.tournament);
    }
  }

  getTournamentTypeName(): string {
    switch (this.tournament.type) {
      case TournamentType.Swiss:
        return 'Swiss';
      case TournamentType.ChampionsMeeting:
        return 'Champions Meeting';
      default:
        return 'Unknown';
    }
  }

  getStatusText(): string {
    switch (this.tournament.status) {
      case TournamentStatus.Created:
        return 'Created';
      case TournamentStatus.InProgress:
        return 'In Progress';
      case TournamentStatus.Completed:
        return 'Completed';
      default:
        return 'Unknown';
    }
  }

  getTypeVariant(): 'primary' | 'secondary' | 'info' {
    switch (this.tournament.type) {
      case TournamentType.Swiss:
        return 'primary';
      case TournamentType.ChampionsMeeting:
        return 'info';
      default:
        return 'secondary';
    }
  }

  getStatusVariant(): 'warning' | 'primary' | 'success' | 'secondary' {
    switch (this.tournament.status) {
      case TournamentStatus.Created:
        return 'warning';
      case TournamentStatus.InProgress:
        return 'primary';
      case TournamentStatus.Completed:
        return 'success';
      default:
        return 'secondary';
    }
  }
}
