import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- TOP BAR -->
    <header class="topbar">
      <div class="brand">
        <span class="brand-name">VictusDeck</span>
        <span class="brand-sep">·</span>
        <span class="brand-sub">HP Victus Tuning Suite</span>
      </div>
      <div class="status-pill">{{ statusText }}</div>
    </header>
  `,
  styles: [`
    /* ─── TOPBAR ─── */
    .topbar {
      height: 44px;
      min-height: 44px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      background: #0d0d0d;
      border-bottom: none;
      flex-shrink: 0;
      user-select: none;
    }
    .brand { display: flex; align-items: center; gap: 8px; }
    .brand-name { font-size: 13px; font-weight: 600; color: #e0e0e0; }
    .brand-sep { color: #333; font-size: 12px; }
    .brand-sub { font-size: 10px; color: #444; }
    .status-pill {
      padding: 4px 12px;
      border-radius: 8px;
      background: #1e1e1e;
      border: 1px solid #2a2a2a;
      font-size: 11px;
      color: #888;
    }
  `]
})
export class TopBarComponent {
  @Input() statusText: string = '';
}
