import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-nav-rail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- ══ LEFT: FULL-HEIGHT NAV RAIL (anchored to window, not content) ══ -->
    <nav class="nav-rail">
      <div class="brand-pill">
        <span class="brand-dot"></span>
      </div>
      <!-- Quick button -->
      <button class="nav-btn" [class.nav-btn--active]="activePage === 'quick'" (click)="setPage('quick')" title="Quick Control">
        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
          <path fill-rule="evenodd" d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z" clip-rule="evenodd"/>
        </svg>
        <span class="nav-label">Quick</span>
      </button>
      <!-- Stress button -->
      <button class="nav-btn" [class.nav-btn--active]="activePage === 'stress'" (click)="setPage('stress')" title="Stress Test">
        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
          <path fill-rule="evenodd" d="M12.963 2.285a.75.75 0 0 0-1.071-.105 9.715 9.715 0 0 1-3.662 1.777C7.03 4.3 6 5.376 6 6.75c0 1.258.625 2.186 1.488 2.76.818.544 1.83.746 2.512.746a.75.75 0 0 0 .736-.834 5.25 5.25 0 0 1 .425-3.32.75.75 0 0 1 1.157-.117 9.716 9.716 0 0 1 2.424 5.12 3.75 3.75 0 0 0 2.222-2.12.75.75 0 0 0-.613-.984 6.75 6.75 0 0 1-3.42-8.794ZM4.002 18.003A8.966 8.966 0 0 0 12 22.002a8.966 8.966 0 0 0 7.998-3.999A9.957 9.957 0 0 1 12 16.002a9.956 9.956 0 0 1-7.998 2.001Z" clip-rule="evenodd"/>
        </svg>
        <span class="nav-label">Stress</span>
      </button>
    </nav>
  `,
  styles: [`
    /* ─── NAV RAIL: fixed full height on left ─── */
    .nav-rail {
      width: 56px;
      min-width: 56px;
      height: 100vh;
      background: #0d0d0d;
      border-right: 1px solid #222;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px 0;
      gap: 6px;
      flex-shrink: 0;
      z-index: 10;
    }
    .brand-pill {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;
    }
    .brand-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #3b82f6;
    }
    .nav-btn {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      border: none;
      background: transparent;
      color: #444;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      transition: background 150ms ease, color 150ms ease;
    }
    .nav-btn:hover { background: #161616; color: #aaa; }
    .nav-btn--active { background: #1a2a3a; color: #3b82f6; }
    .nav-btn--active:hover { background: #1e3040; }
    .nav-label { font-size: 9px; font-weight: 500; letter-spacing: 0.04em; text-transform: uppercase; }
  `]
})
export class NavRailComponent {
  @Input() activePage: 'quick' | 'stress' = 'quick';
  @Output() pageChange = new EventEmitter<'quick' | 'stress'>();

  setPage(page: 'quick' | 'stress') {
    this.activePage = page;
    this.pageChange.emit(page);
  }
}
