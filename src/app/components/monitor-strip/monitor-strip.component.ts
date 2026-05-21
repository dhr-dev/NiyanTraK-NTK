import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-monitor-strip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="monitor-strip">
      <!-- COLUMN 1: CPU PACKAGE POWER (UNIFIED PPT & STAPM) -->
      <div class="monitor-seg font-sans">
        <div class="monitor-header">
          <span class="monitor-label">CPU Package Power</span>
          <span class="monitor-sub-info">
            STAPM Const: {{ metrics.stapmTime.toFixed(1) }}s &middot; Slow Const: {{ metrics.slowTime.toFixed(1) }}s
          </span>
        </div>
        
        <div class="monitor-live-row">
          <div class="live-wattage-display">
            <span class="live-watt-val">{{ metrics.fastPpt.toFixed(1) }}W</span>
            <span class="live-watt-limit">/ {{ activeLimit }}W</span>
            <span class="monitor-peak" *ngIf="peakPower > 0" [style.color]="metricColor(peakPower, activeLimit)">
              ↑ {{ peakPower }}W Peak
            </span>
          </div>
          <span class="scheme-badge" [class]="'scheme-badge--' + activeScheme.replace(' ', '-').toLowerCase()">
            ⚡ {{ activeScheme }}
          </span>
        </div>

        <div class="monitor-bar-track-unified">
          <div class="monitor-bar-fill"
            [style.width]="metricPct(metrics.fastPpt, activeLimit) + '%'"
            [style.background]="metricColor(metrics.fastPpt, activeLimit)">
          </div>
        </div>

        <!-- Limits Grid showing all thresholds and highlighting the active one -->
        <div class="limits-grid">
          <div class="limit-grid-item" [class.limit-grid-item--active]="activeScheme === 'FAST PPT'">
            <span class="limit-dot dot-fast"></span>
            <span class="limit-lbl">Fast PPT Limit:</span>
            <span class="limit-val-new">{{ metrics.fastPptLimit }}W</span>
          </div>
          <div class="limit-grid-item" [class.limit-grid-item--active]="activeScheme === 'SLOW PPT'">
            <span class="limit-dot dot-slow"></span>
            <span class="limit-lbl">Slow PPT Limit:</span>
            <span class="limit-val-new">{{ metrics.slowPptLimit }}W</span>
          </div>
          <div class="limit-grid-item" [class.limit-grid-item--active]="activeScheme === 'STAPM'">
            <span class="limit-dot dot-stapm"></span>
            <span class="limit-lbl">STAPM Limit:</span>
            <span class="limit-val-new">{{ metrics.stapmLimit }}W</span>
          </div>
        </div>
      </div>

      <!-- COLUMN 2: THERMALS & SKIN SENSORS -->
      <div class="monitor-seg font-sans">
        <div class="monitor-header">
          <span class="monitor-label">Thermals & Skin Sensors</span>
        </div>

        <!-- CORE TEMP -->
        <div class="monitor-subrow-mini">
          <div class="monitor-row">
            <span class="subrow-title">CPU CORE</span>
            <div class="monitor-metrics-display">
              <span class="monitor-value-main">{{ metrics.temp.toFixed(1) }}°C <span class="limit-val">/ {{ metrics.tempLimit }}°C</span></span>
              <span class="monitor-peak" *ngIf="peakTemp > 0" [style.color]="metricColor(peakTemp, metrics.tempLimit)">↑ {{ peakTemp }}°C Peak</span>
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
            <span class="subrow-title dgpu-header">
              dGPU SKIN
              <span class="brand-badge badge-nvidia" *ngIf="dgpuBrand === 'NVIDIA'">NVIDIA</span>
              <span class="brand-badge badge-amd" *ngIf="dgpuBrand === 'AMD'">RADEON</span>
            </span>
            <div class="monitor-metrics-display">
              <span class="monitor-value-main">{{ metrics.dgpuSkin.toFixed(1) }}°C <span class="limit-val">/ {{ metrics.dgpuSkinLimit }}°C</span></span>
            </div>
          </div>
          <div class="monitor-bar-track">
            <div class="monitor-bar-fill"
              [style.width]="dgpuPct(metrics.dgpuSkin) + '%'"
              [style.background]="dgpuColor(metrics.dgpuSkin)">
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
    .monitor-label { font-size: 11.5px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 0.06em; }
    .monitor-sub-info { font-size: 11px; color: #888; font-weight: 500; font-variant-numeric: tabular-nums; }
    .monitor-subrow-mini { display: flex; flex-direction: column; gap: 3px; }
    .monitor-row { display: flex; align-items: center; justify-content: space-between; }
    .subrow-title { font-size: 11px; font-weight: 500; color: #888; letter-spacing: 0.05em; }
    
    /* Unified Layout elements */
    .monitor-live-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 2px;
    }
    .live-wattage-display {
      display: flex;
      align-items: baseline;
      gap: 6px;
    }
    .live-watt-val {
      font-size: 18px;
      font-weight: 600;
      color: #fff;
      font-variant-numeric: tabular-nums;
    }
    .live-watt-limit {
      font-size: 11px;
      color: #888;
    }
    .monitor-peak { 
      font-size: 10px; 
      font-weight: 600; 
      font-variant-numeric: tabular-nums; 
      margin-left: 12px; 
    }
    
    /* Scheme Badging */
    .scheme-badge {
      font-size: 9px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      letter-spacing: 0.05em;
      border: 1px solid transparent;
      text-transform: uppercase;
    }
    .scheme-badge--fast-ppt {
      background: rgba(34, 197, 94, 0.1);
      border-color: rgba(34, 197, 94, 0.2);
      color: #22c55e;
    }
    .scheme-badge--slow-ppt {
      background: rgba(245, 158, 11, 0.1);
      border-color: rgba(245, 158, 11, 0.2);
      color: #f59e0b;
    }
    .scheme-badge--stapm {
      background: rgba(239, 68, 68, 0.1);
      border-color: rgba(239, 68, 68, 0.2);
      color: #ef4444;
    }
 
    .monitor-bar-track-unified { width: 100%; height: 5px; background: #222; border-radius: 9999px; overflow: hidden; margin: 4px 0; }
    .monitor-bar-track { width: 100%; height: 3px; background: #2a2a2a; border-radius: 9999px; overflow: hidden; }
    .monitor-bar-fill { height: 100%; border-radius: 9999px; transition: width 600ms ease, background 300ms ease; }
    .monitor-value-main { font-size: 14px; font-weight: 500; color: #e0e0e0; font-variant-numeric: tabular-nums; }
    .monitor-metrics-display { display: flex; align-items: center; gap: 8px; }
    .limit-val { font-size: 12px; color: #aaa; font-weight: 400; }
 
    /* Limits Grid styling */
    .limits-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
      border-top: 1px solid #222;
      padding-top: 8px;
      margin-top: 4px;
    }
    .limit-grid-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 5px 8px;
      background: #1a1a1a;
      border: 1px solid #222;
      border-radius: 6px;
      font-size: 11px;
      color: #999;
      transition: all 250ms ease;
    }
    .limit-grid-item--active {
      background: #141e2a;
      border-color: #3b82f6;
      color: #a3cfff;
      box-shadow: 0 0 6px rgba(59, 130, 246, 0.15);
    }
    .limit-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .dot-fast { background: #22c55e; }
    .dot-slow { background: #f59e0b; }
    .dot-stapm { background: #ef4444; }
    .limit-lbl { font-weight: 500; }
    .limit-val-new { font-weight: 600; font-variant-numeric: tabular-nums; margin-left: auto; }

    /* dGPU brand badging */
    .dgpu-header {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .brand-badge {
      font-size: 8px;
      font-weight: 700;
      padding: 1px 4px;
      border-radius: 4px;
      border: 1px solid transparent;
      letter-spacing: 0.05em;
    }
    .badge-nvidia {
      background: rgba(34, 197, 94, 0.1);
      border-color: rgba(34, 197, 94, 0.25);
      color: #22c55e;
    }
    .badge-amd {
      background: rgba(239, 68, 68, 0.1);
      border-color: rgba(239, 68, 68, 0.25);
      color: #ef4444;
    }

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
  @Input() dgpuBrand: string = 'UNKNOWN';
  @Output() reset = new EventEmitter<void>();

  get peakPower(): number {
    return Math.max(this.peakFast, this.peakSlow);
  }

  get activeScheme(): 'FAST PPT' | 'SLOW PPT' | 'STAPM' {
    const fast = this.metrics.fastPpt;
    const slow = this.metrics.slowPpt;
    const slowLimit = this.metrics.slowPptLimit;
    const stapmLimit = this.metrics.stapmLimit;
    
    if (fast > slowLimit + 1.5) {
      return 'FAST PPT';
    }
    if (stapmLimit > 0 && slowLimit > stapmLimit && slow > stapmLimit + 0.5) {
      return 'SLOW PPT';
    }
    if (stapmLimit > 0 && stapmLimit < slowLimit) {
      return 'STAPM';
    }
    return 'SLOW PPT';
  }

  get activeLimit(): number {
    const scheme = this.activeScheme;
    if (scheme === 'FAST PPT') return this.metrics.fastPptLimit;
    if (scheme === 'SLOW PPT') return this.metrics.slowPptLimit;
    return this.metrics.stapmLimit;
  }

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

  dgpuPct(val: number): number {
    return Math.min(Math.round((val / 65) * 100), 100);
  }

  dgpuColor(val: number): string {
    if (val < 48) return '#22c55e'; // safe green
    if (val < 58) return '#f59e0b'; // amber
    return '#ef4444'; // red
  }
}
