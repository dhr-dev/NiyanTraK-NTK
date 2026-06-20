import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-fan-control',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="card fan-card">
      <div class="card-header">
        <h2 class="section-title">Fan Control</h2>
        <div class="mode-segments">
          <button class="segment-btn" [class.segment-btn--active]="mode === 'hp-auto'" (click)="setMode('hp-auto')">HP Auto</button>
          <button class="segment-btn" [class.segment-btn--active]="mode === 'smart-auto'" (click)="setMode('smart-auto')">Smart Auto</button>
          <button class="segment-btn" [class.segment-btn--active]="mode === 'manual'" (click)="setMode('manual')">Manual</button>
        </div>
      </div>

      <div class="slider-block" [class.slider-block--disabled]="mode !== 'manual' && mode !== 'smart-auto'">
        <div class="slider-labels">
          <span class="slider-edge">Silent</span>
          <span class="slider-edge">Max</span>
        </div>
        <input type="range" class="range-slider" id="fan-slider"
          min="8" max="39" step="1"
          [(ngModel)]="level"
          (ngModelChange)="levelChange.emit($event)"
          [disabled]="mode !== 'manual'"
          [ngStyle]="{'--fill-pct': fanSliderFill}"/>
        <div class="fan-readout-row">
          <div class="fan-readout">
            <span class="readout-big">{{ mode === 'hp-auto' ? 'Auto (HP)' : getRpm(level) + ' RPM' }}</span>
            <span class="readout-sub">{{ mode === 'hp-auto' ? 'Thermal policy' : (mode === 'smart-auto' ? 'Smart Auto · L' + level : 'Manual · L' + level) }}</span>
          </div>
          <button *ngIf="mode === 'smart-auto'" class="config-gear-btn" (click)="configureCurve.emit()" title="Configure Curve">
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
              <path fill-rule="evenodd" d="M11.078 2.25c-.77 0-1.365.628-1.395 1.398-.031.786-.05 1.573-.058 2.36l-.001.077c-.504.053-1.002.138-1.492.256-.474-.474-.954-.94-1.427-1.408-.56-.554-1.464-.537-1.996.064l-.999 1.13c-.504.57-.468 1.455.074 1.993.473.468.952.94 1.43 1.408a8.318 8.318 0 0 0-.256 1.493l-.077.001c-.787.008-1.574.027-2.36.058a1.4 1.4 0 0 0-1.399 1.395l-.001 1.503c0 .77.628 1.366 1.398 1.396.786.03 1.573.05 2.36.058l.077.001c.053.504.138 1.002.256 1.492-.474.474-.94.954-1.408 1.427a1.402 1.402 0 0 0 .064 1.996l1.13.999c.57.504 1.455.468 1.993-.074.468-.473.94-.952 1.408-1.43.49.118.988.203 1.492.256l.001.077c.008.787.027 1.574.058 2.36a1.4 1.4 0 0 0 1.395 1.399l1.503.001c.77 0 1.366-.628 1.396-1.398.03-.786.05-1.573.058-2.36l.001-.077c.504-.053 1.002-.138 1.492-.256.474.474.954.94 1.427 1.408.56.554 1.464.537 1.996-.064l.999-1.13c.504-.57.468-1.455-.074-1.993-.473-.468-.952-.94-1.43-1.408.118-.49.203-.988.256-1.492l.077-.001c.787-.008 1.574-.027 2.36-.058a1.4 1.4 0 0 0 1.399-1.395l.001-1.503c0-.77-.628-1.366-1.398-1.396-.786-.03-1.573-.05-2.36-.058l-.077-.001a8.318 8.318 0 0 0-.256-1.492c.474-.474.94-.954 1.408-1.427a1.402 1.402 0 0 0-.064-1.996l-1.13-.999c-.57-.504-1.455-.468-1.993.074-.468.473-.94.952-1.408 1.43a8.306 8.306 0 0 0-1.492-.256l-.001-.077c-.008-.787-.027-1.574-.058-2.36A1.4 1.4 0 0 0 12.583 2.25l-1.505-.001Zm-1.578 9.75a2.5 2.5 0 1 1 5 0 2.5 2.5 0 0 1-5 0Z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
      </div>

      <button *ngIf="mode === 'manual'" class="apply-btn" (click)="apply.emit()">Apply Fan</button>
      <div *ngIf="mode === 'smart-auto'" class="active-badge">Smart Fan Active</div>
      <div *ngIf="mode === 'hp-auto'" class="active-badge inactive">System Managed</div>
    </section>
  `,
  styles: [`
    .card {
      position: relative;
      z-index: 1;
      background: rgba(255, 255, 255, 0.04);
      backdrop-filter: blur(28px) brightness(1.08) saturate(160%);
      -webkit-backdrop-filter: blur(28px) brightness(1.08) saturate(160%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 14px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      height: 100%;
      box-shadow:
        0 8px 32px 0 rgba(0, 0, 0, 0.5),
        inset 0 1px 0 rgba(255, 255, 255, 0.12),
        inset 0 -1px 0 rgba(0, 0, 0, 0.2);
      overflow: hidden;
    }
    .card::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.07) 0%,
        rgba(255, 255, 255, 0.01) 40%,
        rgba(255, 255, 255, 0.00) 60%
      );
      pointer-events: none;
      z-index: 0;
    }
    .card > * { position: relative; z-index: 1; }
    .fan-card { flex: 1; }
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .section-title { font-size: 13px; font-weight: 600; color: #fff; letter-spacing: 0.02em; }

    /* ─── SEGMENT CONTROL ─── */
    .mode-segments {
      display: flex;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      padding: 2px;
    }
    .segment-btn {
      background: none;
      border: none;
      color: #888;
      font-size: 10px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 150ms ease;
    }
    .segment-btn:hover {
      color: #ccc;
      background: rgba(255, 255, 255, 0.03);
    }
    .segment-btn--active {
      color: #3b82f6;
      background: rgba(59, 130, 246, 0.15);
      border: 1px solid rgba(59, 130, 246, 0.1);
    }

    /* ─── SLIDER ─── */
    .slider-block { display: flex; flex-direction: column; gap: 6px; }
    .slider-block--disabled { opacity: 0.35; pointer-events: none; }
    .slider-labels { display: flex; justify-content: space-between; }
    .slider-edge { font-size: 12.5px; color: #bbb; }

    .range-slider {
      -webkit-appearance: none;
      appearance: none;
      width: 100%;
      height: 5px;
      border-radius: 9999px;
      background: linear-gradient(
        to right,
        #3b82f6 var(--fill-pct, 0%),
        rgba(255, 255, 255, 0.08) var(--fill-pct, 0%)
      );
      box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.4);
      outline: none;
      cursor: pointer;
      display: block;
    }
    .range-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 18px; height: 18px;
      border-radius: 50%;
      background: #fff;
      border: 2px solid #3b82f6;
      cursor: pointer;
      transition: transform 150ms ease, box-shadow 150ms ease;
      position: relative;
      z-index: 1;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5), 0 0 0 0 rgba(59, 130, 246, 0.35);
    }
    .range-slider::-webkit-slider-thumb:hover {
      transform: scale(1.15);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5), 0 0 0 4px rgba(59, 130, 246, 0.2);
    }
    .range-slider::-moz-range-thumb {
      width: 18px; height: 18px;
      border-radius: 50%;
      background: #fff;
      border: 2px solid #3b82f6;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
    }
    .range-slider:disabled { opacity: 0.4; cursor: not-allowed; }

    .fan-readout-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .fan-readout { display: flex; flex-direction: column; gap: 1px; }
    .readout-big { font-size: 22px; font-weight: 600; color: #fff; line-height: 1.1; text-shadow: 0 0 12px rgba(59, 130, 246, 0.25); }
    .readout-sub { font-size: 12.5px; color: #aaa; }

    .config-gear-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 50%;
      color: #888;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 200ms ease;
    }
    .config-gear-btn:hover {
      color: #3b82f6;
      background: rgba(59, 130, 246, 0.12);
      border-color: rgba(59, 130, 246, 0.3);
      transform: rotate(45deg);
    }

    /* ─── APPLY BUTTON & BADGES ─── */
    .apply-btn {
      width: 100%; height: 34px;
      background: rgba(59, 130, 246, 0.12);
      border: 1px solid rgba(59, 130, 246, 0.35);
      border-radius: 8px; color: #3b82f6;
      font-size: 12px; font-weight: 600;
      transition: all 200ms ease;
      display: flex; align-items: center; justify-content: center;
      margin-top: auto;
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
      cursor: pointer;
    }
    .apply-btn:hover {
      background: rgba(59, 130, 246, 0.22);
      border-color: rgba(59, 130, 246, 0.5);
      color: #60a5fa;
      box-shadow: 0 4px 16px rgba(59, 130, 246, 0.25);
    }
    .active-badge {
      font-size: 10px; font-weight: 700; color: #10b981;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.2);
      border-radius: 6px; padding: 5px; text-align: center;
      margin-top: auto; text-transform: uppercase; letter-spacing: 0.05em;
    }
    .active-badge.inactive {
      color: #f59e0b;
      background: rgba(245, 158, 11, 0.1);
      border-color: rgba(245, 158, 11, 0.2);
    }
    @media (max-width: 750px) {
      .readout-big { font-size: 18px !important; }
      .readout-sub { font-size: 11px !important; }
      .section-title { font-size: 11px !important; }
      .segment-btn { font-size: 9px !important; padding: 3px 6px !important; }
    }
  `]
})
export class FanControlComponent {
  @Input() mode: 'hp-auto' | 'smart-auto' | 'manual' = 'manual';
  @Input() level: number = 30;
  @Output() modeChange = new EventEmitter<'hp-auto' | 'smart-auto' | 'manual'>();
  @Output() levelChange = new EventEmitter<number>();
  @Output() apply = new EventEmitter<void>();
  @Output() configureCurve = new EventEmitter<void>();

  get fanSliderFill(): string {
    return `${((this.level - 8) / 31) * 100}%`;
  }

  setMode(newMode: 'hp-auto' | 'smart-auto' | 'manual') {
    this.mode = newMode;
    this.modeChange.emit(newMode);
  }

  getRpm(level: number): number {
    if (level === 8)                return 800;
    if (level === 9)                return 1200;
    if (level >= 10 && level <= 19) return 1600 + (level - 10) * 100;
    if (level === 29)               return 4200;
    if (level >= 20 && level <= 28) return 3200 + (level - 20) * 100;
    if (level >= 30)                return 4800 + (level - 30) * 100;
    return 800;
  }
}
