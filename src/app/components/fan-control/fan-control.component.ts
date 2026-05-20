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
    /* ─── CARD ─── */
    .card {
      background: #171717;
      border: 1px solid #242424;
      border-radius: 14px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      height: 100%;
    }
    .fan-card { flex: 1; }
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .section-title { font-size: 13px; font-weight: 500; color: #bbb; }

    /* ─── PILL TOGGLE ─── */
    .pill-toggle {
      position: relative;
      width: 28px; height: 14px;
      border-radius: 9999px;
      background: #2a2a2a;
      border: none;
      transition: background 150ms ease;
      padding: 0;
      flex-shrink: 0;
    }
    .pill-toggle--on { background: #3b82f6; }
    .pill-thumb {
      position: absolute;
      top: 2px; left: 2px;
      width: 10px; height: 10px;
      border-radius: 50%;
      background: #fff;
      transition: transform 150ms ease;
      pointer-events: none;
    }
    .pill-toggle--on .pill-thumb { transform: translateX(14px); }

    /* ─── SLIDER ─── */
    .slider-block { display: flex; flex-direction: column; gap: 6px; }
    .slider-block--disabled { opacity: 0.35; pointer-events: none; }
    .slider-labels { display: flex; justify-content: space-between; }
    .slider-edge { font-size: 10px; color: #444; }

    .range-slider {
      -webkit-appearance: none;
      appearance: none;
      width: 100%;
      height: 3px;
      border-radius: 9999px;
      background: linear-gradient(
        to right,
        #3b82f6 var(--fill-pct, 0%),
        #2a2a2a var(--fill-pct, 0%)
      );
      outline: none;
      cursor: pointer;
      display: block;
    }
    .range-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 13px; height: 13px;
      border-radius: 50%;
      background: #3b82f6;
      border: none;
      cursor: pointer;
      transition: transform 150ms ease;
      position: relative;
      z-index: 1;
    }
    .range-slider::-webkit-slider-thumb:hover { transform: scale(1.2); }
    .range-slider::-moz-range-thumb {
      width: 13px; height: 13px;
      border-radius: 50%;
      background: #3b82f6;
      border: none;
      cursor: pointer;
    }
    .range-slider:disabled { opacity: 0.4; cursor: not-allowed; }

    .fan-readout { display: flex; flex-direction: column; gap: 1px; }
    .readout-big { font-size: 22px; font-weight: 500; color: #e0e0e0; line-height: 1.1; }
    .readout-sub { font-size: 10px; color: #555; }

    /* ─── APPLY BUTTON ─── */
    .apply-btn {
      width: 100%; height: 34px;
      background: #1a2a3a; border: 1px solid #2a4a6a;
      border-radius: 8px; color: #3b82f6;
      font-size: 12px; font-weight: 500;
      transition: background 150ms;
      display: flex; align-items: center; justify-content: center;
      margin-top: auto;
    }
    .apply-btn:hover:not(:disabled) { background: #1e3040; }
    .apply-btn:disabled { opacity: 0.35; cursor: not-allowed; }
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
