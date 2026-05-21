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
        <img class="brand-logo" src="assets/icons/Workmark-transparent-2.png" alt="NiyanTraK">
        </div>
      <div class="status-pill">{{ statusText }}</div>
    </header>
  `,
  styles: [`
    /* ─── TOPBAR ─── */
    .topbar {
      height: 62px;
      min-height: 62px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 0px 0px 0px;
      background: #0d0d0d;
      border-bottom: none;
      flex-shrink: 0;
      user-select: none;
    }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand-logo { height: 102px; object-fit: contain; display: block; }
    .brand-sep { color: #444; font-size: 16px; }
    .brand-sub { font-size: 12px; color: #666; font-weight: 500; }
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
