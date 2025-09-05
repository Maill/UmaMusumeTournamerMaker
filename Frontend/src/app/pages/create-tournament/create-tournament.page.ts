import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';

// Import organisms
import { TournamentFormComponent } from '../../shared/organisms/tournament-form/tournament-form.component';

// Import atoms and types
import { BaseButtonComponent } from '../../shared/atoms/button/base-button.component';
import { BaseIconComponent } from '../../shared/atoms/icon/base-icon.component';
import { TournamentService } from '../../shared/services/tournament.service';
import { CreateTournamentRequest } from '../../shared/types/api.types';
import {
  CreateTournamentPageState,
  TournamentFormData,
  TournamentFormState,
} from '../../shared/types/components.types';

@Component({
  selector: 'app-create-tournament-page',
  standalone: true,
  imports: [CommonModule, TournamentFormComponent, BaseButtonComponent, BaseIconComponent],
  templateUrl: './create-tournament.page.html',
  styleUrl: './create-tournament.page.css',
})
export class CreateTournamentPageComponent implements OnDestroy {
  private destroy$ = new Subject<void>();

  state: CreateTournamentPageState = {
    isCreating: false,
    error: null,
    formData: null,
  };

  constructor(private router: Router, private tournamentService: TournamentService) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onCreateTournament(request: CreateTournamentRequest): void {
    this.state.isCreating = true;
    this.state.error = null;

    this.tournamentService.createTournament(request).subscribe({
      next: (tournament) => {
        this.state.isCreating = false;
        // Navigate to the newly created tournament
        this.router.navigate(['/tournaments', tournament.id]);
      },
      error: (error) => {
        console.error('Failed to create tournament:', error);
        this.state.isCreating = false;
        this.state.error = error.message || 'Failed to create tournament';
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/tournaments']);
  }

  onFormChange(formData: TournamentFormData): void {
    this.state.formData = formData;
  }

  goBack(): void {
    this.router.navigate(['/tournaments']);
  }

  clearError(): void {
    this.state.error = null;
  }

  getFormState(): TournamentFormState {
    return {
      isLoading: this.state.isCreating,
      error: this.state.error,
      showPassword: true,
    };
  }

  private getErrorMessage(error: any): string {
    // Parse different types of errors
    if (error?.error?.message) {
      return error.error.message;
    }

    if (error?.message) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    // Handle validation errors
    if (error?.error?.errors) {
      const validationErrors = Object.values(error.error.errors).flat().join(', ');
      return `Validation failed: ${validationErrors}`;
    }

    // Handle network errors
    if (error?.status === 0) {
      return 'Unable to connect to the server. Please check your internet connection.';
    }

    if (error?.status === 400) {
      return 'Invalid tournament data. Please check your inputs and try again.';
    }

    if (error?.status === 409) {
      return 'A tournament with this name already exists. Please choose a different name.';
    }

    if (error?.status >= 500) {
      return 'Server error occurred. Please try again later.';
    }

    return 'An unexpected error occurred while creating the tournament. Please try again.';
  }

  // Utility methods for template
  canNavigateAway(): boolean {
    if (this.state.isCreating) {
      return false;
    }

    if (this.state.formData) {
      return confirm('You have unsaved changes. Are you sure you want to leave?');
    }

    return true;
  }

  getPageTitle(): string {
    return this.state.isCreating ? 'Creating Tournament...' : 'Create New Tournament';
  }
}
