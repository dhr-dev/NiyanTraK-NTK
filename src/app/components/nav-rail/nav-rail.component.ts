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
        <svg class="brand-icon" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="hexGradTop" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#93c5fd" />
              <stop offset="100%" stop-color="#3b82f6" />
            </linearGradient>
            <linearGradient id="hexGradLeft" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#60a5fa" />
              <stop offset="100%" stop-color="#2563eb" />
            </linearGradient>
            <linearGradient id="hexGradRight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#3b82f6" />
              <stop offset="100%" stop-color="#1d4ed8" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <path d="M50 33L50 51.6M34 61L50 51.6M66 61L50 51.6" stroke="#ffffff" stroke-width="2" opacity="0.3" stroke-linecap="round"/>
          <polygon points="50,18 63,25.5 63,40.5 50,48 37,40.5 37,25.5" fill="url(#hexGradTop)" stroke="#1e293b" stroke-width="1.5" />
          <circle cx="50" cy="33" r="3" fill="#ffffff" opacity="0.8" />
          <polygon points="34,46 47,53.5 47,68.5 34,76 21,68.5 21,53.5" fill="url(#hexGradLeft)" stroke="#1e293b" stroke-width="1.5" />
          <circle cx="34" cy="61" r="3" fill="#ffffff" opacity="0.8" />
          <polygon points="66,46 79,53.5 79,68.5 66,76 53,68.5 53,53.5" fill="url(#hexGradRight)" stroke="#1e293b" stroke-width="1.5" />
          <circle cx="66" cy="61" r="3" fill="#ffffff" opacity="0.8" />
          <circle cx="50" cy="51.6" r="4.5" fill="#ffffff" filter="url(#glow)" />
        </svg>
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
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 6px 0 12px 0;
      gap: 6px;
      flex-shrink: 0;
      z-index: 10;
    }
    .brand-pill {
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
    }
    .brand-icon {
      width: 34px;
      height: 34px;
      filter: drop-shadow(0 2px 8px rgba(37, 99, 235, 0.4));
      transition: transform 300ms ease;
    }
    .brand-icon:hover {
      transform: scale(1.1);
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
