import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cpu-power-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card">
      <h2 class="section-title">CPU Power Limit</h2>
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
      <button class="apply-btn" (click)="apply.emit()">Apply TDP</button>
    </div>
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
    .section-title { font-size: 13px; font-weight: 500; color: #bbb; }

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

    /* ─── SLIDER ─── */
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

    .tdp-section { display: flex; flex-direction: column; gap: 8px; }
    .tdp-display-row { display: flex; align-items: center; justify-content: space-between; }
    .tdp-mode-stack { display: flex; flex-direction: column; gap: 1px; }
    .tdp-mode-badge { font-size: 9px; font-weight: 600; color: #555; text-transform: uppercase; letter-spacing: 0.08em; }
    .tdp-mode-sub { font-size: 9px; color: #3a3a3a; font-style: italic; }
    .tdp-value { font-size: 26px; font-weight: 500; color: #e0e0e0; line-height: 1; }
    .tdp-range-labels { display: flex; justify-content: space-between; font-size: 9px; color: #444; }
  `]
})
export class CPUPowerPanelComponent {
  @Input() mode: string = 'bed';
  @Input() tdp: number = 35;
  @Output() tdpChange = new EventEmitter<number>();
  @Output() apply = new EventEmitter<void>();

  get tdpSliderFill(): string {
    return `${((this.tdp - 8) / 47) * 100}%`;
  }

  onTdpChange(val: number) {
    this.tdpChange.emit(val);
  }
}
