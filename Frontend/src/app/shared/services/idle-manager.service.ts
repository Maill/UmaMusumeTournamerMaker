import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { IdleState } from '../types/service.types';

@Injectable({
  providedIn: 'root',
})
export class IdleManagerService {
  private tabHiddenTimer: number | null = null;
  private userInactiveTimer: number | null = null;
  private idleStateSubject = new BehaviorSubject<IdleState>({
    isIdle: false,
    reason: null,
    tournamentId: null,
  });
  private abortControllers: Record<
    'mousemove' | 'click' | 'touchstart' | 'keydown' | 'scroll' | 'visibilitychange',
    AbortController
  > = {
    click: new AbortController(),
    mousemove: new AbortController(),
    touchstart: new AbortController(),
    keydown: new AbortController(),
    scroll: new AbortController(),
    visibilitychange: new AbortController(),
  };

  // Timeouts
  private readonly TAB_HIDDEN_TIMEOUT = 5 * 60 * 1000; // 5 minutes
  private readonly USER_INACTIVE_TIMEOUT = 15 * 60 * 1000; // 15 minutes
  private readonly EVENTLISTENER_FIRING_TIMEOUT: number = 750; // 750ms

  // Public observables
  idleState$ = this.idleStateSubject.asObservable();

  constructor() {}

  // Public methods to control idle detection
  startIdleDetection(): void {
    this.resetUserInactiveTimer();
  }

  stopIdleDetection(): void {
    this.clearAllTimers();
    // Don't reset idle state - just stop the timers
  }

  resetIdleState(): void {
    if (this.idleStateSubject.value.isIdle) {
      this.idleStateSubject.next({
        isIdle: false,
        reason: null,
        tournamentId: this.idleStateSubject.value.tournamentId,
      });
    }
    this.resetUserInactiveTimer();
  }

  setTournamentIdIntoState(tournamentId: number): void {
    this.idleStateSubject.value.tournamentId = tournamentId;
  }

  setupIdleDetection(): void {
    this.resetAbortControllers();
    // Page Visibility API - handle tab switching
    document.addEventListener(
      'visibilitychange',
      () => {
        if (document.hidden) {
          this.handleTabHidden();
        } else {
          this.handleTabVisible();
        }
      },
      { signal: this.abortControllers.visibilitychange.signal }
    );

    // User activity detection
    this.configureActivityEvents();
    // Start user inactivity timer
    this.resetUserInactiveTimer();
  }

  destroyAllListeners(): void {
    this.abortControllers.click.abort();
    this.abortControllers.keydown.abort();
    this.abortControllers.mousemove.abort();
    this.abortControllers.scroll.abort();
    this.abortControllers.touchstart.abort();
    this.abortControllers.visibilitychange.abort();
  }

  private resetAbortControllers(): void {
    this.destroyAllListeners();
    this.abortControllers.click = new AbortController();
    this.abortControllers.keydown = new AbortController();
    this.abortControllers.mousemove = new AbortController();
    this.abortControllers.scroll = new AbortController();
    this.abortControllers.touchstart = new AbortController();
    this.abortControllers.visibilitychange = new AbortController();
  }

  private configureActivityEvents(): void {
    document.addEventListener('click', this.handleUserActivity, {
      passive: true,
      signal: this.abortControllers.click.signal,
    });

    document.addEventListener('mousemove', this.handleUserActivity, {
      passive: true,
      signal: this.abortControllers.mousemove.signal,
    });

    document.addEventListener('touchstart', this.handleUserActivity, {
      passive: true,
      signal: this.abortControllers.touchstart.signal,
    });

    document.addEventListener('keydown', this.handleUserActivity, {
      passive: true,
      signal: this.abortControllers.keydown.signal,
    });

    document.addEventListener('scroll', this.handleUserActivity, {
      passive: true,
      signal: this.abortControllers.scroll.signal,
    });
  }

  private handleTabHidden(): void {
    console.log('Tab hidden - starting disconnect timer');
    this.clearTabHiddenTimer();

    this.tabHiddenTimer = setTimeout(() => {
      console.log('Idle due to tab being hidden for 5 minutes');
      this.idleStateSubject.next({
        isIdle: true,
        reason: 'tab-hidden',
        tournamentId: this.idleStateSubject.value.tournamentId,
      });
    }, this.TAB_HIDDEN_TIMEOUT);
  }

  private handleTabVisible(): void {
    console.log('Tab visible - clearing disconnect timer');
    this.clearTabHiddenTimer();

    // Reset idle state if we were idle
    if (this.idleStateSubject.value.isIdle && this.idleStateSubject.value.reason === 'tab-hidden') {
      console.log('Tab became visible - resetting idle state');
      this.idleStateSubject.next({
        isIdle: false,
        reason: null,
        tournamentId: this.idleStateSubject.value.tournamentId,
      });
    }

    this.resetUserInactiveTimer();
  }

  private handleUserActivity = (event: Event): void => {
    // Only reset timer if tab is visible
    if (!document.hidden) {
      this.resetUserInactiveTimer();

      // Reset idle state if we were idle due to user inactivity
      if (
        this.idleStateSubject.value.isIdle &&
        this.idleStateSubject.value.reason === 'user-inactive'
      ) {
        console.log('User activity detected - resetting idle state');
        this.idleStateSubject.next({
          isIdle: false,
          reason: null,
          tournamentId: this.idleStateSubject.value.tournamentId,
        });
      }

      let abortController: AbortController = this.AbortAndRenewController(event.type);
      setTimeout(() => {
        document.addEventListener(event.type, this.handleUserActivity, {
          signal: abortController.signal,
          passive: true,
        });
      }, this.EVENTLISTENER_FIRING_TIMEOUT);
    }
  };

  private AbortAndRenewController(eventType: string): AbortController {
    switch (eventType) {
      case 'click':
        this.abortControllers.click.abort();
        this.abortControllers.click = new AbortController();
        return this.abortControllers.click;
      case 'mousemove':
        this.abortControllers.mousemove.abort();
        this.abortControllers.mousemove = new AbortController();
        return this.abortControllers.mousemove;
      case 'touchstart':
        this.abortControllers.touchstart.abort();
        this.abortControllers.touchstart = new AbortController();
        return this.abortControllers.touchstart;
      case 'scroll':
        this.abortControllers.scroll.abort();
        this.abortControllers.scroll = new AbortController();
        return this.abortControllers.scroll;
      case 'keydown':
        this.abortControllers.keydown.abort();
        this.abortControllers.keydown = new AbortController();
        return this.abortControllers.keydown;
    }

    throw new Error(`Can't renew the AbortController. Unsupported event type: ${eventType}`);
  }

  private resetUserInactiveTimer(): void {
    this.clearUserInactiveTimer();

    this.userInactiveTimer = setTimeout(() => {
      if (!document.hidden) {
        console.log('Idle due to user inactivity for 15 minutes');
        this.idleStateSubject.next({
          isIdle: true,
          reason: 'user-inactive',
          tournamentId: this.idleStateSubject.value.tournamentId,
        });
      }
    }, this.USER_INACTIVE_TIMEOUT);
  }

  private clearTabHiddenTimer(): void {
    if (this.tabHiddenTimer) {
      clearTimeout(this.tabHiddenTimer);
      this.tabHiddenTimer = null;
    }
  }

  private clearUserInactiveTimer(): void {
    if (this.userInactiveTimer) {
      clearTimeout(this.userInactiveTimer);
      this.userInactiveTimer = null;
    }
  }

  private clearAllTimers(): void {
    this.clearTabHiddenTimer();
    this.clearUserInactiveTimer();
  }
}
