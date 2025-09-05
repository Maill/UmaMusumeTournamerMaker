import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BaseButtonComponent } from '../../atoms/button/base-button.component';
import { BaseInputComponent } from '../../atoms/input/base-input.component';

@Component({
  selector: 'app-player-input',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseInputComponent, BaseButtonComponent],
  template: `
    <div class="player-input-wrapper">
      <div class="input-group">
        <app-input
          #playerNameInput
          [label]="label"
          type="text"
          [placeholder]="placeholder"
          [(ngModel)]="playerName"
          [disabled]="disabled || isLoading"
          [error]="error"
          [required]="required"
          (enterPressed)="onAddPlayer()"
          (valueChange)="onNameChange($event)"
        >
        </app-input>

        <div class="input-group-append">
          <app-button
            variant="primary"
            [disabled]="disabled || isLoading || !canAddPlayer()"
            [loading]="isLoading"
            [loadingText]="loadingText"
            (clicked)="onAddPlayer()"
          >
            {{ buttonText }}
          </app-button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './player-input.component.css',
})
export class PlayerInputComponent implements AfterViewInit {
  @ViewChild('playerNameInput', { read: ElementRef })
  playerNameInput!: ElementRef<HTMLInputElement>;

  @Input() label: string = '';
  @Input() placeholder: string = 'Enter player name';
  @Input() buttonText: string = 'Add Player';
  @Input() loadingText: string = 'Adding...';
  @Input() disabled: boolean = false;
  @Input() isLoading: boolean = false;
  @Input() error: string | null = null;
  @Input() required: boolean = false;
  @Input() minLength: number = 1;
  @Input() maxLength: number = 50;
  @Input() autoFocus: boolean = false;
  @Input() clearOnAdd: boolean = true;

  @Output() playerAdded = new EventEmitter<string>();
  @Output() nameChanged = new EventEmitter<string>();

  playerName: string = '';

  ngAfterViewInit(): void {
    if (this.autoFocus) {
      this.focusInput();
    }
  }

  onAddPlayer(): void {
    if (this.canAddPlayer()) {
      const trimmedName = this.playerName.trim();
      this.playerAdded.emit(trimmedName);

      if (this.clearOnAdd) {
        this.playerName = '';
        this.focusInput();
      }
    }
  }

  onNameChange(name: string): void {
    this.playerName = name;
    this.nameChanged.emit(name);
  }

  canAddPlayer(): boolean {
    const trimmedName = this.playerName.trim();
    return (
      trimmedName.length >= this.minLength &&
      trimmedName.length <= this.maxLength &&
      !this.disabled &&
      !this.isLoading
    );
  }

  focusInput(): void {
    setTimeout(() => {
      if (this.playerNameInput?.nativeElement) {
        this.playerNameInput.nativeElement.focus();
      }
    }, 0);
  }

  clearInput(): void {
    this.playerName = '';
    this.focusInput();
  }
}
