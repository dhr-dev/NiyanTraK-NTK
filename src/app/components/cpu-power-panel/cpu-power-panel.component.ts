import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cpu-power-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card">
      <h2 class="section-title">CPU Power & Thermal Limits</h2>
      <div class="tdp-section">
        <div class="tdp-display-row">
          <div class="tdp-mode-stack">
            <span class="tdp-mode-badge">{{ mode === 'bed' ? 'BED' : mode.toUpperCase() }}</span>
            <span class="tdp-mode-sub">Active Mode</span>
          </div>
          <span class="tdp-value">{{ tdp }}W</span>
        </div>
        <input type="range" class="range-slider" id="tdp-slider"
          min="8" max="55" step="1"
          [(ngModel)]="tdp"
          (ngModelChange)="onTdpChange($event)"
          [ngStyle]="{'--fill-pct': tdpSliderFill}"/>
        <div class="tdp-range-labels">
          <span>8W</span><span>55W</span>
        </div>
      </div>

      <div class="tdp-section" style="margin-top: 8px;">
        <div class="tdp-display-row">
          <div class="tdp-mode-stack">
            <span class="tdp-mode-badge">TEMP TARGET</span>
            <span class="tdp-mode-sub">Thermal Throttle</span>
          </div>
          <span class="tdp-value">{{ tempLimit }}°C</span>
        </div>
        <input type="range" class="range-slider" id="temp-slider"
          min="50" max="95" step="1"
          [(ngModel)]="tempLimit"
          (ngModelChange)="onTempLimitChange($event)"
          [ngStyle]="{'--fill-pct': tempSliderFill}"/>
        <div class="tdp-range-labels">
          <span>50°C</span><span>95°C</span>
        </div>
      </div>

      <button class="apply-btn" (click)="apply.emit()">Apply Limits</button>
    </div>
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
    .section-title { font-size: 13px; font-weight: 600; color: #fff; letter-spacing: 0.02em; }

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

    /* ─── SLIDER ─── */
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

    .tdp-section { display: flex; flex-direction: column; gap: 8px; }
    .tdp-display-row { display: flex; align-items: center; justify-content: space-between; }
    .tdp-mode-stack { display: flex; flex-direction: column; gap: 1px; }
    .tdp-mode-badge { font-size: 12.5px; font-weight: 700; color: #3b82f6; background: rgba(59, 130, 246, 0.1); padding: 2px 6px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.08em; display: inline-block; width: fit-content; }
    .tdp-mode-sub { font-size: 12px; color: #aaa; font-style: italic; }
    .tdp-value { font-size: 26px; font-weight: 600; color: #fff; line-height: 1; text-shadow: 0 0 12px rgba(59, 130, 246, 0.25); }
    .tdp-range-labels { display: flex; justify-content: space-between; font-size: 12px; color: #bbb; }
  `]
})
export class CPUPowerPanelComponent {
  @Input() mode: string = 'bed';
  @Input() tdp: number = 35;
  @Input() tempLimit: number = 90;
  @Output() tdpChange = new EventEmitter<number>();
  @Output() tempLimitChange = new EventEmitter<number>();
  @Output() apply = new EventEmitter<void>();

  get tdpSliderFill(): string {
    return `${((this.tdp - 8) / 47) * 100}%`;
  }

  get tempSliderFill(): string {
    return `${((this.tempLimit - 50) / 45) * 100}%`;
  }

  onTdpChange(val: number) {
    this.tdpChange.emit(val);
  }

  onTempLimitChange(val: number) {
    this.tempLimitChange.emit(val);
  }
}
