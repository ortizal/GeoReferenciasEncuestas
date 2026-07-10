import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="app-footer">
      <div class="footer-left">
        <span class="footer-copyright">&copy; {{ year }} ALANTEK. Todos los derechos reservados.</span>
      </div>
      <div class="footer-center">
        <span class="footer-brand">
          <span class="brand-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" opacity="0.8"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
          Powered by <strong>ALANTEK</strong> GeoRef Platform
        </span>
      </div>
      <div class="footer-right">
        <span class="footer-version">v1.0.0</span>
      </div>
    </footer>
  `,
  styles: [`
    .app-footer {
      display: flex; justify-content: space-between; align-items: center;
      padding: 0 var(--space-5); height: var(--footer-height, 48px);
      background: var(--bg-surface); border-top: 1px solid var(--border-default);
      font-size: var(--text-xs); color: var(--text-tertiary);
    }
    .footer-left, .footer-center, .footer-right { display: flex; align-items: center; }
    .footer-brand { display: flex; align-items: center; gap: 0.375rem; }
    .brand-icon { display: flex; align-items: center; color: var(--primary-500); }
    .footer-brand strong { color: var(--text-secondary); font-weight: 600; }
    .footer-version {
      padding: 0.15em 0.5em; background: var(--neutral-100); border-radius: var(--radius-sm);
      font-size: 0.625rem; font-weight: 500; color: var(--text-tertiary);
    }
    [data-theme="dark"] .footer-version { background: rgba(255,255,255,0.06); }
  `]
})
export class FooterComponent {
  year = new Date().getFullYear();
}
