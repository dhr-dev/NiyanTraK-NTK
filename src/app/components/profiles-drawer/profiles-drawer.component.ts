import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profiles-drawer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="profiles-drawer" [class.profiles-drawer--open]="open">
      <div class="drawer-header">
        <span class="drawer-title">PROFILES</span>
      </div>
      <div class="drawer-cards">
        <div *ngFor="let p of profiles"
          class="drawer-card"
          [class.drawer-card--active]="currentProfile === p.name"
          (click)="selectProfile.emit(p.name)"
        >
          <div class="drawer-card-name">{{ p.label }}</div>
          <div class="drawer-card-spec">{{ p.powerLimit }}W · {{ p.fanLabel }}</div>
        </div>
        <div class="drawer-card"
          [class.drawer-card--active]="currentProfile === 'custom'"
          (click)="selectProfile.emit('custom')"
        >
          <div class="drawer-card-name">+ Custom</div>
          <div class="drawer-card-spec">Manual</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ─── PROFILES DRAWER ─── */
    .profiles-drawer {
      background: #171717;
      border: 1px solid #242424;
      border-radius: 14px;
      margin: 0 59px 0 16px;
      flex-shrink: 0;
      max-height: 0;
      overflow: hidden;
      opacity: 0;
      transition: max-height 300ms cubic-bezier(0.4,0,0.2,1), opacity 200ms ease, margin 300ms cubic-bezier(0.4,0,0.2,1), padding 200ms ease;
    }
    .profiles-drawer--open {
      max-height: 130px;
      opacity: 1;
      margin: 8px 59px 8px 16px;
      padding: 4px 0;
      box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    }
    .drawer-header {
      display: flex;
      align-items: center;
      padding: 12px 16px 8px;
    }
    .drawer-title { font-size: 10px; font-weight: 600; color: #555; text-transform: uppercase; letter-spacing: 0.1em; }
    .drawer-cards {
      display: flex;
      gap: 8px;
      padding: 0 16px 12px;
      overflow-x: auto;
    }
    .drawer-cards::-webkit-scrollbar { display: none; }
    .drawer-card {
      flex-shrink: 0;
      width: 130px;
      background: #171717;
      border: 1px solid #242424;
      border-radius: 10px;
      padding: 10px 12px;
      cursor: pointer;
      transition: background 150ms, border-color 150ms;
    }
    .drawer-card:hover { background: #1e1e1e; border-color: #333; }
    .drawer-card--active {
      background: #141e2a;
      border-left: 2px solid #3b82f6;
      border-top-color: #1a3a5a;
      border-right-color: #1a3a5a;
      border-bottom-color: #1a3a5a;
      border-radius: 0 10px 10px 0;
    }
    /* Profile name: larger and clearly readable */
    .drawer-card-name { font-size: 13px; font-weight: 600; color: #ddd; }
    .drawer-card-spec { font-size: 10px; color: #555; text-transform: uppercase; margin-top: 3px; letter-spacing: 0.04em; }
  `]
})
export class ProfilesDrawerComponent {
  @Input() open: boolean = false;
  @Input() currentProfile: string = '';
  @Input() profiles: any[] = [];
  @Output() selectProfile = new EventEmitter<string>();
}
