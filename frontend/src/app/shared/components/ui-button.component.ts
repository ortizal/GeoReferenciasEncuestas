import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button [type]="type()" [class]="classes" [disabled]="disabled() || loading()" (click)="onClick.emit($event)">
      <span class="btn-inner">
        <i *ngIf="icon() && !loading()" class="bi" [ngClass]="icon()"></i>
        <span *ngIf="loading()" class="spinner"></span>
        <span *ngIf="label()">{{ label() }}</span>
        <ng-content></ng-content>
      </span>
    </button>
  `,
  styles: [`
    :host { display: inline-flex; }
    button {
      display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
      font-family: var(--font-sans); font-weight: 500; border: none; cursor: pointer;
      transition: all var(--transition-base); white-space: nowrap; position: relative; overflow: hidden;
      &:disabled { opacity: 0.55; cursor: not-allowed; }
    }
    .btn-inner { display: flex; align-items: center; gap: 0.5rem; }
    .btn-xs { height: 28px; padding: 0 0.625rem; font-size: 0.75rem; border-radius: var(--radius-sm); }
    .btn-sm { height: 34px; padding: 0 0.875rem; font-size: 0.8125rem; border-radius: var(--radius-md); }
    .btn-md { height: 40px; padding: 0 1.125rem; font-size: 0.875rem; border-radius: var(--radius-md); }
    .btn-lg { height: 46px; padding: 0 1.5rem; font-size: 0.9375rem; border-radius: var(--radius-lg); }

    .btn-primary { background: var(--primary-600); color: #fff; box-shadow: 0 1px 2px rgba(45,77,45,0.2);
      &:hover:not(:disabled) { background: var(--primary-700); box-shadow: 0 2px 8px rgba(45,77,45,0.25); transform: translateY(-1px); }
      &:active:not(:disabled) { transform: translateY(0); }
    }
    .btn-secondary { background: var(--bg-surface); color: var(--text-primary); border: 1px solid var(--border-default);
      &:hover:not(:disabled) { background: var(--bg-hover); border-color: var(--neutral-300); }
    }
    .btn-ghost { background: transparent; color: var(--text-secondary);
      &:hover:not(:disabled) { background: var(--bg-hover); color: var(--text-primary); }
    }
    .btn-danger { background: var(--danger-600); color: #fff;
      &:hover:not(:disabled) { background: var(--danger-700); box-shadow: 0 2px 8px rgba(220,38,38,0.25); transform: translateY(-1px); }
    }
    .btn-success { background: var(--success-600); color: #fff;
      &:hover:not(:disabled) { background: #15803d; transform: translateY(-1px); }
    }
    .btn-outline-primary { background: transparent; border: 1px solid var(--primary-300); color: var(--primary-700);
      &:hover:not(:disabled) { background: var(--primary-50); border-color: var(--primary-400); }
    }
    .btn-outline { background: transparent; border: 1px solid var(--border-default); color: var(--text-secondary);
      &:hover:not(:disabled) { background: var(--bg-hover); color: var(--text-primary); }
    }
    .btn-icon { padding: 0; aspect-ratio: 1; }
    .btn-icon.btn-xs { width: 28px; } .btn-icon.btn-sm { width: 34px; } .btn-icon.btn-md { width: 40px; }

    .spinner { width: 1em; height: 1em; border: 2px solid currentColor; border-right-color: transparent; border-radius: 50%; animation: spin 0.6s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class UiButtonComponent {
  type = input<'button'|'submit'|'reset'>('button');
  variant = input<'primary'|'secondary'|'ghost'|'danger'|'success'|'outline'|'outline-primary'>('primary');
  size = input<'xs'|'sm'|'md'|'lg'>('md');
  label = input('');
  icon = input('');
  loading = input(false);
  disabled = input(false);
  iconOnly = input(false);
  onClick = output<Event>();

  get classes(): string {
    const c = ['btn', `btn-${this.variant()}`, `btn-${this.size()}`];
    if (this.iconOnly()) c.push('btn-icon');
    return c.join(' ');
  }
}
