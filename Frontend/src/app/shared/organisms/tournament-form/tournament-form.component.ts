import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BaseButtonComponent } from '../../atoms/button/base-button.component';
import { BaseInputComponent } from '../../atoms/input/base-input.component';
import { BaseSelectComponent } from '../../atoms/select/base-select.component';
import { ErrorDisplayComponent } from '../../molecules/error-display/error-display.component';
import { CreateTournamentRequest } from '../../types/api.types';
import {
  SelectOption,
  TournamentFormData,
  TournamentFormState,
} from '../../types/components.types';
import { TournamentType } from '../../types/tournament.types';

@Component({
  selector: 'app-tournament-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    BaseInputComponent,
    BaseSelectComponent,
    BaseButtonComponent,
    ErrorDisplayComponent,
  ],
  template: `
    <div class="tournament-form-container">
      <div class="form-header">
        <h1 class="form-title">{{ title }}</h1>
        @if (subtitle) {
        <p class="form-subtitle">{{ subtitle }}</p>
        }
      </div>

      @if (state.error) {
      <app-error-display
        [message]="state.error"
        type="error"
        [dismissible]="true"
        (dismissed)="clearError()"
      >
      </app-error-display>
      }

      <form [formGroup]="tournamentForm" (ngSubmit)="onSubmit()" class="tournament-form">
        <!-- Tournament Name -->
        <app-input
          label="Tournament Name"
          type="text"
          placeholder="Enter tournament name"
          [required]="true"
          [disabled]="state.isLoading"
          formControlName="name"
          [error]="getFieldError('name')"
          helpText="Choose a descriptive name for your tournament"
        >
        </app-input>

        <!-- Tournament Type -->
        <app-select
          label="Tournament Type"
          [options]="tournamentTypeOptions"
          [required]="true"
          [disabled]="state.isLoading"
          formControlName="type"
          [error]="getFieldError('type')"
          placeholder="Select tournament type"
        >
        </app-select>

        <!-- Tournament Type Description -->
        <div class="type-description" *ngIf="getSelectedTypeDescription()">
          <div class="description-card">
            <h3>{{ getSelectedTypeName() }}</h3>
            <p>{{ getSelectedTypeDescription() }}</p>
          </div>
        </div>

        <!-- Password (Optional) -->
        <app-input
          label="Password (Optional)"
          type="password"
          placeholder="Leave empty for public tournament"
          [disabled]="state.isLoading"
          formControlName="password"
          [error]="getFieldError('password')"
          helpText="Set a password to restrict tournament management access"
        >
        </app-input>

        <!-- Form Actions -->
        <div class="form-actions">
          <app-button
            type="submit"
            variant="primary"
            [disabled]="!tournamentForm.valid || state.isLoading"
            [loading]="state.isLoading"
            [loadingText]="submitLoadingText"
            [fullWidth]="true"
          >
            {{ submitText }}
          </app-button>

          @if (showCancel) {
          <app-button
            type="button"
            variant="secondary"
            [disabled]="state.isLoading"
            [fullWidth]="true"
            (clicked)="onCancel()"
          >
            {{ cancelText }}
          </app-button>
          }
        </div>
      </form>
    </div>
  `,
  styleUrl: './tournament-form.component.css',
})
export class TournamentFormComponent implements OnInit {
  @Input() title: string = 'Create New Tournament';
  @Input() subtitle: string = '';
  @Input() submitText: string = 'Create Tournament';
  @Input() submitLoadingText: string = 'Creating Tournament...';
  @Input() cancelText: string = 'Cancel';
  @Input() showCancel: boolean = true;
  @Input() initialData?: TournamentFormData;
  @Input() state: TournamentFormState = {
    isLoading: false,
    error: null,
    showPassword: true,
  };

  @Output() formSubmitted = new EventEmitter<CreateTournamentRequest>();
  @Output() formCancelled = new EventEmitter<void>();
  @Output() formChanged = new EventEmitter<TournamentFormData>();
  @Output() errorDismissed = new EventEmitter<void>();

  tournamentForm!: FormGroup;

  tournamentTypeOptions: SelectOption<TournamentType>[] = [
    {
      value: TournamentType.Swiss,
      label: 'Swiss Tournament',
    },
    {
      value: TournamentType.ChampionsMeeting,
      label: 'Champions Meeting Tournament (W.I.P)',
    },
  ];

  private typeDescriptions: Record<TournamentType, { name: string; description: string }> = {
    [TournamentType.Swiss]: {
      name: 'Swiss Tournament',
      description:
        'Players are paired each round based on their current standings. Continues until a clear winner emerges or maximum rounds are reached.',
    },
    [TournamentType.ChampionsMeeting]: {
      name: 'Champions Meeting Tournament (W.I.P)',
      description:
        'Multi-round tournament with group divisions based on performance. Top performers advance to final groups. (This tournament type is still VERY early work and is very likely to not work at all)',
    },
  };

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.tournamentForm = this.fb.group({
      name: [
        this.initialData?.name || '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(100),
          Validators.pattern(/^[a-zA-Z0-9\s\-_]+$/),
        ],
      ],
      type: [this.initialData?.type ?? TournamentType.Swiss, [Validators.required]],
      password: [this.initialData?.password || '', [Validators.maxLength(50)]],
    });

    // Subscribe to form changes
    this.tournamentForm.valueChanges.subscribe((value) => {
      this.formChanged.emit(value);
    });
  }

  onSubmit(): void {
    if (this.tournamentForm.valid && !this.state.isLoading) {
      const formData = this.tournamentForm.value;
      const request: CreateTournamentRequest = {
        name: formData.name.trim(),
        type: formData.type,
        password: formData.password?.trim() || undefined,
      };

      this.formSubmitted.emit(request);
    }
  }

  onCancel(): void {
    this.formCancelled.emit();
  }

  clearError(): void {
    this.errorDismissed.emit();
  }

  getFieldError(fieldName: string): string | null {
    const field = this.tournamentForm.get(fieldName);

    if (field?.invalid && (field.dirty || field.touched)) {
      const errors = field.errors;

      if (errors?.['required']) return `${this.getFieldLabel(fieldName)} is required`;
      if (errors?.['minlength'])
        return `${this.getFieldLabel(fieldName)} must be at least ${
          errors['minlength'].requiredLength
        } characters`;
      if (errors?.['maxlength'])
        return `${this.getFieldLabel(fieldName)} must be no more than ${
          errors['maxlength'].requiredLength
        } characters`;
      if (errors?.['pattern'])
        return `${this.getFieldLabel(fieldName)} contains invalid characters`;
    }

    return null;
  }

  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      name: 'Tournament name',
      type: 'Tournament type',
      password: 'Password',
    };
    return labels[fieldName] || fieldName;
  }

  getSelectedTypeName(): string {
    const selectedType = this.tournamentForm.get('type')?.value as TournamentType;
    return selectedType ? this.typeDescriptions[selectedType]?.name || '' : '';
  }

  getSelectedTypeDescription(): string {
    const selectedType = this.tournamentForm.get('type')?.value as TournamentType;
    return selectedType ? this.typeDescriptions[selectedType]?.description || '' : '';
  }

  resetForm(): void {
    this.tournamentForm.reset();
    if (this.initialData) {
      this.tournamentForm.patchValue(this.initialData);
    }
  }

  updateFormData(data: Partial<TournamentFormData>): void {
    this.tournamentForm.patchValue(data);
  }
}
