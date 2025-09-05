import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

// Import organisms and molecules
import { BaseButtonComponent } from '../../shared/atoms/button/base-button.component';
import { BaseIconComponent } from '../../shared/atoms/icon/base-icon.component';
import { ErrorDisplayComponent } from '../../shared/molecules/error-display/error-display.component';
import { TournamentCardSkeletonComponent } from '../../shared/molecules/tournament-card-skeleton/tournament-card-skeleton.component';
import { TournamentCardComponent } from '../../shared/molecules/tournament-card/tournament-card.component';

// Import types and services
import { TournamentService } from '../../shared/services/tournament.service';
import { TournamentCardData } from '../../shared/types/components.types';
import {
  TournamentListItem,
  TournamentStatus,
  TournamentType,
} from '../../shared/types/tournament.types';

interface TournamentListState {
  tournaments: TournamentListItem[];
  isLoading: boolean;
  error: string | null;
  hasLoaded: boolean;
}

@Component({
  selector: 'app-tournament-list-page',
  standalone: true,
  imports: [
    CommonModule,
    TournamentCardComponent,
    TournamentCardSkeletonComponent,
    ErrorDisplayComponent,
    BaseButtonComponent,
    BaseIconComponent,
  ],
  templateUrl: './tournament-list.page.html',
  styleUrl: './tournament-list.page.css',
})
export class TournamentListPageComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  state: TournamentListState = {
    tournaments: [],
    isLoading: true,
    error: null,
    hasLoaded: false,
  };

  constructor(private tournamentService: TournamentService, private router: Router) {}

  ngOnInit(): void {
    this.loadTournaments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTournaments(): void {
    // Simple subscription to service observables
    this.tournamentService.tournaments$.pipe(takeUntil(this.destroy$)).subscribe((tournaments) => {
      this.state.tournaments = tournaments;
      this.state.hasLoaded = true;
    });

    this.tournamentService.loading$.pipe(takeUntil(this.destroy$)).subscribe((loading) => {
      this.state.isLoading = loading;
    });

    this.tournamentService.error$.pipe(takeUntil(this.destroy$)).subscribe((error) => {
      this.state.error = error;
    });

    // Load tournaments
    this.tournamentService.getAllTournaments().subscribe();
  }

  refreshTournaments(): void {
    this.loadTournaments();
  }

  onCreateTournament(): void {
    this.router.navigate(['/tournaments/create']);
  }

  onTournamentClick(tournament: TournamentCardData): void {
    this.router.navigate(['/tournaments', tournament.id]);
  }

  clearError(): void {
    this.state.error = null;
  }

  getActiveTournamentsCount(): number {
    return this.state.tournaments.filter(
      (t) => t.status === TournamentStatus.Created || t.status === TournamentStatus.InProgress
    ).length;
  }

  getCompletedTournamentsCount(): number {
    return this.state.tournaments.filter((t) => t.status === TournamentStatus.Completed).length;
  }

  getFilteredTournaments(): TournamentListItem[] {
    // Add filtering logic here if needed
    return [...this.state.tournaments].sort((a, b) => {
      // Sort by status (active first), then by creation date (newest first)
      const statusOrder = {
        [TournamentStatus.InProgress]: 0,
        [TournamentStatus.Created]: 1,
        [TournamentStatus.Completed]: 2,
      };
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  mapToCardData(tournament: TournamentListItem): TournamentCardData {
    return {
      id: tournament.id,
      name: tournament.name,
      type: tournament.type,
      status: tournament.status,
      playersCount: tournament.playersCount,
      currentRound: tournament.currentRound,
      createdAt: tournament.createdAt,
      winnerId: undefined, // Not available in list view
      winnerName: undefined,
    };
  }

  // Utility methods for template
  getTournamentTypeName(type: TournamentType): string {
    switch (type) {
      case TournamentType.Swiss:
        return 'Swiss';
      case TournamentType.ChampionsMeeting:
        return 'Champions Meeting';
      default:
        return 'Unknown';
    }
  }

  getStatusText(status: TournamentStatus): string {
    switch (status) {
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
}
