import { CommonModule } from '@angular/common';
import { Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SelectOption } from '../../types/components.types';

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BaseSelectComponent),
      multi: true,
    },
  ],
  template: `
    <div class="select-wrapper">
      @if (label) {
      <label [for]="selectId" class="select-label">
        {{ label }}
        @if (required) {
        <span class="required-asterisk">*</span>
        }
      </label>
      }

      <select
        [id]="selectId"
        [class]="getSelectClasses()"
        [disabled]="disabled"
        [required]="required"
        [value]="value"
        (change)="onChange($event)"
        (blur)="onBlur($event)"
        (focus)="onFocus($event)"
      >
        @if (placeholder) {
        <option value="" disabled>{{ placeholder }}</option>
        } @for (option of options; track option.value) {
        <option [value]="option.value" [disabled]="option.disabled || false">
          {{ option.label }}
        </option>
        }
      </select>

      @if (error) {
      <div class="select-error">
        {{ error }}
      </div>
      } @if (helpText && !error) {
      <div class="select-help">
        {{ helpText }}
      </div>
      }
    </div>
  `,
  styleUrl: './base-select.component.css',
})
export class BaseSelectComponent<T = any> implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() placeholder: string = '';
  @Input() options: SelectOption<T>[] = [];
  @Input() disabled: boolean = false;
  @Input() required: boolean = false;
  @Input() error: string | null = null;
  @Input() helpText: string = '';
  @Input() selectId: string = `select-${Math.random().toString(36).substr(2, 9)}`;

  @Output() valueChange = new EventEmitter<T>();
  @Output() focused = new EventEmitter<Event>();
  @Output() blurred = new EventEmitter<Event>();

  value: T | null = null;

  // ControlValueAccessor implementation
  private onChangeCallback = (value: T): void => {};
  private onTouchedCallback = (): void => {};

  writeValue(value: T): void {
    this.value = value;
  }

  registerOnChange(fn: (value: T) => void): void {
    this.onChangeCallback = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedCallback = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const selectedValue = target.value as T;
    this.value = selectedValue;
    this.onChangeCallback(selectedValue);
    this.valueChange.emit(selectedValue);
  }

  onBlur(event: Event): void {
    this.onTouchedCallback();
    this.blurred.emit(event);
  }

  onFocus(event: Event): void {
    this.focused.emit(event);
  }

  getSelectClasses(): string {
    const classes = ['form-control', 'form-select'];

    if (this.error) {
      classes.push('is-invalid');
    }

    if (this.disabled) {
      classes.push('disabled');
    }

    return classes.join(' ');
  }
}
