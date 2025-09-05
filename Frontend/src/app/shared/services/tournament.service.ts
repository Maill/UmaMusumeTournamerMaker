import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { Tournament, TournamentListItem } from '../types/tournament.types';

import { environment } from '../../../environments/environment';
import {
  AddPlayerRequest,
  CreateTournamentRequest,
  DeleteTournamentRequest,
  RemovePlayerRequest,
  SetMatchWinnerRequest,
  StartNextRoundRequest,
  StartTournamentRequest,
  UpdateTournamentRequest,
  ValidatePasswordRequest,
} from '../types/api.types';
import { LocalStorageService } from './local-storage.service';

@Injectable({
  providedIn: 'root',
})
export class TournamentService {
  private readonly apiUrl = `${environment.apiUrl}/tournaments`;

  //Services
  private localStorageService: LocalStorageService = inject(LocalStorageService);

  // Simple reactive state
  private tournamentsSubject = new BehaviorSubject<TournamentListItem[]>([]);
  private currentTournamentSubject = new BehaviorSubject<Tournament | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  // Public observables
  tournaments$ = this.tournamentsSubject.asObservable();
  currentTournament$ = this.currentTournamentSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();
  error$ = this.errorSubject.asObservable();

  // Password storage (simple)
  private readonly PASSWORD_KEY_PREFIX = 'tournament_password_';

  constructor(private http: HttpClient) {}

  // Tournament CRUD
  getAllTournaments(): Observable<TournamentListItem[]> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.get<TournamentListItem[]>(this.apiUrl).pipe(
      tap((tournaments) => {
        this.tournamentsSubject.next(tournaments);
      }),
      catchError(this.handleError),
      tap(() => this.loadingSubject.next(false))
    );
  }

  getTournament(id: number): Observable<Tournament> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.get<Tournament>(`${this.apiUrl}/${id}`).pipe(
      tap((tournament) => {
        this.currentTournamentSubject.next(tournament);
      }),
      catchError(this.handleError),
      tap(() => this.loadingSubject.next(false))
    );
  }

  createTournament(request: CreateTournamentRequest): Observable<Tournament> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.post<Tournament>(this.apiUrl, request).pipe(
      tap((tournament) => {
        // Store password if provided
        if (request.password) {
          this.localStorageService.setPassword(tournament.id, request.password);
        }

        // Update state
        const currentTournaments = this.tournamentsSubject.value;
        const tournamentListItem: TournamentListItem = {
          id: tournament.id,
          name: tournament.name,
          type: tournament.type,
          status: tournament.status,
          playersCount: tournament.players.length,
          currentRound: tournament.rounds?.length || 0,
          createdAt: tournament.createdAt,
        };
        this.tournamentsSubject.next([tournamentListItem, ...currentTournaments]);
        this.currentTournamentSubject.next(tournament);
      }),
      catchError(this.handleError),
      tap(() => this.loadingSubject.next(false))
    );
  }

  updateTournament(request: UpdateTournamentRequest): Observable<void> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    const storedPassword = this.localStorageService.getPassword(request.tournamentId);
    request.password = request.password || storedPassword || '';

    return this.http.put<void>(this.apiUrl, request).pipe(
      tap(() => {
        console.log('Tournament updated');
      }),
      catchError(this.handleError)
    );
  }

  deleteTournament(request: DeleteTournamentRequest): Observable<void> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    const storedPassword = this.localStorageService.getPassword(request.tournamentId);
    request.password = request.password || storedPassword || '';

    return this.http.delete<void>(this.apiUrl, { body: request }).pipe(
      tap(() => {
        // Remove from state
        const currentTournaments = this.tournamentsSubject.value;
        this.tournamentsSubject.next(
          currentTournaments.filter((t) => t.id !== request.tournamentId)
        );

        // Clear current tournament if it was deleted
        if (this.currentTournamentSubject.value?.id === request.tournamentId) {
          this.currentTournamentSubject.next(null);
        }

        // Clear password
        this.localStorageService.clearPassword(request.tournamentId);
      }),
      catchError(this.handleError),
      tap(() => this.loadingSubject.next(false))
    );
  }

  // Player Management
  addPlayer(request: AddPlayerRequest): Observable<{ message: string }> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    const storedPassword = this.localStorageService.getPassword(request.tournamentId);
    request.name = request.name.trim();
    request.password = request.password || storedPassword || '';

    return this.http.post<{ message: string }>(`${this.apiUrl}/players`, request).pipe(
      tap((response) => {
        console.log('Add player success:', response.message);
        // Tournament data will come via WebSocket
      }),
      catchError(this.handleError),
      tap(() => this.loadingSubject.next(false))
    );
  }

  removePlayer(request: RemovePlayerRequest): Observable<{ message: string }> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    const storedPassword = this.localStorageService.getPassword(request.tournamentId);
    request.password = request.password || storedPassword || '';

    return this.http
      .delete<{ message: string }>(`${this.apiUrl}/players`, {
        body: request,
      })
      .pipe(
        tap((response) => {
          console.log('Remove player success:', response.message);
          // Tournament data will come via WebSocket
        }),
        catchError(this.handleError),
        tap(() => this.loadingSubject.next(false))
      );
  }

  // Match Management
  setMatchWinner(request: SetMatchWinnerRequest): Observable<{ message: string }> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http
      .post<{ message: string }>(`${environment.apiUrl}/matches/broadcast-winner`, request)
      .pipe(
        tap((response) => {
          console.log('Broadcast winner success:', response.message);
          // Tournament data will come via WebSocket
        }),
        catchError(this.handleError),
        tap(() => this.loadingSubject.next(false))
      );
  }

  startTournament(request: StartTournamentRequest): Observable<{ message: string }> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    const storedPassword = this.localStorageService.getPassword(request.tournamentId);
    request.password = request.password || storedPassword || '';

    return this.http.post<{ message: string }>(`${this.apiUrl}/start`, request).pipe(
      tap((response) => {
        console.log('Start tournament success:', response.message);
        // Tournament data will come via WebSocket
      }),
      catchError(this.handleError),
      tap(() => this.loadingSubject.next(false))
    );
  }

  startNextRound(request: StartNextRoundRequest): Observable<{ message: string }> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    const storedPassword = this.localStorageService.getPassword(request.tournamentId);
    request.password = request.password || storedPassword || '';

    return this.http.post<{ message: string }>(`${this.apiUrl}/next-round`, request).pipe(
      tap((response) => {
        console.log('Start next round success:', response.message);
        // Tournament data will come via WebSocket
      }),
      catchError(this.handleError),
      tap(() => this.loadingSubject.next(false))
    );
  }

  // Password validation
  validateTournamentPassword(request: ValidatePasswordRequest): Observable<{ isValid: boolean }> {
    return this.http.post<{ isValid: boolean }>(`${this.apiUrl}/validate-password`, request).pipe(
      tap(() => {
        this.localStorageService.setPassword(request.tournamentId, request.password);
      }),
      catchError(this.handleError)
    );
  }

  // Utility Methods
  clearError(): void {
    this.errorSubject.next(null);
  }

  refreshTournaments(): void {
    this.getAllTournaments().subscribe();
  }

  // Private Methods
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    console.error('Tournament Service Error:', error);

    let errorMessage = 'An unexpected error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = 'Network error. Please check your connection.';
    } else {
      // Server-side error
      switch (error.status) {
        case 400:
          errorMessage = error.error?.message || 'Invalid request data';
          break;
        case 401:
          errorMessage = 'Authentication required. Please provide a password.';
          break;
        case 403:
          errorMessage = 'Access denied. Invalid password.';
          break;
        case 404:
          errorMessage = 'Tournament not found';
          break;
        case 409:
          errorMessage = error.error?.message || 'Conflict with current state';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        default:
          errorMessage = error.error?.message || `Error ${error.status}: ${error.statusText}`;
      }
    }

    this.errorSubject.next(errorMessage);
    return throwError(() => new Error(errorMessage));
  };
}
