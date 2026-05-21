import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-monitor-strip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="monitor-strip">
      <!-- COLUMN 1: CPU PACKAGE POWER (PPT) -->
      <div class="monitor-seg font-sans">
        <div class="monitor-header">
          <span class="monitor-label">Package Power (PPT)</span>
          <span class="monitor-sub-info" *ngIf="metrics.slowTime > 0">Cooling Constant: {{ metrics.slowTime.toFixed(1) }}s</span>
        </div>
        
        <!-- FAST PPT SUBROW -->
        <div class="monitor-subrow">
          <div class="monitor-row">
            <span class="subrow-title">FAST PPT</span>
            <div class="monitor-metrics-display">
              <span class="monitor-peak" *ngIf="peakFast > 0" [style.color]="metricColor(peakFast, metrics.fastPptLimit)">↑ {{ peakFast }}W</span>
              <span class="monitor-value-main">{{ metrics.fastPpt.toFixed(1) }}W <span class="limit-val">/ {{ metrics.fastPptLimit }}W</span></span>
            </div>
          </div>
          <div class="monitor-bar-track">
            <div class="monitor-bar-fill"
              [style.width]="metricPct(metrics.fastPpt, metrics.fastPptLimit) + '%'"
              [style.background]="metricColor(metrics.fastPpt, metrics.fastPptLimit)">
            </div>
          </div>
        </div>

        <!-- SLOW PPT SUBROW -->
        <div class="monitor-subrow">
          <div class="monitor-row">
            <span class="subrow-title">SLOW PPT</span>
            <div class="monitor-metrics-display">
              <span class="monitor-peak" *ngIf="peakSlow > 0" [style.color]="metricColor(peakSlow, metrics.slowPptLimit)">↑ {{ peakSlow }}W</span>
              <span class="monitor-value-main">{{ metrics.slowPpt.toFixed(1) }}W <span class="limit-val">/ {{ metrics.slowPptLimit }}W</span></span>
            </div>
          </div>
          <div class="monitor-bar-track">
            <div class="monitor-bar-fill"
              [style.width]="metricPct(metrics.slowPpt, metrics.slowPptLimit) + '%'"
              [style.background]="metricColor(metrics.slowPpt, metrics.slowPptLimit)">
            </div>
          </div>
        </div>
      </div>

      <!-- COLUMN 2: SUSTAINED POWER (STAPM) -->
      <div class="monitor-seg font-sans">
        <div class="monitor-header">
          <span class="monitor-label">Sustained Power (STAPM)</span>
          <span class="monitor-sub-info" *ngIf="metrics.stapmTime > 0">Cooling Constant: {{ metrics.stapmTime.toFixed(1) }}s</span>
        </div>
        
        <div class="monitor-subrow-centered">
          <div class="monitor-row">
            <span class="subrow-title">STAPM VALUE</span>
            <div class="monitor-metrics-display">
              <span class="monitor-value-main">{{ metrics.stapm.toFixed(1) }}W <span class="limit-val">/ {{ metrics.stapmLimit }}W</span></span>
            </div>
          </div>
          <div class="monitor-bar-track">
            <div class="monitor-bar-fill"
              [style.width]="metricPct(metrics.stapm, metrics.stapmLimit) + '%'"
              [style.background]="metricColor(metrics.stapm, metrics.stapmLimit)">
            </div>
          </div>
        </div>
        
        <div class="monitor-bios-badge">BIOS-controlled sustained tracking</div>
      </div>

      <!-- COLUMN 3: THERMALS & SKIN SENSORS -->
      <div class="monitor-seg font-sans">
        <div class="monitor-header">
          <span class="monitor-label">Thermals & Skin Sensors</span>
        </div>

        <!-- CORE TEMP -->
        <div class="monitor-subrow-mini">
          <div class="monitor-row">
            <span class="subrow-title">CPU CORE</span>
            <div class="monitor-metrics-display">
              <span class="monitor-peak" *ngIf="peakTemp > 0" [style.color]="metricColor(peakTemp, metrics.tempLimit)">↑ {{ peakTemp }}°C</span>
              <span class="monitor-value-main">{{ metrics.temp.toFixed(1) }}°C <span class="limit-val">/ {{ metrics.tempLimit }}°C</span></span>
            </div>
          </div>
          <div class="monitor-bar-track">
            <div class="monitor-bar-fill"
              [style.width]="metricPct(metrics.temp, metrics.tempLimit) + '%'"
              [style.background]="metricColor(metrics.temp, metrics.tempLimit)">
            </div>
          </div>
        </div>

        <!-- APU SKIN TEMP -->
        <div class="monitor-subrow-mini">
          <div class="monitor-row">
            <span class="subrow-title">APU SKIN</span>
            <div class="monitor-metrics-display">
              <span class="monitor-value-main">{{ metrics.apuSkin.toFixed(1) }}°C <span class="limit-val">/ {{ metrics.apuSkinLimit }}°C</span></span>
            </div>
          </div>
          <div class="monitor-bar-track">
            <div class="monitor-bar-fill"
              [style.width]="metricPct(metrics.apuSkin, metrics.apuSkinLimit) + '%'"
              [style.background]="metricColor(metrics.apuSkin, metrics.apuSkinLimit)">
            </div>
          </div>
        </div>

        <!-- dGPU SKIN TEMP -->
        <div class="monitor-subrow-mini" *ngIf="metrics.dgpuSkin > 0">
          <div class="monitor-row">
            <span class="subrow-title">dGPU SKIN</span>
            <div class="monitor-metrics-display">
              <span class="monitor-value-main">{{ metrics.dgpuSkin.toFixed(1) }}°C <span class="limit-val">/ {{ metrics.dgpuSkinLimit }}°C</span></span>
            </div>
          </div>
          <div class="monitor-bar-track">
            <div class="monitor-bar-fill"
              [style.width]="metricPct(metrics.dgpuSkin, metrics.dgpuSkinLimit) + '%'"
              [style.background]="metricColor(metrics.dgpuSkin, metrics.dgpuSkinLimit)">
            </div>
          </div>
        </div>
      </div>

      <!-- RESET PEAKS -->
      <button class="peak-reset-btn" (click)="reset.emit()" title="Reset peak values">↺</button>
    </div>
  `,
  styles: [`
    /* ─── MONITOR STRIP ─── */
    .monitor-strip {
      display: flex;
      align-items: stretch;
      height: auto;
      min-height: auto;
      background: transparent;
      padding: 16px 59px 8px 16px;
      gap: 12px;
      flex-shrink: 0;
      user-select: none;
      position: relative;
    }
    .monitor-seg {
      display: flex;
      flex-direction: column;
      padding: 12px 18px;
      flex: 1;
      gap: 10px;
      background: #171717;
      border: 1px solid #242424;
      border-radius: 12px;
    }
    .monitor-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #222;
      padding-bottom: 6px;
    }
    .monitor-label { font-size: 10px; font-weight: 600; color: #555; text-transform: uppercase; letter-spacing: 0.06em; }
    .monitor-sub-info { font-size: 9px; color: #444; font-variant-numeric: tabular-nums; }
    .monitor-subrow { display: flex; flex-direction: column; gap: 4px; }
    .monitor-subrow-centered { display: flex; flex-direction: column; gap: 4px; margin-top: auto; margin-bottom: auto; }
    .monitor-subrow-mini { display: flex; flex-direction: column; gap: 3px; }
    .monitor-row { display: flex; align-items: center; justify-content: space-between; }
    .subrow-title { font-size: 9px; font-weight: 500; color: #555; letter-spacing: 0.05em; }
    .monitor-metrics-display { display: flex; align-items: center; gap: 8px; }
    .monitor-peak { font-size: 9px; font-weight: 600; font-variant-numeric: tabular-nums; }
    .monitor-value-main { font-size: 14px; font-weight: 500; color: #e0e0e0; font-variant-numeric: tabular-nums; }
    .limit-val { font-size: 10px; color: #444; font-weight: 400; }
    .monitor-bar-track { width: 100%; height: 3px; background: #2a2a2a; border-radius: 9999px; overflow: hidden; }
    .monitor-bar-fill { height: 100%; border-radius: 9999px; transition: width 600ms ease, background 300ms ease; }
    .monitor-bios-badge { font-size: 9px; color: #3a3a3a; font-style: italic; border-top: 1px solid #222; padding-top: 6px; }
    .peak-reset-btn {
      position: absolute;
      right: 70px;
      top: 50%;
      transform: translateY(-50%);
      background: #171717;
      border: 1px solid #242424;
      color: #777;
      font-size: 15px;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 150ms, background 150ms, border-color 150ms;
    }
    .peak-reset-btn:hover { color: #3b82f6; background: #1e1e1e; border-color: #333; }
  `]
})
export class MonitorStripComponent {
  @Input() metrics: any = {
    fastPpt: 0,
    fastPptLimit: 55,
    slowPpt: 0,
    slowPptLimit: 55,
    slowTime: 0,
    stapm: 0,
    stapmLimit: 45,
    stapmTime: 0,
    temp: 0,
    tempLimit: 90,
    apuSkin: 0,
    apuSkinLimit: 56,
    dgpuSkin: 0,
    dgpuSkinLimit: 37.5
  };
  @Input() peakFast: number = 0;
  @Input() peakSlow: number = 0;
  @Input() peakTemp: number = 0;
  @Output() reset = new EventEmitter<void>();

  metricPct(val: number, limit: number): number {
    if (!limit) return 0;
    return Math.min(Math.round((val / limit) * 100), 100);
  }

  metricColor(val: number, limit: number): string {
    const pct = this.metricPct(val, limit);
    if (pct < 70) return '#22c55e';
    if (pct < 90) return '#f59e0b';
    return '#ef4444';
  }
}
