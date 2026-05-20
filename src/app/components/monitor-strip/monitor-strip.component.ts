import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-monitor-strip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="monitor-strip">
      <!-- FAST PPT -->
      <div class="monitor-seg">
        <div class="monitor-row">
          <span class="monitor-label">FAST PPT</span>
          <span class="monitor-peak"
            *ngIf="peakFast > 0"
            [style.color]="metricColor(peakFast, metrics.fastPptLimit)"
          >↑ {{ peakFast }}W</span>
        </div>
        <div class="monitor-value">{{ metrics.fastPpt }}W</div>
        <div class="monitor-bar-track">
          <div class="monitor-bar-fill"
            [style.width]="metricPct(metrics.fastPpt, metrics.fastPptLimit) + '%'"
            [style.background]="metricColor(metrics.fastPpt, metrics.fastPptLimit)">
          </div>
        </div>
      </div>
      <div class="monitor-divider"></div>
      
      <!-- SLOW PPT -->
      <div class="monitor-seg">
        <div class="monitor-row">
          <span class="monitor-label">SLOW PPT</span>
          <span class="monitor-peak"
            *ngIf="peakSlow > 0"
            [style.color]="metricColor(peakSlow, metrics.slowPptLimit)"
          >↑ {{ peakSlow }}W</span>
        </div>
        <div class="monitor-value">{{ metrics.slowPpt }}W</div>
        <div class="monitor-bar-track">
          <div class="monitor-bar-fill"
            [style.width]="metricPct(metrics.slowPpt, metrics.slowPptLimit) + '%'"
            [style.background]="metricColor(metrics.slowPpt, metrics.slowPptLimit)">
          </div>
        </div>
      </div>
      <div class="monitor-divider"></div>
      
      <!-- TEMP -->
      <div class="monitor-seg">
        <div class="monitor-row">
          <span class="monitor-label">TEMP</span>
          <span class="monitor-peak"
            *ngIf="peakTemp > 0"
            [style.color]="metricColor(peakTemp, metrics.tempLimit)"
          >↑ {{ peakTemp }}°C</span>
        </div>
        <div class="monitor-value">{{ metrics.temp }}°C</div>
        <div class="monitor-bar-track">
          <div class="monitor-bar-fill"
            [style.width]="metricPct(metrics.temp, metrics.tempLimit) + '%'"
            [style.background]="metricColor(metrics.temp, metrics.tempLimit)">
          </div>
        </div>
      </div>
      <div class="monitor-divider"></div>
      
      <!-- STAPM -->
      <div class="monitor-seg">
        <div class="monitor-row">
          <span class="monitor-label">STAPM</span>
          <span class="monitor-bios">(BIOS)</span>
        </div>
        <div class="monitor-value">{{ metrics.stapm }}W</div>
        <div class="monitor-bios-sub">BIOS-ctrl</div>
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
      justify-content: center;
      padding: 10px 18px;
      flex: 1;
      gap: 3px;
      background: #171717;
      border: 1px solid #242424;
      border-radius: 12px;
    }
    .monitor-seg:not(:last-child) { border-right: none; }
    .monitor-row { display: flex; align-items: center; justify-content: space-between; }
    .monitor-label { font-size: 10px; font-weight: 500; color: #555; text-transform: uppercase; letter-spacing: 0.06em; }
    .monitor-peak { font-size: 11px; font-weight: 600; font-variant-numeric: tabular-nums; }
    .monitor-value { font-size: 16px; font-weight: 500; color: #e0e0e0; line-height: 1; }
    .monitor-bar-track { width: 80px; height: 4px; background: #2a2a2a; border-radius: 9999px; overflow: hidden; }
    .monitor-bar-fill { height: 100%; border-radius: 9999px; transition: width 600ms ease, background 300ms ease; }
    .monitor-bios { font-size: 9px; color: #3a3a3a; }
    .monitor-bios-sub { font-size: 9px; color: #383838; font-style: italic; }
    .monitor-divider { display: none; }
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
    temp: 0,
    tempLimit: 90,
    stapm: 0
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
