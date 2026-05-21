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
        <button class="pill-toggle" [class.pill-toggle--on]="enabled"
          (click)="toggle.emit()" role="switch" [attr.aria-checked]="enabled">
          <span class="pill-thumb"></span>
        </button>
      </div>

      <div class="slider-block" [class.slider-block--disabled]="!enabled">
        <div class="slider-labels">
          <span class="slider-edge">Silent</span>
          <span class="slider-edge">Max</span>
        </div>
        <input type="range" class="range-slider" id="fan-slider"
          min="8" max="39" step="1"
          [(ngModel)]="level"
          (ngModelChange)="levelChange.emit($event)"
          [disabled]="!enabled"
          [ngStyle]="{'--fill-pct': fanSliderFill}"/>
        <div class="fan-readout">
          <span class="readout-big">{{ enabled ? getRpm(level) + ' RPM' : 'Auto' }}</span>
          <span class="readout-sub">{{ enabled ? (getPercent(level) + '% · L' + level) : 'Thermal policy' }}</span>
        </div>
      </div>

      <button class="apply-btn" [disabled]="!enabled" (click)="apply.emit()">Apply Fan</button>
    </section>
  `,
  styles: [`
    /* ─── CARD (Frosted Glass via brightness+saturate + ::before sheen) ─── */
    .card {
      position: relative;
      z-index: 1;
      /* Frost: near-transparent base + high brightness push on blur to make glass visible */
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
    /* Specular glass-surface sheen via ::before */
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
    /* All direct children sit above the ::before sheen */
    .card > * { position: relative; z-index: 1; }
    .fan-card { flex: 1; }
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .section-title { font-size: 13px; font-weight: 600; color: #fff; letter-spacing: 0.02em; }

    /* ─── PILL TOGGLE (Modern Large Switch) ─── */
    .pill-toggle {
      position: relative;
      width: 44px; height: 24px;
      border-radius: 9999px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.4);
      transition: background 200ms ease, border-color 200ms ease, box-shadow 200ms ease;
      padding: 0;
      flex-shrink: 0;
      cursor: pointer;
    }
    .pill-toggle--on {
      background: rgba(59, 130, 246, 0.85);
      border-color: rgba(59, 130, 246, 0.6);
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 10px rgba(59, 130, 246, 0.35);
    }
    .pill-thumb {
      position: absolute;
      top: 3px; left: 3px;
      width: 16px; height: 16px;
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
      transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
      pointer-events: none;
    }
    .pill-toggle--on .pill-thumb {
      transform: translateX(20px);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4), 0 0 6px rgba(59, 130, 246, 0.5);
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

    .fan-readout { display: flex; flex-direction: column; gap: 1px; }
    .readout-big { font-size: 22px; font-weight: 600; color: #fff; line-height: 1.1; text-shadow: 0 0 12px rgba(59, 130, 246, 0.25); }
    .readout-sub { font-size: 12.5px; color: #aaa; }

    /* ─── APPLY BUTTON ─── */
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
    }
    .apply-btn:hover:not(:disabled) {
      background: rgba(59, 130, 246, 0.22);
      border-color: rgba(59, 130, 246, 0.5);
      color: #60a5fa;
      box-shadow: 0 4px 16px rgba(59, 130, 246, 0.25);
    }
    .apply-btn:active:not(:disabled) {
      transform: scale(0.98);
    }
    .apply-btn:disabled { opacity: 0.3; cursor: not-allowed; }
  `]
})
export class FanControlComponent {
  @Input() enabled: boolean = true;
  @Input() level: number = 30;
  @Output() toggle = new EventEmitter<void>();
  @Output() levelChange = new EventEmitter<number>();
  @Output() apply = new EventEmitter<void>();

  get fanSliderFill(): string {
    return `${((this.level - 8) / 31) * 100}%`;
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

  getPercent(level: number): number {
    return Math.round((this.getRpm(level) / 5700) * 100);
  }
}
