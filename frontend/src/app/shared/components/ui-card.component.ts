import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ui-card" [class.flat]="variant()==='flat'" [class.elevated]="variant()==='elevated'">
      <div *ngIf="title() || subtitle()" class="ui-card-header">
        <div><h3 *ngIf="title()" class="ui-card-title">{{ title() }}</h3>
        <p *ngIf="subtitle()" class="ui-card-subtitle">{{ subtitle() }}</p></div>
        <ng-content select="[header-actions]"></ng-content>
      </div>
      <div class="ui-card-body" [class.no-padding]="noPadding()"><ng-content></ng-content></div>
      <div *ngIf="footer()" class="ui-card-footer"><ng-content select="[card-footer]"></ng-content></div>
    </div>
  `,
  styles: [`
    .ui-card { background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: var(--radius-xl); box-shadow: var(--shadow-xs); transition: box-shadow var(--transition-base); overflow: hidden; &:hover { box-shadow: var(--shadow-sm); } }
    .ui-card.flat { box-shadow: none; }
    .ui-card.elevated { box-shadow: var(--shadow-md); border-color: transparent; }
    .ui-card-header { display: flex; align-items: center; justify-content: space-between; padding: var(--space-4) var(--space-5); border-bottom: 1px solid var(--border-light); }
    .ui-card-title { font-size: var(--text-base); font-weight: var(--weight-semibold); color: var(--text-primary); margin: 0; }
    .ui-card-subtitle { font-size: var(--text-xs); color: var(--text-secondary); margin: 0.125rem 0 0; }
    .ui-card-body { padding: var(--space-5); &.no-padding { padding: 0; } }
    .ui-card-footer { padding: var(--space-4) var(--space-5); border-top: 1px solid var(--border-light); background: var(--neutral-25); }
  `]
})
export class UiCardComponent {
  title = input(''); subtitle = input(''); footer = input(false); noPadding = input(false);
  variant = input<'default'|'flat'|'elevated'>('default');
}
