import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './header/header.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { FooterComponent } from './footer/footer.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, HeaderComponent, SidebarComponent, FooterComponent, RouterOutlet],
  template: `
    <div class="app-layout" [class.sidebar-collapsed]="sidebarCollapsed()">
      <app-sidebar [isCollapsed]="sidebarCollapsed()"></app-sidebar>
      <div class="main-area">
        <app-header (toggleSidebar)="toggleSidebar()"></app-header>
        <main class="main-content">
          <router-outlet></router-outlet>
        </main>
        <app-footer></app-footer>
      </div>
    </div>
  `,
  styles: [`
    .app-layout { display: flex; min-height: 100vh; }
    .main-area {
      flex: 1; margin-left: var(--sidebar-width); transition: margin-left var(--transition-slow);
      display: flex; flex-direction: column; min-height: 100vh;
    }
    .sidebar-collapsed .main-area { margin-left: var(--sidebar-collapsed-width); }
    .main-content { flex: 1; padding: var(--space-6); background: var(--bg-app); overflow-y: auto; }
    @media (max-width: 768px) {
      .main-area { margin-left: 0; }
    }
  `]
})
export class MainLayoutComponent implements OnInit {
  sidebarCollapsed = signal(false);

  ngOnInit() {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved) this.sidebarCollapsed.set(saved === 'true');

    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
  }

  toggleSidebar() {
    this.sidebarCollapsed.update(v => {
      const next = !v;
      localStorage.setItem('sidebar-collapsed', String(next));
      return next;
    });
  }
}
