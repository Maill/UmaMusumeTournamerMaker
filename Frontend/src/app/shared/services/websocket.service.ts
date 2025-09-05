import { Injectable, inject } from '@angular/core';
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';
import { BehaviorSubject, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IdleManagerService } from './idle-manager.service';

export interface WebSocketUpdate {
  type:
    | 'PlayerAdded'
    | 'PlayerRemoved'
    | 'TournamentStarted'
    | 'NewRound'
    | 'TournamentUpdated'
    | 'WinnerSelected';
  tournamentId: number;
  data: any;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private idleManager: IdleManagerService = inject(IdleManagerService);
  private connection: HubConnection | null = null;
  private currentTournamentId: number | null = null;
  private isIdleDisconnected: boolean = false;

  // Simple state tracking
  private connectionStateSubject = new BehaviorSubject<HubConnectionState>(
    HubConnectionState.Disconnected
  );
  private updatesSubject = new Subject<WebSocketUpdate>();

  // Public observables
  connectionState$ = this.connectionStateSubject.asObservable();
  updates$ = this.updatesSubject.asObservable();

  constructor() {
    this.initializeConnection();
    this.setupIdleIntegration();
  }

  // Connection Management
  async connect(enableIdleDetection: boolean = false): Promise<void> {
    if (this.connection?.state === HubConnectionState.Connected) {
      return;
    }

    try {
      this.connectionStateSubject.next(HubConnectionState.Connecting);
      await this.connection?.start();
      this.connectionStateSubject.next(HubConnectionState.Connected);

      if (enableIdleDetection) {
        this.idleManager.setupIdleDetection();
      }
      this.idleManager.startIdleDetection();
      console.log('WebSocket connected');
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.connectionStateSubject.next(HubConnectionState.Disconnected);
      throw error;
    }
  }

  async disconnect(disableIdleDetection: boolean = false): Promise<void> {
    if (this.connection?.state === HubConnectionState.Connected) {
      await this.connection.stop();
    }
    this.connectionStateSubject.next(HubConnectionState.Disconnected);

    // Only clear tournament ID if not disconnecting due to idle
    if (!this.isIdleDisconnected) {
      this.currentTournamentId = null;
    }

    this.idleManager.stopIdleDetection();
    if (disableIdleDetection) {
      this.idleManager.destroyAllListeners();
    }
  }

  // Tournament Group Management - match backend method names exactly
  async joinTournament(tournamentId: number): Promise<void> {
    if (this.connection?.state !== HubConnectionState.Connected) {
      await this.connect(true);
    }

    try {
      // Leave previous tournament if different
      if (this.currentTournamentId && this.currentTournamentId !== tournamentId) {
        await this.leaveTournament();
      }

      // Backend expects string
      await this.connection!.invoke('JoinTournament', tournamentId.toString());
      this.currentTournamentId = tournamentId;
      this.idleManager.setTournamentIdIntoState(tournamentId);
      console.log(`Joined tournament group: ${tournamentId}`);
    } catch (error) {
      console.error('Failed to join tournament group:', error);
      throw error;
    }
  }

  async leaveTournament(disconnectWebsocket: boolean = false): Promise<void> {
    if (!this.currentTournamentId || this.connection?.state !== HubConnectionState.Connected) {
      this.idleManager.destroyAllListeners();
      return;
    }

    try {
      // Backend expects string
      await this.connection.invoke('LeaveTournament', this.currentTournamentId.toString());
      console.log(`Left tournament group: ${this.currentTournamentId}`);
      this.currentTournamentId = null;

      if (disconnectWebsocket) {
        this.disconnect(disconnectWebsocket && !this.isIdleDisconnected);
      }
    } catch (error) {
      console.error('Failed to leave tournament group:', error);
    }
  }

  // Private Methods
  private initializeConnection(): void {
    this.connection = new HubConnectionBuilder()
      .withUrl(`${environment.hubUrl}/tournamentHub`)
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          if (this.isIdleDisconnected || retryContext.previousRetryCount > 3) {
            return null; // Don't try to reconnect if client is idle or after 3 failed retries
          }

          return 5000; //Try to reconnect after 5 seconds
        },
      })
      .configureLogging(environment.production ? LogLevel.Warning : LogLevel.Information)
      .withServerTimeout(120000) // 2 minutes - match server ClientTimeoutInterval
      .withKeepAliveInterval(60000) // 1 minute - match server KeepAliveInterval
      .build();

    this.setupEventHandlers();
    this.setupConnectionHandlers();
  }

  private setupEventHandlers(): void {
    if (!this.connection) return;

    // Match backend events exactly
    this.connection.on('PlayerAdded', (player: any) => {
      this.emitUpdate('PlayerAdded', player);
    });

    this.connection.on('PlayerRemoved', (playerId: number) => {
      this.emitUpdate('PlayerRemoved', { playerId });
    });

    this.connection.on('TournamentStarted', (tournament: any) => {
      this.emitUpdate('TournamentStarted', tournament);
    });

    this.connection.on('NewRound', (tournament: any) => {
      this.emitUpdate('NewRound', tournament);
    });

    this.connection.on('TournamentUpdated', (tournament: any) => {
      this.emitUpdate('TournamentUpdated', tournament);
    });

    this.connection.on('WinnerSelected', (data: { matchId: number; winnerId: number }) => {
      this.emitUpdate('WinnerSelected', data);
    });
  }

  private setupConnectionHandlers(): void {
    if (!this.connection) return;

    this.connection.onreconnecting(() => {
      console.log('WebSocket reconnecting...');
      this.connectionStateSubject.next(HubConnectionState.Reconnecting);
    });

    this.connection.onreconnected(async (connectionId) => {
      console.log('WebSocket reconnected:', connectionId);
      this.connectionStateSubject.next(HubConnectionState.Connected);

      // Rejoin tournament group if we were in one
      if (this.currentTournamentId) {
        try {
          await this.connection!.invoke('JoinTournament', this.currentTournamentId.toString());
        } catch (error) {
          console.error('Failed to rejoin tournament group:', error);
        }
      }
    });

    this.connection.onclose((error) => {
      console.log('WebSocket connection closed:', error);
      this.connectionStateSubject.next(HubConnectionState.Disconnected);
      this.currentTournamentId = null;
    });
  }

  private emitUpdate(type: WebSocketUpdate['type'], data: any): void {
    const update: WebSocketUpdate = {
      type,
      tournamentId: this.currentTournamentId || 0,
      data,
      timestamp: new Date(),
    };

    this.updatesSubject.next(update);
  }

  // Idle Management Integration
  private setupIdleIntegration(): void {
    // Subscribe to idle state changes
    this.idleManager.idleState$.subscribe(async (state) => {
      this.currentTournamentId = state.tournamentId;
      if (state.isIdle && this.connection?.state === HubConnectionState.Connected) {
        console.log(`Disconnecting due to idle: ${state.reason}`);
        this.isIdleDisconnected = true;
        await this.leaveTournament(true);
      } else if (!state.isIdle && this.isIdleDisconnected) {
        console.log('Reconnecting after idle period ended');
        this.isIdleDisconnected = false;
        await this.reconnectAfterIdle();
      }
    });
  }

  private async reconnectAfterIdle(): Promise<void> {
    try {
      // Rejoin tournament if we were in one
      if (this.currentTournamentId) {
        await this.joinTournament(this.currentTournamentId);
      }
    } catch (error) {
      console.error('Failed to reconnect after idle:', error);
    }
  }
}
