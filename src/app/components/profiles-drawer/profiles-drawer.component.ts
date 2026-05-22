import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profiles-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="profiles-drawer" [class.profiles-drawer--open]="open">
      <div class="drawer-header">
        <span class="drawer-title">PROFILES</span>
      </div>
      <div class="drawer-cards-wrapper" (mouseenter)="checkOverflow(cardsContainer)">
        <button *ngIf="hasOverflow" class="scroll-btn scroll-btn--left" (click)="cardsContainer.scrollBy({ left: -240, behavior: 'smooth' })" title="Scroll left">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div #cardsContainer class="drawer-cards">
          <div *ngFor="let p of profiles"
            class="drawer-card"
            [class.drawer-card--active]="currentProfile === p.name"
            (click)="selectProfile.emit(p.name)"
          >
            <div class="drawer-card-header">
              <span class="drawer-card-name">{{ p.label }}</span>
              <div class="drawer-card-actions">
                <button class="pin-preset-btn" [class.pin-preset-btn--pinned]="p.isPinned" (click)="onTogglePin($event, p.name)" [title]="p.isPinned ? 'Unpin from Widget' : 'Pin to Widget'">
                  📌
                </button>
                <button *ngIf="p.isCustom" class="delete-preset-btn" (click)="onDelete($event, p.name)" title="Delete custom preset">🗑️</button>
              </div>
            </div>
            <div class="drawer-card-spec">{{ p.powerLimit }}W · {{ p.tempLimit }}°C · {{ p.fanLabel }}</div>
          </div>
          <div class="drawer-card"
            [class.drawer-card--active]="currentProfile === 'custom'"
            (click)="onCustomCardClick()"
          >
            <ng-container *ngIf="currentProfile !== 'custom'; else customInputForm">
              <div class="drawer-card-name">+ Custom</div>
              <div class="drawer-card-spec">Manual</div>
            </ng-container>
            <ng-template #customInputForm>
              <div class="custom-form" (click)="$event.stopPropagation()">
                <input
                  type="text"
                  class="custom-preset-input"
                  placeholder="Preset Name"
                  [(ngModel)]="customPresetName"
                  (keydown.enter)="onSaveCustom()"
                  #customInput
                />
                <button class="custom-save-btn" (click)="onSaveCustom()">
                  Save
                </button>
              </div>
            </ng-template>
          </div>
        </div>
        <button *ngIf="hasOverflow" class="scroll-btn scroll-btn--right" (click)="cardsContainer.scrollBy({ left: 240, behavior: 'smooth' })" title="Scroll right">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14">
            <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
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
      justify-content: space-between;
      padding: 12px 16px 8px;
    }
    .drawer-title { font-size: 11.5px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 0.1em; }
    /* Inline Custom Form inside Card */
    .custom-form {
      display: flex;
      flex-direction: column;
      gap: 6px;
      width: 100%;
    }
    .custom-preset-input {
      width: 100%;
      background: #1e1e1e;
      border: 1px solid #333;
      border-radius: 6px;
      color: #e0e0e0;
      font-size: 12px;
      padding: 4px 8px;
      outline: none;
      transition: border-color 150ms ease, box-shadow 150ms ease;
    }
    .custom-preset-input:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }
    .custom-save-btn {
      width: 100%;
      background: #3b82f6;
      border: none;
      border-radius: 6px;
      color: #ffffff;
      font-size: 11.5px;
      font-weight: 600;
      padding: 4px 0;
      cursor: pointer;
      text-align: center;
      transition: background 150ms ease, transform 100ms ease;
    }
    .custom-save-btn:hover {
      background: #2563eb;
    }
    .custom-save-btn:active {
      transform: scale(0.97);
    }
    .drawer-cards {
      display: flex;
      gap: 8px;
      padding: 0 16px 12px;
      overflow-x: auto;
    }
    .drawer-cards::-webkit-scrollbar { display: none; }
    .drawer-card {
      flex-shrink: 0;
      width: 160px;
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
    .drawer-card--active .drawer-card-spec {
      color: #a3cfff;
    }
    /* Profile header and name */
    .drawer-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 4px;
    }
    .drawer-card-name { font-size: 13px; font-weight: 600; color: #ddd; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .drawer-card-spec {
      font-size: 11px;
      color: #888;
      text-transform: uppercase;
      margin-top: 3px;
      letter-spacing: 0.03em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .drawer-card-actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .pin-preset-btn {
      background: transparent;
      border: none;
      color: #888;
      font-size: 10px;
      padding: 2px;
      cursor: pointer;
      border-radius: 4px;
      transition: all 150ms ease;
      display: flex;
      align-items: center;
      justify-content: center;
      filter: grayscale(1) opacity(0.35);
    }
    .pin-preset-btn:hover {
      filter: grayscale(0) opacity(1);
      background: rgba(255, 255, 255, 0.05);
    }
    .pin-preset-btn--pinned {
      filter: grayscale(0) opacity(1);
    }

    .delete-preset-btn {
      background: transparent;
      border: none;
      color: #888;
      font-size: 10px;
      padding: 2px;
      cursor: pointer;
      border-radius: 4px;
      transition: color 150ms, background 150ms;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .delete-preset-btn:hover {
      color: #ef4444;
      background: rgba(239, 68, 68, 0.15);
    }

    /* ─── SCROLLABLE PROFILE GUTTERS ─── */
    .drawer-cards-wrapper {
      position: relative;
      width: 100%;
    }
    .scroll-btn {
      position: absolute;
      top: calc(50% - 6px); /* Align perfectly since drawer-cards has bottom padding */
      transform: translateY(-50%);
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: rgba(23, 23, 23, 0.85);
      border: 1px solid #242424;
      color: #888;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 10;
      opacity: 0;
      pointer-events: none;
      transition: opacity 200ms ease, background 150ms ease, border-color 150ms ease, transform 100ms ease;
      backdrop-filter: blur(4px);
    }
    .drawer-cards-wrapper:hover .scroll-btn {
      opacity: 1;
      pointer-events: auto;
    }
    .scroll-btn:hover {
      background: #1e1e1e;
      border-color: #3b82f6;
      color: #3b82f6;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
    }
    .scroll-btn:active {
      transform: translateY(-50%) scale(0.9);
    }
    .scroll-btn--left {
      left: 6px;
    }
    .scroll-btn--right {
      right: 6px;
    }
  `]
})
export class ProfilesDrawerComponent {
  @Input() open: boolean = false;
  @Input() currentProfile: string = '';
  @Input() profiles: any[] = [];
  @Output() selectProfile = new EventEmitter<string>();
  @Output() savePreset = new EventEmitter<string>();
  @Output() deletePreset = new EventEmitter<string>();
  @Output() togglePin = new EventEmitter<string>();

  hasOverflow = false;
  customPresetName: string = '';

  onDelete(event: Event, name: string) {
    event.stopPropagation();
    this.deletePreset.emit(name);
  }

  onTogglePin(event: Event, name: string) {
    event.stopPropagation();
    this.togglePin.emit(name);
  }

  checkOverflow(el: HTMLElement) {
    this.hasOverflow = el.scrollWidth > el.clientWidth;
  }

  onCustomCardClick() {
    if (this.currentProfile !== 'custom') {
      this.selectProfile.emit('custom');
      this.customPresetName = '';
    }
  }

  onSaveCustom() {
    const trimmed = this.customPresetName.trim();
    if (trimmed) {
      this.savePreset.emit(trimmed);
      this.customPresetName = '';
    }
  }
}
