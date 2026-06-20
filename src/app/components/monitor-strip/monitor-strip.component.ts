import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ShowLineConfig {
  fastPpt: boolean;
  slowPpt: boolean;
  stapm: boolean;
  temp: boolean;
  apuSkin: boolean;
  dgpuSkin: boolean;
  fan: boolean;
}

@Component({
  selector: 'app-monitor-strip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="monitor-strip" [class.monitor-strip--compact]="compactMode" [class.monitor-strip--non-sticky]="!isSticky">
      <!-- NORMAL MODE LAYOUT -->
      <ng-container *ngIf="!compactMode">
        <!-- TOP ROW: CPU PACKAGE POWER (100% width) -->
        <div class="monitor-row-top">
          <div class="monitor-seg monitor-seg--full font-sans" style="padding-bottom:22px;">
            <div class="monitor-header">
              <span class="monitor-label">CPU Package Power</span>
              <div class="time-controls">
                <button class="pill-btn" [class.active]="timeWindow === '60s'" (click)="selectTimeWindow('60s')">60s</button>
                <button class="pill-btn" [class.active]="timeWindow === '2min'" (click)="selectTimeWindow('2min')">2min</button>
                <div class="time-pill-custom" [class.active]="timeWindow === 'custom'">
                  <button class="arrow-btn" (click)="adjustCustomMin(-1, $event)">&lt;</button>
                  <span class="custom-lbl" (click)="selectCustomWindow()">{{ customMin }}m</span>
                  <button class="arrow-btn" (click)="adjustCustomMin(1, $event)">&gt;</button>
                </div>
              </div>
            </div>
            
            <div class="monitor-inline-row">
              <!-- Left: Wattage numbers column -->
              <div class="live-wattage-col">
                <div class="live-watt-row" style="display: flex; align-items: baseline; gap: 4px;">
                  <span class="live-watt-val" style="font-variant-numeric: tabular-nums;">{{ metrics.fastPpt.toFixed(1) }}W</span>
                  <span class="live-watt-limit" style="font-size: 11px; color: #888;">/ {{ activeLimit }}W</span>
                </div>
                <div class="live-meta-row" style="display: flex; align-items: center; gap: 6px; margin-top: 1px;">
                  <span class="scheme-badge" [class]="'scheme-badge--' + activeScheme.replace(' ', '-').toLowerCase()" style="font-size: 8px; padding: 2px 5px; font-weight: 700; border-radius: 4px; border: 1px solid transparent; text-transform: uppercase; letter-spacing: 0.05em;">
                    ⚡ {{ activeScheme }}
                  </span>
                  <span class="monitor-peak" *ngIf="peakPower > 0" [style.color]="metricColor(peakPower, activeLimit)" style="margin-left: 0; font-size: 9px; font-weight: 600;">
                    ↑ {{ peakPower }}W
                  </span>
                </div>
                <div class="monitor-constants-row" style="display: flex; gap: 8px; font-size: 9px; color: #555; margin-top: 2px; font-weight: 500;">
                  <span>STAPM: {{ metrics.stapmTime.toFixed(0) }}s</span>
                  <span>Slow: {{ metrics.slowTime.toFixed(0) }}s</span>
                </div>
              </div>

              <!-- Middle: SVG graph -->
              <div class="graph-wrap graph-wrap--inline" style="">
                <div class="graph-tick-labels" aria-hidden="true">
                  <span *ngFor="let t of powerTickData" class="gtick-lbl" [style.top.%]="(t.y / 60) * 100">{{ t.label }}</span>
                </div>
                <div class="graph-container graph-container--inline">
                  <!-- Absolute HTML Axis Labels Overlay -->
                  <div class="graph-y-axis graph-y-axis-cpu" [style.opacity]="(showLine.fastPpt || showLine.slowPpt || showLine.stapm) ? 1 : 0.5">
                    <span class="axis-val">{{ powerMaxLabel }}</span>
                    <span class="axis-val">{{ powerMidLabel }}</span>
                    <span class="axis-val">0W</span>
                  </div>

                  <svg class="monitor-graph" viewBox="0 0 300 60" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="powerGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#22c55e" stop-opacity="0.18"></stop>
                        <stop offset="100%" stop-color="#22c55e" stop-opacity="0"></stop>
                      </linearGradient>
                    </defs>
                    <!-- Y-axis tick marks every 10W -->
                    <line *ngFor="let t of powerTickData" x1="0" [attr.y1]="t.y" x2="6" [attr.y2]="t.y" class="y-tick-line" />
                    <line *ngFor="let t of powerTickData" x1="294" [attr.y1]="t.y" x2="300" [attr.y2]="t.y" class="y-tick-line" />
                    <!-- Limits Grid Lines -->
                    <line *ngIf="showLine.fastPpt" x1="0" [attr.y1]="getPowerY(metrics.fastPptLimit)" x2="300" [attr.y2]="getPowerY(metrics.fastPptLimit)" class="limit-line limit-line-fast" />
                    <line *ngIf="showLine.slowPpt" x1="0" [attr.y1]="getPowerY(metrics.slowPptLimit)" x2="300" [attr.y2]="getPowerY(metrics.slowPptLimit)" class="limit-line limit-line-slow" />
                    <line *ngIf="showLine.stapm" x1="0" [attr.y1]="getPowerY(metrics.stapmLimit)" x2="300" [attr.y2]="getPowerY(metrics.stapmLimit)" class="limit-line limit-line-temp" style="opacity: 0.15;" />
                    
                    <!-- Area & Line Paths -->
                    <path *ngIf="showLine.fastPpt" [attr.d]="fastAreaPath" fill="url(#powerGrad)"></path>
                    <path *ngIf="showLine.fastPpt" [attr.d]="fastLinePath" stroke="#22c55e" stroke-width="1.5" fill="none" stroke-linecap="round"></path>
                  </svg>
                </div>
                <div class="graph-tick-labels graph-tick-labels--right" aria-hidden="true">
                  <span *ngFor="let t of powerTickData" class="gtick-lbl gtick-lbl--right" [style.top.%]="(t.y / 60) * 100">{{ t.label }}</span>
                </div>
              </div>

              <!-- Right: Limits stacked in 1 column -->
              <div class="limits-col">
                <div class="limit-grid-item-inline" [class.limit-grid-item-inline--active]="activeScheme === 'FAST PPT'" (click)="toggleLine('fastPpt')" title="Toggle limit line" [style.opacity]="showLine.fastPpt ? 1 : 0.65">
                  <span class="limit-dot dot-fast" [class.dot--hidden]="!showLine.fastPpt"></span>
                  <span class="limit-lbl">Fast:</span>
                  <span class="limit-val-new">{{ metrics.fastPptLimit }}W</span>
                </div>
                <div class="limit-grid-item-inline" [class.limit-grid-item-inline--active]="activeScheme === 'SLOW PPT'" (click)="toggleLine('slowPpt')" title="Toggle limit line" [style.opacity]="showLine.slowPpt ? 1 : 0.65">
                  <span class="limit-dot dot-slow" [class.dot--hidden]="!showLine.slowPpt"></span>
                  <span class="limit-lbl">Slow:</span>
                  <span class="limit-val-new">{{ metrics.slowPptLimit }}W</span>
                </div>
                <div class="limit-grid-item-inline" [class.limit-grid-item-inline--active]="activeScheme === 'STAPM'" (click)="toggleLine('stapm')" style="margin-bottom: 0;" title="Toggle limit line" [style.opacity]="showLine.stapm ? 1 : 0.65">
                  <span class="limit-dot dot-stapm" [class.dot--hidden]="!showLine.stapm"></span>
                  <span class="limit-lbl">STAPM:</span>
                  <span class="limit-val-new">{{ metrics.stapmLimit }}W</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- BOTTOM ROW: THERMALS & FANS (50/50 split) -->
        <div class="monitor-row-bottom">
          <!-- COLUMN 2: THERMALS -->
          <div class="monitor-seg monitor-seg--half font-sans">
            <div class="monitor-header">
              <span class="monitor-label">Thermals</span>
              <div class="time-controls">
                <button class="pill-btn" [class.active]="timeWindow === '60s'" (click)="selectTimeWindow('60s')">60s</button>
                <button class="pill-btn" [class.active]="timeWindow === '2min'" (click)="selectTimeWindow('2min')">2min</button>
                <div class="time-pill-custom" [class.active]="timeWindow === 'custom'">
                  <button class="arrow-btn" (click)="adjustCustomMin(-1, $event)">&lt;</button>
                  <span class="custom-lbl" (click)="selectCustomWindow()">{{ customMin }}m</span>
                  <button class="arrow-btn" (click)="adjustCustomMin(1, $event)">&gt;</button>
                </div>
              </div>
            </div>

            <!-- Inline telemetry values -->
            <div class="telemetry-inline-row">
              
             <div class="telemetry-item" *ngIf="metrics.dgpuSkin > 0" (click)="toggleLine('dgpuSkin')" title="Toggle graph line" [style.opacity]="showLine.dgpuSkin ? 1 : 0.65">
                <span class="limit-dot" style="background:#06b6d4; width:5px; height:5px;" [class.dot--hidden]="!showLine.dgpuSkin"></span>
                <span class="lbl">dGPU:</span>
                <span class="val">{{ metrics.dgpuSkin.toFixed(1) }}°C</span>
              </div>
              <span class="telemetry-divider" *ngIf="metrics.dgpuSkin > 0">|</span>
              <div class="telemetry-item" (click)="toggleLine('temp')" title="Toggle graph line" [style.opacity]="showLine.temp ? 1 : 0.65">
                <span class="limit-dot" style="background:#ef4444; width:5px; height:5px;" [class.dot--hidden]="!showLine.temp"></span>
                <span class="lbl">CORE:</span>
                <span class="val">{{ metrics.temp.toFixed(1) }}°C</span>
                <span class="limit-val" style="font-size: 11px; color: #888; margin-left: 2px;">/{{ metrics.tempLimit }}°C</span>
                <span class="monitor-peak" *ngIf="peakTemp > 0" [style.color]="metricColor(peakTemp, metrics.tempLimit)" style="font-size: 11px; font-weight: 600; margin-left: 4px;">↑{{ peakTemp }}°C</span>
              </div>
              <span class="telemetry-divider">|</span>
              

               <div class="telemetry-item" (click)="toggleLine('apuSkin')" title="Toggle graph line" [style.opacity]="showLine.apuSkin ? 1 : 0.65">
                <span class="limit-dot" style="background:#a855f7; width:5px; height:5px;" [class.dot--hidden]="!showLine.apuSkin"></span>
                <span class="lbl">APU:</span>
                <span class="val">{{ metrics.apuSkin.toFixed(1) }}°C</span>
              </div>
            </div>

            <!-- Real-time SVG Temperature Graph -->
            <div class="graph-wrap">
              <div class="graph-tick-labels" aria-hidden="true">
                <span *ngFor="let t of tempTickData" class="gtick-lbl" [style.top.%]="(t.y / 60) * 100">{{ t.label }}</span>
              </div>
              <div class="graph-container">
                <!-- Absolute HTML Axis Labels Overlay -->
                <div class="graph-y-axis" [style.opacity]="(showLine.temp || showLine.apuSkin || showLine.dgpuSkin) ? 1 : 0.5">
                  <span class="axis-val">{{ tempMaxLabel }}</span>
                  <span class="axis-val">{{ tempMidLabel }}</span>
                  <span class="axis-val">30°C</span>
                </div>

                <svg class="monitor-graph" viewBox="0 0 300 60" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="coreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="#ef4444" stop-opacity="0.18"></stop>
                      <stop offset="100%" stop-color="#ef4444" stop-opacity="0"></stop>
                    </linearGradient>
                  </defs>
                  <!-- Y-axis tick marks every 10°C -->
                  <line *ngFor="let t of tempTickData" x1="0" [attr.y1]="t.y" x2="6" [attr.y2]="t.y" class="y-tick-line" />
                  <line *ngFor="let t of tempTickData" x1="294" [attr.y1]="t.y" x2="300" [attr.y2]="t.y" class="y-tick-line" />
                  <!-- Core Target Throttle Limit Grid Line -->
                  <line x1="0" [attr.y1]="getTempY(metrics.tempLimit)" x2="300" [attr.y2]="getTempY(metrics.tempLimit)" class="limit-line limit-line-temp" />
                  
                  <!-- Area & Line Paths -->
                  <path *ngIf="showLine.temp" [attr.d]="coreAreaPath" fill="url(#coreGrad)"></path>
                  <path *ngIf="showLine.temp" [attr.d]="coreLinePath" stroke="#ef4444" stroke-width="1.5" fill="none" stroke-linecap="round"></path>
                  <path *ngIf="showLine.apuSkin" [attr.d]="apuLinePath" stroke="#a855f7" stroke-width="1.2" fill="none" stroke-linecap="round" style="opacity: 0.85;"></path>
                  <path *ngIf="metrics.dgpuSkin > 0 && showLine.dgpuSkin" [attr.d]="dgpuLinePath" stroke="#06b6d4" stroke-width="1.2" fill="none" stroke-linecap="round" style="opacity: 0.85;"></path>
                </svg>
              </div>
              <div class="graph-tick-labels graph-tick-labels--right" aria-hidden="true">
                <span *ngFor="let t of tempTickData" class="gtick-lbl gtick-lbl--right" [style.top.%]="(t.y / 60) * 100">{{ t.label }}</span>
              </div>
            </div>
          </div>

          <!-- COLUMN 3: ACTIVE FAN SPEED -->
          <div class="monitor-seg monitor-seg--half font-sans">
            <div class="monitor-header">
              <span class="monitor-label">Active Fan Speed</span>
              <div class="time-controls">
                <button class="pill-btn" [class.active]="timeWindow === '60s'" (click)="selectTimeWindow('60s')">60s</button>
                <button class="pill-btn" [class.active]="timeWindow === '2min'" (click)="selectTimeWindow('2min')">2min</button>
                <div class="time-pill-custom" [class.active]="timeWindow === 'custom'">
                  <button class="arrow-btn" (click)="adjustCustomMin(-1, $event)">&lt;</button>
                  <span class="custom-lbl" (click)="selectCustomWindow()">{{ customMin }}m</span>
                  <button class="arrow-btn" (click)="adjustCustomMin(1, $event)">&gt;</button>
                </div>
              </div>
            </div>

            <!-- Inline telemetry values -->
            <div class="telemetry-inline-row">
              <div class="telemetry-item" (click)="toggleLine('fan')" title="Toggle graph line" [style.opacity]="showLine.fan ? 1 : 0.65">
                <span class="limit-dot" style="background:#3b82f6; width:5px; height:5px;" [class.dot--hidden]="!showLine.fan"></span>
                <span class="lbl">ACTIVE FAN:</span>
                <span class="val">{{ metrics.activeFanLevel === 0 ? 'Auto (HP)' : getRpm(metrics.activeFanLevel) + ' RPM' }}</span>
                <span class="limit-val" style="font-size: 11px; color: #888; margin-left: 2px;">/L{{ metrics.activeFanLevel }}</span>
              </div>
            </div>

            <!-- Real-time SVG Fan Speed Graph -->
            <div class="graph-wrap">
              <div class="graph-tick-labels" aria-hidden="true">
                <span *ngFor="let t of fanRpmTickData" class="gtick-lbl" [style.top.%]="(t.y / 60) * 100">{{ t.label }}</span>
              </div>
              <div class="graph-container">
                <!-- Absolute HTML Axis Labels Overlay -->
                <div class="graph-y-axis" [style.opacity]="showLine.fan ? 1 : 0.5">
                  <span class="axis-val">5700</span>
                  <span class="axis-val">3200</span>
                  <span class="axis-val">0 RPM</span>
                </div>

                <svg class="monitor-graph" viewBox="0 0 300 60" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="fanGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.18"></stop>
                      <stop offset="100%" stop-color="#3b82f6" stop-opacity="0"></stop>
                    </linearGradient>
                  </defs>
                  <!-- Y-axis tick marks every 1000 RPM -->
                  <line *ngFor="let t of fanRpmTickData" x1="0" [attr.y1]="t.y" x2="6" [attr.y2]="t.y" class="y-tick-line" />
                  <line *ngFor="let t of fanRpmTickData" x1="294" [attr.y1]="t.y" x2="300" [attr.y2]="t.y" class="y-tick-line" />
                  <path *ngIf="showLine.fan" [attr.d]="fanAreaPath" fill="url(#fanGrad)"></path>
                  <path *ngIf="showLine.fan" [attr.d]="fanLinePath" stroke="#3b82f6" stroke-width="1.5" fill="none" stroke-linecap="round"></path>
                </svg>
              </div>
              <div class="graph-tick-labels graph-tick-labels--right" aria-hidden="true">
                <span *ngFor="let t of fanRpmTickData" class="gtick-lbl gtick-lbl--right" [style.top.%]="(t.y / 60) * 100">{{ t.label }}</span>
              </div>
            </div>
          </div>
        </div>

      </ng-container>

      <!-- COMPACT MODE LAYOUT (For fancurve page) -->
      <div class="monitor-compact-row" *ngIf="compactMode">
        <!-- CPU Package Power -->
        <div class="monitor-compact-seg">
          <div class="monitor-compact-title-row">
            <span class="monitor-compact-lbl">CPU Power</span>
          </div>
          <div class="graph-container graph-container--compact">
            <div class="graph-y-axis" [style.opacity]="(showLine.fastPpt || showLine.slowPpt || showLine.stapm) ? 1 : 0.5">
              <span class="axis-val">{{ powerMaxLabel }}</span>
              <span class="axis-val">{{ powerMidLabel }}</span>
              <span class="axis-val">0W</span>
            </div>
            <svg class="monitor-graph" viewBox="0 0 300 60" preserveAspectRatio="none">
              <defs>
                <linearGradient id="powerGradCompact" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#22c55e" stop-opacity="0.18"></stop>
                  <stop offset="100%" stop-color="#22c55e" stop-opacity="0"></stop>
                </linearGradient>
              </defs>
              <line *ngIf="showLine.fastPpt" x1="0" [attr.y1]="getPowerY(metrics.fastPptLimit)" x2="300" [attr.y2]="getPowerY(metrics.fastPptLimit)" class="limit-line limit-line-fast" />
              <line *ngIf="showLine.slowPpt" x1="0" [attr.y1]="getPowerY(metrics.slowPptLimit)" x2="300" [attr.y2]="getPowerY(metrics.slowPptLimit)" class="limit-line limit-line-slow" />
              <line *ngIf="showLine.stapm" x1="0" [attr.y1]="getPowerY(metrics.stapmLimit)" x2="300" [attr.y2]="getPowerY(metrics.stapmLimit)" class="limit-line limit-line-temp" style="opacity: 0.15;" />
              <path *ngIf="showLine.fastPpt" [attr.d]="fastAreaPath" fill="url(#powerGradCompact)"></path>
              <path *ngIf="showLine.fastPpt" [attr.d]="fastLinePath" stroke="#22c55e" stroke-width="1.5" fill="none" stroke-linecap="round"></path>
            </svg>
          </div>
        </div>

        <!-- Thermals -->
        <div class="monitor-compact-seg">
          <div class="monitor-compact-title-row">
            <span class="monitor-compact-lbl">Thermals</span>
          </div>
          <div class="graph-container graph-container--compact">
            <div class="graph-y-axis" [style.opacity]="(showLine.temp || showLine.apuSkin || showLine.dgpuSkin) ? 1 : 0.5">
              <span class="axis-val">{{ tempMaxLabel }}</span>
              <span class="axis-val">{{ tempMidLabel }}</span>
              <span class="axis-val">30°C</span>
            </div>
            <svg class="monitor-graph" viewBox="0 0 300 60" preserveAspectRatio="none">
              <defs>
                <linearGradient id="coreGradCompact" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#ef4444" stop-opacity="0.18"></stop>
                  <stop offset="100%" stop-color="#ef4444" stop-opacity="0"></stop>
                </linearGradient>
              </defs>
              <line x1="0" [attr.y1]="getTempY(metrics.tempLimit)" x2="300" [attr.y2]="getTempY(metrics.tempLimit)" class="limit-line limit-line-temp" />
              <path *ngIf="showLine.temp" [attr.d]="coreAreaPath" fill="url(#coreGradCompact)"></path>
              <path *ngIf="showLine.temp" [attr.d]="coreLinePath" stroke="#ef4444" stroke-width="1.5" fill="none" stroke-linecap="round"></path>
              <path *ngIf="showLine.apuSkin" [attr.d]="apuLinePath" stroke="#a855f7" stroke-width="1.2" fill="none" stroke-linecap="round" style="opacity: 0.85;"></path>
              <path *ngIf="metrics.dgpuSkin > 0 && showLine.dgpuSkin" [attr.d]="dgpuLinePath" stroke="#06b6d4" stroke-width="1.2" fill="none" stroke-linecap="round" style="opacity: 0.85;"></path>
            </svg>
          </div>
        </div>

        <!-- Active Fan Speed -->
        <div class="monitor-compact-seg">
          <div class="monitor-compact-title-row">
            <span class="monitor-compact-lbl">Fan Speed</span>
          </div>
          <div class="graph-container graph-container--compact">
            <div class="graph-y-axis" [style.opacity]="showLine.fan ? 1 : 0.5">
              <span class="axis-val">5700</span>
              <span class="axis-val">3200</span>
              <span class="axis-val">0 RPM</span>
            </div>
            <svg class="monitor-graph" viewBox="0 0 300 60" preserveAspectRatio="none">
              <defs>
                <linearGradient id="fanGradCompact" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.18"></stop>
                  <stop offset="100%" stop-color="#3b82f6" stop-opacity="0"></stop>
                </linearGradient>
              </defs>
              <path *ngIf="showLine.fan" [attr.d]="fanAreaPath" fill="url(#fanGradCompact)"></path>
              <path *ngIf="showLine.fan" [attr.d]="fanLinePath" stroke="#3b82f6" stroke-width="1.5" fill="none" stroke-linecap="round"></path>
            </svg>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ─── MONITOR STRIP ─── */
    .monitor-strip {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      height: auto;
      min-height: auto;
      background: transparent;
      padding: 16px 59px 0 16px;
      gap: 12px;
      flex-shrink: 0;
      user-select: none;
      position: relative;
    }
    .monitor-strip--non-sticky {
      padding-left: 0 !important;
      padding-right: 0 !important;
    }
    .monitor-row-top {
      width: 100%;
      display: flex;
    }
    .monitor-row-bottom {
      width: 100%;
      display: flex;
      gap: 12px;
    }
    .monitor-seg {
      display: flex;
      flex-direction: column;
      padding: 10px 16px;
      gap: 4px;
      background: #171717;
      border: 1px solid #242424;
      border-radius: 12px;
    }
    .monitor-seg--full {
      width: 100%;
      flex: 1;
    }
    .monitor-seg--half {
      width: 50%;
      flex: 1;
    }
    .monitor-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: none;
      padding-bottom: 0;
    }
    .monitor-label { font-size: 13px; font-weight: 600; color: #fff; letter-spacing: 0.02em; }
    
    .monitor-inline-row {
      display: flex;
      align-items: center;
      gap: 16px;
      width: 100%;
      margin-top: 0;
    }
    .live-wattage-col {
      display: flex;
      flex-direction: column;
      gap: 3px;
      min-width: 120px;
      flex-shrink: 0;
    }
    .graph-container--inline {
      flex: 1;
      height: 80px;
      margin-top: 0 !important;
    }
    .graph-wrap {
      display: flex;
      align-items: stretch;
      margin-top: 4px;
    }
    .graph-wrap--inline {
      flex: 1;
      height: 80px;
      margin-top: 0;
    }
    .graph-wrap > .graph-container {
      flex: 1;
      margin-top: 0;
    }
    .graph-tick-labels {
      width: 18px;
      position: relative;
      flex-shrink: 0;
    }
    .graph-tick-labels--right {
      width: 18px;
    }
    .gtick-lbl {
      position: absolute;
      right: 2px;
      transform: translateY(-50%);
      font-size: 7.5px;
      color: #ffffff;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 400;
      line-height: 1;
      user-select: none;
      white-space: nowrap;
      pointer-events: none;
    }
    .gtick-lbl--right {
      right: unset;
      left: 2px;
    }
    .limits-col {
      display: flex;
      flex-direction: column;
      gap: 4px;
      width: 140px;
      flex-shrink: 0;
      margin-top: 13px;
    }
    .limit-grid-item-inline {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 3px 6px;
      background: #1a1a1a;
      border: 1px solid #222;
      border-radius: 5px;
      font-size: 10px;
      color: #999;
      cursor: pointer;
      transition: all 250ms ease;
    }
    .limit-grid-item-inline--active {
      background: #141e2a;
      border-color: #3b82f6;
      color: #a3cfff;
      box-shadow: 0 0 6px rgba(59, 130, 246, 0.15);
    }
    .telemetry-inline-row {
      display: flex;
      align-items: center;
      justify-content: space-around;
      width: 100%;
      font-size: 11px;
      color: #888;
      margin-top: 8px;
      margin-bottom: 10px;
    }
    .telemetry-item {
      display: flex;
      align-items: center;
      gap: 5px;
      cursor: pointer;
    }
    .telemetry-item .lbl {
      font-weight: 500;
      letter-spacing: 0.02em;
    }
    .telemetry-item .val {
      font-size: 14px;
      color: #fff;
      font-weight: 600;
    }
    .telemetry-divider {
      color: #333;
      font-weight: 300;
      user-select: none;
    }
 
    /* Scheme Badging */
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
 
    /* time selection controls */
    .time-controls {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .pill-btn {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #888;
      font-size: 10px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 5px;
      cursor: pointer;
      transition: all 150ms ease;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 20px;
      user-select: none;
    }
    .pill-btn:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.15);
      color: #fff;
    }
    .pill-btn.active {
      background: rgba(59, 130, 246, 0.15);
      border-color: rgba(59, 130, 246, 0.3);
      color: #3b82f6;
    }
    
    .time-pill-custom {
      display: flex;
      align-items: center;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 5px;
      overflow: hidden;
      height: 20px;
      color: #888;
      font-size: 10px;
      font-weight: 600;
      transition: all 150ms ease;
    }
    .time-pill-custom.active {
      background: rgba(59, 130, 246, 0.15);
      border-color: rgba(59, 130, 246, 0.3);
      color: #3b82f6;
    }
    .time-pill-custom:hover {
      border-color: rgba(255, 255, 255, 0.15);
    }
    .arrow-btn {
      background: transparent;
      border: none;
      color: #22c55e;
      font-size: 13px;
      font-weight: 700;
      width: 18px;
      height: 100%;
      padding: 0 0 2px 0;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 150ms;
    }
    .arrow-btn:hover {
      background: rgba(255, 255, 255, 0.08);
    }
    .custom-lbl {
      padding: 0 5px;
      cursor: pointer;
      display: flex;
      align-items: center;
      height: 100%;
    }
 
    /* graph styles */
    .graph-container {
      width: 100%;
      height: 95px;
      background: rgba(0, 0, 0, 0.25);
      border: 1px solid rgba(255, 255, 255, 0.02);
      border-radius: 6px;
      overflow: hidden;
      margin-top: 4px;
      position: relative;
    }
    .monitor-graph {
      width: 100%;
      height: 100%;
      display: block;
    }
    .limit-line {
      stroke-dasharray: 2 3;
      stroke-width: 1;
      opacity: 0.3;
    }
    .limit-line-fast { stroke: #22c55e; }
    .limit-line-slow { stroke: #f59e0b; }
    .limit-line-temp { stroke: #ef4444; }
    .y-tick-line {
      stroke: rgba(255, 255, 255, 1);
      stroke-width: 0.8;
    }
 
    /* Interactive Legend Toggle Styles (dim only dot) */
    .dot--hidden {
      opacity: 0.4;
      background: transparent !important;
      border: 1px solid #777 !important;
    }
 
    /* HTML Axis Labels Overlay */
    .graph-y-axis-cpu {
      left: 26px !important;
    }
    .graph-y-axis {
      position: absolute;
      left: 16px; top: 0; bottom: 0;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 6px 0;
      pointer-events: none;
      z-index: 10;
      transition: opacity 250ms ease;
    }
    .axis-val {
      font-size: 11px;
      color: #ffffff;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
      line-height: 1;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 1), 0 0 4px rgba(0, 0, 0, 0.95);
      user-select: none;
    }
 
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


    /* ─── COMPACT MODE ─── */
    .monitor-strip--compact {
      padding: 8px 59px 0 16px;
      gap: 0;
    }
    .monitor-compact-row {
      display: flex;
      gap: 10px;
      width: 100%;
    }
    .monitor-compact-seg {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #171717;
      border: 1px solid #242424;
      border-radius: 8px;
      padding: 6px 10px;
      gap: 4px;
    }
    .monitor-compact-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 14px;
    }
    .monitor-compact-lbl {
      font-size: 11px;
      font-weight: 600;
      color: #999;
      letter-spacing: 0.02em;
    }
    .graph-container--compact {
      height: 50px;
      margin-top: 0 !important;
    }
    .live-watt-val {
      font-size: 14px;
      font-weight: 600;
      color: #fff;
    }
    @media (max-width: 750px) {
      .monitor-row-bottom {
        flex-direction: column;
        gap: 8px;
      }
      .monitor-seg--half {
        width: 100% !important;
      }
      .live-watt-val {
        font-size: 11.5px !important;
      }
      .telemetry-item .val {
        font-size: 11.5px !important;
      }
      .telemetry-item .lbl {
        font-size: 9.5px !important;
      }
      .live-watt-limit {
        font-size: 9px !important;
      }
      .limit-val {
        font-size: 9px !important;
      }
      .monitor-peak {
        font-size: 9px !important;
      }
      .monitor-label {
        font-size: 11px !important;
      }
      .time-controls button {
        font-size: 8.5px !important;
        padding: 2px 6px !important;
      }
      .limit-lbl {
        font-size: 9px !important;
      }
      .limit-val-new {
        font-size: 9px !important;
      }
    }
  `]
})
export class MonitorStripComponent implements OnInit, OnDestroy {
  private _metrics: any = {
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
    dgpuSkinLimit: 37.5,
    activeFanLevel: 0
  };

  @Input()
  set metrics(val: any) {
    this._metrics = val || this._metrics;
  }

  get metrics(): any {
    return this._metrics;
  }

  @Input() isSticky: boolean = true;
  @Input() peakFast: number = 0;
  @Input() peakSlow: number = 0;
  @Input() peakTemp: number = 0;
  @Input() dgpuBrand: string = 'UNKNOWN';
  @Input() compactMode: boolean = false;
  @Output() reset = new EventEmitter<void>();

  // Graphs time-window state
  timeWindow: '60s' | '2min' | 'custom' = '60s';
  customMin = 5;

  history: {
    timestamp: number;
    fastPpt: number;
    slowPpt: number;
    stapm: number;
    temp: number;
    apuSkin: number;
    dgpuSkin: number;
    fan: number;
  }[] = [];

  // Toggle Visibility Map for Graph lines (typed strongly to prevent TS4111)
  showLine: ShowLineConfig = {
    fastPpt: true,
    slowPpt: true,
    stapm: true,
    temp: true,
    apuSkin: true,
    dgpuSkin: true,
    fan: true
  };

  // Graph Path Strings
  fastLinePath: string = '';
  fastAreaPath: string = '';
  slowLinePath: string = '';
  stapmLinePath: string = '';
  coreLinePath: string = '';
  coreAreaPath: string = '';
  apuLinePath: string = '';
  dgpuLinePath: string = '';
  fanLinePath: string = '';
  fanAreaPath: string = '';

  private smoothed = {
    fastPpt: 0,
    slowPpt: 0,
    stapm: 0,
    temp: 0,
    apuSkin: 0,
    dgpuSkin: 0,
    fan: 0
  };

  private smoothInterval: any;

  ngOnInit() {
    // Redraw graphs smoothly at 200ms interval for scrolling effect
    this.smoothInterval = setInterval(() => {
      this.updateGraphPaths();
    }, 200);
  }

  ngOnDestroy() {
    if (this.smoothInterval) {
      clearInterval(this.smoothInterval);
    }
  }

  // Resets graph history, EMA state, and all SVG paths — called by bezel refresh
  public resetGraph() {
    this.history = [];
    this.smoothed = { fastPpt: 0, slowPpt: 0, stapm: 0, temp: 0, apuSkin: 0, dgpuSkin: 0, fan: 0 };
    this.fastLinePath = '';
    this.fastAreaPath = '';
    this.slowLinePath = '';
    this.stapmLinePath = '';
    this.coreLinePath = '';
    this.coreAreaPath = '';
    this.apuLinePath = '';
    this.dgpuLinePath = '';
    this.fanLinePath = '';
    this.fanAreaPath = '';
  }

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
    if (val < 48) return '#22c55e';
    if (val < 58) return '#f59e0b';
    return '#ef4444';
  }

  getRpm(level: number): number {
    if (level <= 8) return 800;
    if (level === 9) return 1200;
    if (level >= 10 && level <= 19) return 1600 + (level - 10) * 100;
    if (level === 29) return 4200;
    if (level >= 20 && level <= 28) return 3200 + (level - 20) * 100;
    if (level >= 30) return 4800 + (level - 30) * 100;
    return 800;
  }

  // Dynamic getters for dynamic Y-Axis labels
  get powerMaxLabel(): string {
    const maxY = Math.max(this.metrics?.fastPptLimit || 55, this.metrics?.slowPptLimit || 55, this.metrics?.stapmLimit || 55, this.peakPower || 0, 55) * 1.1;
    return `${Math.round(maxY)}W`;
  }

  get powerMidLabel(): string {
    const maxY = Math.max(this.metrics?.fastPptLimit || 55, this.metrics?.slowPptLimit || 55, this.metrics?.stapmLimit || 55, this.peakPower || 0, 55) * 1.1;
    return `${Math.round(maxY / 2)}W`;
  }

  get tempMaxLabel(): string {
    const maxTemp = Math.max(this.metrics?.tempLimit || 90, 100);
    return `${Math.round(maxTemp)}°C`;
  }

  get tempMidLabel(): string {
    const minTemp = 30;
    const maxTemp = Math.max(this.metrics?.tempLimit || 90, 100);
    return `${Math.round(minTemp + (maxTemp - minTemp) / 2)}°C`;
  }

  // Y-axis tick data for temperature graph: one tick every 10°C
  get tempTickData(): { y: number, label: string }[] {
    const minTemp = 30;
    const maxTemp = Math.max(this.metrics?.tempLimit || 90, 100);
    const data: { y: number, label: string }[] = [];
    for (let t = minTemp; t <= maxTemp; t += 10) {
      data.push({ y: this.getTempY(t), label: `${t}°` });
    }
    return data;
  }

  // Y-axis tick data for fan graph: one tick every 1000 RPM
  get fanRpmTickData(): { y: number, label: string }[] {
    const data: { y: number, label: string }[] = [];
    for (let rpm = 0; rpm <= 5000; rpm += 1000) {
      data.push({ y: 60 - (rpm / 5700) * 60, label: `${rpm}` });
    }
    return data;
  }

  // Y-axis tick data for power graph: one tick every 10W
  get powerTickData(): { y: number, label: string }[] {
    const maxY = Math.max(this.metrics?.fastPptLimit || 55, this.metrics?.slowPptLimit || 55, this.metrics?.stapmLimit || 55, this.peakPower || 0, 55) * 1.1;
    const data: { y: number, label: string }[] = [];
    for (let w = 0; w <= Math.ceil(maxY / 10) * 10; w += 10) {
      if (this.getPowerY(w) < 0) break;
      data.push({ y: this.getPowerY(w), label: `${w}` });
    }
    return data;
  }

  // Toggles visibility of legend items (using strongly-typed keys to resolve TS4111)
  toggleLine(key: keyof ShowLineConfig) {
    this.showLine[key] = !this.showLine[key];
    this.updateGraphPaths();
  }

  // Time window selectors
  selectTimeWindow(window: '60s' | '2min' | 'custom') {
    this.timeWindow = window;
    this.updateGraphPaths();
  }

  adjustCustomMin(dir: number, event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
    this.customMin = Math.max(3, Math.min(15, this.customMin + dir));
    this.timeWindow = 'custom';
    this.updateGraphPaths();
  }

  selectCustomWindow() {
    this.timeWindow = 'custom';
    this.updateGraphPaths();
  }

  getTimeWindowDurationMs(): number {
    if (this.timeWindow === '60s') return 60000;
    if (this.timeWindow === '2min') return 120000;
    return this.customMin * 60000;
  }

  getPowerY(val: number): number {
    const maxY = Math.max(this.metrics?.fastPptLimit || 55, this.metrics?.slowPptLimit || 55, this.metrics?.stapmLimit || 55, this.peakPower || 0, 55) * 1.1;
    return 60 - (val / maxY) * 60;
  }

  getTempY(val: number): number {
    const minTemp = 30;
    const maxTemp = Math.max(this.metrics?.tempLimit || 90, 100);
    const range = maxTemp - minTemp;
    return 60 - ((val - minTemp) / range) * 60;
  }

  getFanY(val: number): number {
    // Fan levels clamp strictly between 0 and 39
    return 60 - (val / 39) * 60;
  }

  updateGraphPaths() {
    const target = this.metrics;
    if (!target) return;

    // Initialize smoothed values to target on first valid reading
    if (this.smoothed.fastPpt === 0 && target.fastPpt !== 0) {
      this.smoothed.fastPpt = target.fastPpt;
      this.smoothed.slowPpt = target.slowPpt;
      this.smoothed.stapm = target.stapm;
      this.smoothed.temp = target.temp || 30;
      this.smoothed.apuSkin = target.apuSkin || 30;
      this.smoothed.dgpuSkin = target.dgpuSkin || 0;
      this.smoothed.fan = target.activeFanLevel || 0;
    }

    // Exponential Moving Average filter tracking target values at 200ms tick
    // Alpha controls tracking speed: 0.15 gives a gorgeous fluid wave transition on shifts
    const alpha = 0.15;
    this.smoothed.fastPpt = this.smoothed.fastPpt * (1 - alpha) + target.fastPpt * alpha;
    this.smoothed.slowPpt = this.smoothed.slowPpt * (1 - alpha) + target.slowPpt * alpha;
    this.smoothed.stapm = this.smoothed.stapm * (1 - alpha) + target.stapm * alpha;
    this.smoothed.temp = this.smoothed.temp * (1 - alpha) + (target.temp || 30) * alpha;
    this.smoothed.apuSkin = this.smoothed.apuSkin * (1 - alpha) + (target.apuSkin || 30) * alpha;
    this.smoothed.dgpuSkin = this.smoothed.dgpuSkin * (1 - alpha) + (target.dgpuSkin || 0) * alpha;
    this.smoothed.fan = this.smoothed.fan * (1 - alpha) + (target.activeFanLevel || 0) * alpha;

    const now = Date.now();
    this.history.push({
      timestamp: now,
      fastPpt: this.smoothed.fastPpt,
      slowPpt: this.smoothed.slowPpt,
      stapm: this.smoothed.stapm,
      temp: this.smoothed.temp,
      apuSkin: this.smoothed.apuSkin,
      dgpuSkin: this.smoothed.dgpuSkin,
      fan: this.smoothed.fan
    });

    // Prune entries older than 15 minutes (900000 ms)
    const cutoff = now - 900000;
    this.history = this.history.filter(item => item.timestamp >= cutoff);

    const duration = this.getTimeWindowDurationMs();
    const visibleCutoff = now - duration;

    // Filter history points in the active time window
    const visiblePoints = [...this.history.filter(item => item.timestamp >= visibleCutoff)];
    if (visiblePoints.length === 0) return;

    let fastCoords: { x: number; y: number }[] = [];
    let slowCoords: { x: number; y: number }[] = [];
    let stapmCoords: { x: number; y: number }[] = [];
    let coreCoords: { x: number; y: number }[] = [];
    let apuCoords: { x: number; y: number }[] = [];
    let dgpuCoords: { x: number; y: number }[] = [];
    let fanCoords: { x: number; y: number }[] = [];

    if (visiblePoints.length === 1) {
      const pt = visiblePoints[0];
      fastCoords = [{ x: 0, y: this.getPowerY(pt.fastPpt) }, { x: 300, y: this.getPowerY(pt.fastPpt) }];
      slowCoords = [{ x: 0, y: this.getPowerY(pt.slowPpt) }, { x: 300, y: this.getPowerY(pt.slowPpt) }];
      stapmCoords = [{ x: 0, y: this.getPowerY(pt.stapm) }, { x: 300, y: this.getPowerY(pt.stapm) }];
      coreCoords = [{ x: 0, y: this.getTempY(pt.temp) }, { x: 300, y: this.getTempY(pt.temp) }];
      apuCoords = [{ x: 0, y: this.getTempY(pt.apuSkin) }, { x: 300, y: this.getTempY(pt.apuSkin) }];
      if (pt.dgpuSkin > 0) {
        dgpuCoords = [{ x: 0, y: this.getTempY(pt.dgpuSkin) }, { x: 300, y: this.getTempY(pt.dgpuSkin) }];
      }
      fanCoords = [{ x: 0, y: this.getFanY(pt.fan) }, { x: 300, y: this.getFanY(pt.fan) }];
    } else {
      for (const pt of visiblePoints) {
        const age = now - pt.timestamp;
        const x = 300 - (age / duration) * 300;

        // Power
        fastCoords.push({ x, y: this.getPowerY(pt.fastPpt) });
        slowCoords.push({ x, y: this.getPowerY(pt.slowPpt) });
        stapmCoords.push({ x, y: this.getPowerY(pt.stapm) });

        // Thermals
        coreCoords.push({ x, y: this.getTempY(pt.temp) });
        apuCoords.push({ x, y: this.getTempY(pt.apuSkin) });
        if (pt.dgpuSkin > 0) {
          dgpuCoords.push({ x, y: this.getTempY(pt.dgpuSkin) });
        }

        // Fan speed
        fanCoords.push({ x, y: this.getFanY(pt.fan) });
      }

      // Sort
      fastCoords.sort((a, b) => a.x - b.x);
      slowCoords.sort((a, b) => a.x - b.x);
      stapmCoords.sort((a, b) => a.x - b.x);
      coreCoords.sort((a, b) => a.x - b.x);
      apuCoords.sort((a, b) => a.x - b.x);
      dgpuCoords.sort((a, b) => a.x - b.x);
      fanCoords.sort((a, b) => a.x - b.x);
    }

    // Convert coords to SVG paths
    this.fastLinePath = this.buildLinePath(fastCoords);
    this.fastAreaPath = this.buildAreaPath(fastCoords);
    this.slowLinePath = this.buildLinePath(slowCoords);
    this.stapmLinePath = this.buildLinePath(stapmCoords);

    this.coreLinePath = this.buildLinePath(coreCoords);
    this.coreAreaPath = this.buildAreaPath(coreCoords);
    this.apuLinePath = this.buildLinePath(apuCoords);
    this.dgpuLinePath = this.buildLinePath(dgpuCoords);

    this.fanLinePath = this.buildLinePath(fanCoords);
    this.fanAreaPath = this.buildAreaPath(fanCoords);
  }

  private buildLinePath(coords: { x: number; y: number }[]): string {
    if (coords.length === 0) return '';
    if (coords.length === 1) return `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;

    let d = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
    const tension = 0.33; // Tension factor for Catmull-Rom spline

    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i];
      const p1 = coords[i + 1];

      // Control point 1 (tangent at start of segment)
      let cpX1, cpY1;
      if (i > 0) {
        const pPrev = coords[i - 1];
        cpX1 = p0.x + (p1.x - pPrev.x) * tension;
        cpY1 = p0.y + (p1.y - pPrev.y) * tension;
      } else {
        cpX1 = p0.x + (p1.x - p0.x) * tension;
        cpY1 = p0.y;
      }

      // Control point 2 (tangent at end of segment)
      let cpX2, cpY2;
      if (i < coords.length - 2) {
        const pNext = coords[i + 2];
        cpX2 = p1.x - (pNext.x - p0.x) * tension;
        cpY2 = p1.y - (pNext.y - p0.y) * tension;
      } else {
        cpX2 = p1.x - (p1.x - p0.x) * tension;
        cpY2 = p1.y;
      }

      // Ensure Y control points stay within viewBox vertical bounds [0, 60]
      cpY1 = Math.max(0, Math.min(60, cpY1));
      cpY2 = Math.max(0, Math.min(60, cpY2));

      d += ` C ${cpX1.toFixed(1)} ${cpY1.toFixed(1)}, ${cpX2.toFixed(1)} ${cpY2.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
    }
    return d;
  }

  private buildAreaPath(coords: { x: number; y: number }[]): string {
    if (coords.length === 0) return '';
    const linePath = this.buildLinePath(coords);
    const startX = coords[0].x.toFixed(1);
    const endX = coords[coords.length - 1].x.toFixed(1);
    return `${linePath} L ${endX} 60 L ${startX} 60 Z`;
  }
}
