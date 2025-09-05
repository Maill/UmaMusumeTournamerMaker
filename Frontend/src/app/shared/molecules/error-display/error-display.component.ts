import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BaseButtonComponent } from '../../atoms/button/base-button.component';
import { BaseIconComponent } from '../../atoms/icon/base-icon.component';
import { ErrorType } from '../../types/components.types';

@Component({
  selector: 'app-error-display',
  standalone: true,
  imports: [CommonModule, BaseButtonComponent, BaseIconComponent],
  template: `
    <div [class]="getErrorClasses()" role="alert">
      <div class="error-content">
        <div class="error-icon">
          <app-icon [name]="getIconName()" size="md" [color]="getIconColor()"> </app-icon>
        </div>

        <div class="error-text">
          <div class="error-title" *ngIf="title">
            {{ title }}
          </div>
          <div class="error-message">
            {{ message }}
          </div>
          <div class="error-details" *ngIf="details">
            {{ details }}
          </div>
        </div>

        <div class="error-actions" *ngIf="showActions">
          @if (retryable) {
          <app-button
            variant="outline-primary"
            size="sm"
            [loading]="isRetrying"
            loadingText="Retrying..."
            (clicked)="onRetry()"
          >
            {{ retryText }}
          </app-button>
          } @if (dismissible) {
          <app-button variant="outline-secondary" size="sm" (clicked)="onDismiss()">
            <app-icon name="close" size="xs"> </app-icon>
          </app-button>
          }
        </div>
      </div>
    </div>
  `,
  styleUrl: './error-display.component.css',
})
export class ErrorDisplayComponent {
  @Input() message: string = '';
  @Input() title: string = '';
  @Input() details: string = '';
  @Input() type: ErrorType = 'error';
  @Input() retryable: boolean = false;
  @Input() dismissible: boolean = false;
  @Input() retryText: string = 'Retry';
  @Input() isRetrying: boolean = false;
  @Input() showActions: boolean = true;
  @Input() compact: boolean = false;

  @Output() retryClicked = new EventEmitter<void>();
  @Output() dismissed = new EventEmitter<void>();

  onRetry(): void {
    if (this.retryable && !this.isRetrying) {
      this.retryClicked.emit();
    }
  }

  onDismiss(): void {
    if (this.dismissible) {
      this.dismissed.emit();
    }
  }

  getErrorClasses(): string {
    const classes = ['error-display', `error-${this.type}`];

    if (this.compact) {
      classes.push('error-compact');
    }

    return classes.join(' ');
  }

  getIconName(): 'warning' | 'info' | 'close' {
    switch (this.type) {
      case 'error':
        return 'warning';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'warning';
    }
  }

  getIconColor(): string {
    switch (this.type) {
      case 'error':
        return 'danger';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'danger';
    }
  }

  getErrorTitle(): string {
    if (this.title) return this.title;

    switch (this.type) {
      case 'error':
        return 'Error';
      case 'warning':
        return 'Warning';
      case 'info':
        return 'Information';
      default:
        return 'Error';
    }
  }
}
