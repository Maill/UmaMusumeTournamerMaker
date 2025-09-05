import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BaseIconComponent } from '../../atoms/icon/base-icon.component';
import { BaseSelectComponent } from '../../atoms/select/base-select.component';
import { SelectOption } from '../../types/components.types';
import { MatchPlayer } from '../../types/tournament.types';

@Component({
  selector: 'app-winner-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseSelectComponent, BaseIconComponent],
  template: `
    <div class="winner-selector-wrapper">
      <div class="selector-container">
        <app-select
          [options]="playerOptions"
          [disabled]="disabled"
          [error]="error"
          [label]="label"
          (valueChange)="onWinnerChange($event)"
        >
        </app-select>

        <div class="winner-indicator">
          @if (selectedWinnerId && !disabled) {
          <!--<app-icon
              name="check"
              size="sm"
              color="success"
              [ariaLabel]="'Winner selected: ' + getSelectedPlayerName()">
            </app-icon>
          <span class="winner-text">{{ getSelectedPlayerName() }}</span>-->
          } @else if (selectedWinnerId && disabled) {
          <app-icon
            name="trophy"
            size="sm"
            color="warning"
            [ariaLabel]="'Match winner: ' + getSelectedPlayerName()"
          >
          </app-icon>
          <span class="winner-text winner-final">{{ getSelectedPlayerName() }}</span>
          }
        </div>
      </div>

      @if (showHelp && !error) {
      <div class="selector-help">
        {{ helpText }}
      </div>
      }
    </div>
  `,
  styleUrl: './winner-selector.component.css',
})
export class WinnerSelectorComponent {
  @Input() matchId: number = 0;
  @Input() players: MatchPlayer[] = [];
  @Input() selectedWinnerId: number | null = null;
  @Input() disabled: boolean = false;
  @Input() error: string | null = null;
  //@Input() label: string = 'Select Winner';
  @Input() label: string = ' ';
  @Input() placeholder: string = 'Choose match winner...';
  @Input() helpText: string = 'Select the player who won this match';
  @Input() showHelp: boolean = false;

  @Output() winnerChanged = new EventEmitter<{
    matchId: number;
    winnerId: number | null;
    playerName?: string;
  }>();

  get playerOptions(): SelectOption<number>[] {
    const options: SelectOption<number>[] = [];

    // Add placeholder option when no winner is selected
    if (!this.selectedWinnerId) {
      options.push({
        value: 0, // Use 0 for no selection
        label: this.placeholder,
        disabled: false,
      });
    }

    // Add player options
    this.players.forEach((player) => {
      options.push({
        value: player.id,
        label: player.name,
        disabled: false,
      });
    });

    return options;
  }

  onWinnerChange(winnerId: number): void {
    // Convert 0 back to null for placeholder selection
    const actualWinnerId = winnerId === 0 ? null : winnerId;
    const selectedPlayer = this.players.find((p) => p.id === actualWinnerId);

    // Don't modify the input property - let parent handle the state
    this.winnerChanged.emit({
      matchId: this.matchId,
      winnerId: actualWinnerId,
      playerName: selectedPlayer?.name,
    });
  }

  getSelectedPlayerName(): string {
    if (!this.selectedWinnerId) return '';
    const selectedPlayer = this.players.find((p) => p.id === this.selectedWinnerId);
    return selectedPlayer?.name || '';
  }

  isMatchCompleted(): boolean {
    return this.selectedWinnerId !== null && this.disabled;
  }

  canChangeWinner(): boolean {
    return !this.disabled && this.players.length > 0;
  }

  clearSelection(): void {
    if (this.canChangeWinner()) {
      this.winnerChanged.emit({
        matchId: this.matchId,
        winnerId: null,
        playerName: undefined,
      });
    }
  }
}
