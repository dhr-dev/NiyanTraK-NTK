import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-nav-rail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- ══ LEFT: FULL-HEIGHT NAV RAIL (anchored to window, not content) ══ -->
    <nav class="nav-rail">
      <!-- Top Group: Navigation Pages -->
      <div class="nav-group-top">
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
      </div>

      <!-- Bottom Group: Utilities & Settings -->
      <div class="nav-group-bottom">
        <!-- Settings tab button -->
        <button class="nav-btn" [class.nav-btn--active]="activePage === 'settings'" (click)="setPage('settings')" title="System Settings">
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path fill-rule="evenodd" d="M11.078 2.25c-.77 0-1.365.628-1.395 1.398-.031.786-.05 1.573-.058 2.36l-.001.077c-.504.053-1.002.138-1.492.256-.474-.474-.954-.94-1.427-1.408-.56-.554-1.464-.537-1.996.064l-.999 1.13c-.504.57-.468 1.455.074 1.993.473.468.952.94 1.43 1.408a8.318 8.318 0 0 0-.256 1.493l-.077.001c-.787.008-1.574.027-2.36.058a1.4 1.4 0 0 0-1.399 1.395l-.001 1.503c0 .77.628 1.366 1.398 1.396.786.03 1.573.05 2.36.058l.077.001c.053.504.138 1.002.256 1.492-.474.474-.94.954-1.408 1.427a1.402 1.402 0 0 0 .064 1.996l1.13.999c.57.504 1.455.468 1.993-.074.468-.473.94-.952 1.408-1.43.49.118.988.203 1.492.256l.001.077c.008.787.027 1.574.058 2.36a1.4 1.4 0 0 0 1.395 1.399l1.503.001c.77 0 1.366-.628 1.396-1.398.03-.786.05-1.573.058-2.36l.001-.077c.504-.053 1.002-.138 1.492-.256.474.474.954.94 1.427 1.408.56.554 1.464.537 1.996-.064l.999-1.13c.504-.57.468-1.455-.074-1.993-.473-.468-.952-.94-1.43-1.408.118-.49.203-.988.256-1.492l.077-.001c.787-.008 1.574-.027 2.36-.058a1.4 1.4 0 0 0 1.399-1.395l.001-1.503c0-.77-.628-1.366-1.398-1.396-.786-.03-1.573-.05-2.36-.058l-.077-.001a8.318 8.318 0 0 0-.256-1.492c.474-.474.94-.954 1.408-1.427a1.402 1.402 0 0 0-.064-1.996l-1.13-.999c-.57-.504-1.455-.468-1.993.074-.468.473-.94.952-1.408 1.43a8.306 8.306 0 0 0-1.492-.256l-.001-.077c-.008-.787-.027-1.574-.058-2.36A1.4 1.4 0 0 0 12.583 2.25l-1.505-.001Zm-1.578 9.75a2.5 2.5 0 1 1 5 0 2.5 2.5 0 0 1-5 0Z" clip-rule="evenodd"/>
          </svg>
          <span class="nav-label">Settings</span>
        </button>
      </div>
    </nav>
  `,
  styles: [`
    /* ─── NAV RAIL: fixed full height on left ─── */
    .nav-rail {
      width: 56px;
      min-width: 56px;
      height: 100%;
      background: #0d0d0d;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      padding: 16px 0 12px 0;
      flex-shrink: 0;
      z-index: 10;
    }
    .nav-group-top, .nav-group-bottom {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      width: 100%;
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
    .nav-label { font-size: 8px; font-weight: 600; letter-spacing: 0.02em; text-transform: uppercase; }
  `]
})
export class NavRailComponent {
  @Input() activePage: 'quick' | 'stress' | 'settings' = 'quick';
  @Output() pageChange = new EventEmitter<'quick' | 'stress' | 'settings'>();

  setPage(page: 'quick' | 'stress' | 'settings') {
    this.activePage = page;
    this.pageChange.emit(page);
  }
}
