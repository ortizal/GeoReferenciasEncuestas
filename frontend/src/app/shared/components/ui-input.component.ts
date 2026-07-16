import { Component, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-input',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="input-wrapper" [class.has-error]="error()" [class.has-icon]="icon()">
      <label *ngIf="label()" class="input-label">{{ label() }}<span *ngIf="required()" class="req">*</span></label>
      <div class="input-container">
        <i *ngIf="icon()" class="bi input-icon" [ngClass]="icon()"></i>
        <input *ngIf="type() !== 'textarea'" [type]="showPassword() ? 'text' : type()" class="input-field"
          [placeholder]="placeholder()" [value]="value()" [disabled]="disabled()" [readonly]="readonly()"
          autocomplete="off" (input)="onInput($event)" (blur)="onBlur()">
        <textarea *ngIf="type() === 'textarea'" class="input-field textarea"
          [placeholder]="placeholder()" [value]="value()" [disabled]="disabled()" [rows]="rows()"
          (input)="onInput($event)" (blur)="onBlur()"></textarea>
        <button *ngIf="type() === 'password'" type="button" class="toggle-pw" (click)="showPassword.set(!showPassword())">
          <i class="bi" [ngClass]="showPassword() ? 'bi-eye-slash' : 'bi-eye'"></i>
        </button>
      </div>
      <span *ngIf="hint() && !error()" class="input-hint">{{ hint() }}</span>
      <span *ngIf="error()" class="input-error">{{ error() }}</span>
    </div>
  `,
  styles: [`
    .input-wrapper { display: flex; flex-direction: column; gap: 0.375rem; }
    .input-label { font-size: 0.8125rem; font-weight: 500; color: var(--text-primary); }
    .req { color: var(--danger-500); margin-left: 2px; }
    .input-container { position: relative; display: flex; align-items: center; }
    .input-icon { position: absolute; left: 0.75rem; color: var(--text-tertiary); font-size: 0.9375rem; pointer-events: none; z-index: 1; }
    .input-field {
      width: 100%; height: 40px; padding: 0 0.75rem; font-family: var(--font-sans); font-size: var(--text-sm);
      color: var(--text-primary); background: var(--bg-surface); border: 1px solid var(--border-default);
      border-radius: var(--radius-md); transition: all var(--transition-fast);
      &::placeholder { color: var(--text-tertiary); }
      &:hover:not(:disabled):not([readonly]) { border-color: var(--neutral-300); }
      &:focus { outline: none; border-color: var(--border-focus); box-shadow: 0 0 0 3px rgba(61,107,61,0.1); }
      &:disabled { background: var(--neutral-100); cursor: not-allowed; }
      &[readonly] { background: var(--neutral-50); }
    }
    .has-icon .input-field { padding-left: 2.25rem; }
    .textarea { height: auto; min-height: 80px; padding: 0.625rem 0.75rem; resize: vertical; }
    .toggle-pw { position: absolute; right: 0.5rem; background: none; border: none; color: var(--text-tertiary); cursor: pointer; padding: 0.25rem; border-radius: var(--radius-sm); display: flex; align-items: center;
      &:hover { color: var(--text-secondary); background: var(--bg-hover); }
    }
    .input-hint { font-size: 0.75rem; color: var(--text-tertiary); }
    .input-error { font-size: 0.75rem; color: var(--danger-600); }
    .has-error .input-field { border-color: var(--danger-500); &:focus { box-shadow: 0 0 0 3px rgba(239,68,68,0.1); } }
  `]
})
export class UiInputComponent {
  type = input<'text'|'password'|'email'|'number'|'textarea'|'search'>('text');
  label = input(''); placeholder = input(''); hint = input(''); error = input('');
  icon = input(''); value = input(''); disabled = input(false); readonly = input(false);
  required = input(false); rows = input(3);
  showPassword = signal(false);
  onInput(event: Event) {}
  onBlur() {}
}
