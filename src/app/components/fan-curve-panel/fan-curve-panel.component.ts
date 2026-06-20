import { Component, OnInit, OnDestroy, inject, ElementRef, ViewChild, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FanCurveService } from '../../fan-curve.service';
import { RyzenService, FanCurvePoint } from '../../ryzen.service';

@Component({
  selector: 'app-fan-curve-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card fancurve-card">
      <div class="card-header">
        <div class="header-text">
          <div style="display: flex; align-items: center; gap: 8px;">
            <h2 class="section-title">Smart Auto Fan Curve</h2>
            <!-- Live Fan Status Badge -->
            <span class="live-speed-badge" [class.live-speed-badge--active]="activeFanRpm > 800">
              ● Live: {{ activeFanRpm }} RPM
            </span>
          </div>
          <p class="section-subtitle">Double-click empty area to add point; double-click or right-click any point to remove.</p>
        </div>
        <div class="header-actions">
          <!-- Advanced Checkbox with Danger Sign -->
          <label class="advanced-checkbox-label">
            <input type="checkbox" [(ngModel)]="config.advanced" (change)="onAdvancedChange()" class="adv-checkbox" />
            <span class="adv-text">Advanced</span>
            <span *ngIf="config.advanced" class="danger-icon" [class.blink-danger]="shouldBlinkDanger">⚠️</span>
          </label>

          <button class="reset-btn" (click)="resetToDefault()">Reset Defaults</button>
          <button class="pill-toggle" [class.pill-toggle--on]="config.enabled"
            (click)="toggleSmartAuto()" role="switch" [attr.aria-checked]="config.enabled">
            <span class="pill-thumb"></span>
          </button>
        </div>
      </div>

      <!-- Graph Container -->
      <div class="graph-container">
        <svg #svgEl class="curve-svg" viewBox="0 0 500 160"
          (mousemove)="onDrag($event)"
          (mouseup)="endDrag()"
          (mouseleave)="endDrag()"
          (dblclick)="onSvgDoubleClick($event)">
          <defs>
            <!-- Background area gradient -->
            <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.2"/>
              <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.00"/>
            </linearGradient>
            <!-- Curve stroke gradient -->
            <linearGradient id="curve-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#3b82f6"/>
              <stop offset="50%" stop-color="#60a5fa"/>
              <stop offset="100%" stop-color="#ef4444"/>
            </linearGradient>
            <!-- Handle point glow -->
            <radialGradient id="point-glow">
              <stop offset="0%" stop-color="#fff" stop-opacity="1"/>
              <stop offset="40%" stop-color="#3b82f6" stop-opacity="0.8"/>
              <stop offset="100%" stop-color="#3b82f6" stop-opacity="0"/>
            </radialGradient>
          </defs>

          <!-- Grid Lines (Horizontal) -->
          <line *ngFor="let grid of yGridLines" x1="40" [attr.y1]="grid.y" x2="480" [attr.y2]="grid.y" stroke="rgba(255,255,255,0.05)" stroke-dasharray="2 2" />
          <text *ngFor="let grid of yGridLines" x="35" [attr.y]="grid.y + 3" class="grid-text text-right">{{ grid.label }}</text>

          <!-- Grid Lines (Vertical) -->
          <line *ngFor="let grid of xGridLines" [attr.x1]="grid.x" y1="15" [attr.x2]="grid.x" y2="140" stroke="rgba(255,255,255,0.05)" stroke-dasharray="2 2" />
          <text *ngFor="let grid of xGridLines" [attr.x]="grid.x" y="152" class="grid-text text-center">{{ grid.label }}°C</text>

          <!-- Area under curve -->
          <path [attr.d]="areaPath" fill="url(#area-grad)" />

          <!-- Curve line -->
          <path [attr.d]="linePath" fill="none" stroke="url(#curve-grad)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />

          <!-- Control Points Handles -->
          <g *ngFor="let pt of config.points; let i = index" class="point-handle"
            (mousedown)="startDrag($event, i)"
            (dblclick)="onPointDoubleClick($event, i)"
            (contextmenu)="onPointRightClick($event, i)"
            (mouseenter)="hoveredIndex = i"
            (mouseleave)="hoveredIndex = null">
            <!-- Glow background -->
            <circle [attr.cx]="getSvgX(pt.temp)" [attr.cy]="getSvgY(pt.level)" r="9" fill="url(#point-glow)" class="glow-ring" />
            <!-- Active circle -->
            <circle [attr.cx]="getSvgX(pt.temp)" [attr.cy]="getSvgY(pt.level)" r="4.5" fill="#fff" stroke="#2563eb" stroke-width="1.5" />
          </g>

          <!-- Live temperature scanning bar with Target Speed Readout (Rendered on top of curve line and handles) -->
          <g *ngIf="currentTemp > 30">
            <line [attr.x1]="tempX" y1="15" [attr.x2]="tempX" y2="140" stroke="rgba(239, 68, 68, 0.4)" stroke-width="1" stroke-dasharray="2 2" />
            <circle [attr.cx]="tempX" [attr.cy]="tempY" r="4.5" fill="#ef4444" stroke="#fff" stroke-width="1" class="live-temp-node" />
            
            <!-- Temperature Badge (Top) -->
            <rect [attr.x]="tempX - 18" y="2" width="36" height="11" rx="2" fill="rgba(239, 68, 68, 0.85)" />
            <text [attr.x]="tempX" y="10" class="live-temp-text text-center">{{ currentTemp }}°C</text>
            
            <!-- RPM & Level Badge (Intersection) -->
            <rect [attr.x]="tempX + 6" [attr.y]="tempY - 18" width="82" height="15" rx="3" fill="rgba(15, 23, 42, 0.85)" stroke="rgba(255, 255, 255, 0.08)" stroke-width="1" />
            <text [attr.x]="tempX + 10" [attr.y]="tempY - 8" fill="#ef4444" font-size="7.5" font-weight="700" font-family="inherit">
              {{ getRpm(getLevelFromY(tempY)) }} RPM
            </text>
            <text [attr.x]="tempX + 56" [attr.y]="tempY - 8" fill="#888" font-size="7.5" font-weight="600" font-family="inherit">
              (L{{ getLevelFromY(tempY) }})
            </text>
          </g>

          <!-- Tooltip for the active (hovered/dragged) point with highest z-index -->
          <g *ngIf="activeTooltipIndex !== null && activeTooltipPoint" class="drag-tooltip" style="pointer-events: none;">
            <!-- Semi-transparent dark background card with glow border -->
            <rect [attr.x]="activeTooltipX - 45" [attr.y]="activeTooltipY - 32" width="90" height="24" rx="4"
              fill="rgba(15, 23, 42, 0.95)" stroke="rgba(59, 130, 246, 0.6)" stroke-width="1" class="tooltip-box" />
            <!-- Little downward pointer triangle -->
            <polygon [attr.points]="(activeTooltipX - 4) + ',' + (activeTooltipY - 8) + ' ' + (activeTooltipX + 4) + ',' + (activeTooltipY - 8) + ' ' + activeTooltipX + ',' + (activeTooltipY - 4)"
              fill="rgba(15, 23, 42, 0.95)" stroke="rgba(59, 130, 246, 0.6)" stroke-width="1" />
            <!-- Overlap line to hide the top border of triangle under the box -->
            <line [attr.x1]="activeTooltipX - 3" [attr.y1]="activeTooltipY - 8.5" [attr.x2]="activeTooltipX + 3" [attr.y2]="activeTooltipY - 8.5"
              stroke="rgba(15, 23, 42, 0.95)" stroke-width="1.5" />
            <!-- Tooltip Text -->
            <text [attr.x]="activeTooltipX" [attr.y]="activeTooltipY - 22" fill="#fff" font-size="7.5" font-weight="700" font-family="inherit" text-anchor="middle">
              {{ activeTooltipPoint.temp }}°C &middot; {{ getRpm(activeTooltipPoint.level) }} RPM
            </text>
            <text [attr.x]="activeTooltipX" [attr.y]="activeTooltipY - 12" fill="#3b82f6" font-size="6.5" font-weight="600" font-family="inherit" text-anchor="middle">
              Level {{ activeTooltipPoint.level }}
            </text>
          </g>
        </svg>
      </div>

      <!-- Config & Parameter Sliders -->
      <div class="controls-section">
        <div class="row">
          <div class="control-box">
            <label class="control-label">Ramp-Down Cooldown</label>
            <div class="slider-row">
              <input type="range" min="5" max="30" step="1" [(ngModel)]="config.cooldown_secs" class="param-slider" />
              <span class="param-value">{{ config.cooldown_secs }}s</span>
            </div>
            <p class="control-desc">Time wait buffer before down-spinning fans to quiet down.</p>
          </div>

          <div class="control-box">
            <label class="control-label">Instant Spool Threshold</label>
            <div class="slider-row">
              <input type="range" min="70" max="95" step="1" [(ngModel)]="config.instant_spool_temp" class="param-slider" />
              <span class="param-value">{{ config.instant_spool_temp }}°C</span>
            </div>
            <p class="control-desc">Core temp above which fan speeds spike instantly (bypass polling average).</p>
          </div>

          <div class="control-box">
            <label class="control-label">Rolling Average Size</label>
            <div class="slider-row">
              <input type="range" min="1" max="10" step="1" [(ngModel)]="config.average_poll_size" class="param-slider" />
              <span class="param-value">{{ config.average_poll_size }}</span>
            </div>
            <p class="control-desc">Number of historical temp poll samples to average for normal fan adjustments.</p>
          </div>
        </div>

        <!-- Collapsible Steering Coordinate Points -->
        <div class="points-editor">
          <div class="editor-header" (click)="pointsCollapsed = !pointsCollapsed">
            <h3 class="subsection-title">Steering Coordinate Points ({{ config.points.length }}/8)</h3>
            <span class="collapse-icon">{{ pointsCollapsed ? '▼ Expand' : '▲ Collapse' }}</span>
          </div>

          <div *ngIf="!pointsCollapsed" class="editor-body">
            <div class="grid-inputs">
              <div *ngFor="let pt of config.points; let i = index" class="point-row">
                <span class="point-num">#{{ i + 1 }}</span>
                <div class="input-group">
                  <input type="number" min="30" max="100" [(ngModel)]="pt.temp" (ngModelChange)="onPointManualChange()" class="point-input" />
                  <span class="unit">°C</span>
                </div>
                <div class="input-group">
                  <input type="number" [min]="config.advanced ? 0 : 8" max="39" [(ngModel)]="pt.level" (ngModelChange)="onPointManualChange()" class="point-input" />
                  <span class="unit">Lvl</span>
                </div>
                <span class="rpm-label">{{ getRpm(pt.level) }} RPM</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Collapsible Logger Box -->
        <div class="logger-editor">
          <div class="editor-header" (click)="toggleLogger()">
            <h3 class="subsection-title" style="display: flex; align-items: center; gap: 6px;">
              <span>Smart Fan Decision Logs</span>
              <span *ngIf="config.enabled && pollHistory.length > 0" class="live-pulse-dot"></span>
            </h3>
            <span class="collapse-icon">{{ loggerCollapsed ? '▼ Expand' : '▲ Collapse' }}</span>
          </div>

          <div *ngIf="!loggerCollapsed" class="editor-body">
            <!-- Summary stats -->
            <div class="log-summary">
              <div class="summary-item">
                <span class="sum-lbl">Status</span>
                <span class="sum-val" [class.sum-val--active]="config.enabled">
                  {{ config.enabled ? 'Active' : 'Inactive' }}
                </span>
              </div>
              <div class="summary-item">
                <span class="sum-lbl">Last Raw Temp</span>
                <span class="sum-val">{{ currentTemp }}°C</span>
              </div>
              <div class="summary-item">
                <span class="sum-lbl">Decider Temp</span>
                <span class="sum-val" style="color: #3b82f6;">
                  {{ pollHistory.length > 0 ? pollHistory[pollHistory.length - 1].decisionTemp : '--' }}°C
                </span>
              </div>
              <div class="summary-item">
                <span class="sum-lbl">Algorithm Mode</span>
                <span class="sum-val" [style.color]="(pollHistory.length > 0 && pollHistory[pollHistory.length - 1].isInstant) ? '#ef4444' : '#60a5fa'">
                  {{ (pollHistory.length > 0 && pollHistory[pollHistory.length - 1].isInstant) ? 'Instant Spool' : 'Rolling Average' }}
                </span>
              </div>
            </div>

            <!-- Toolbar for logs actions -->
            <div class="log-toolbar">
              <span class="toolbar-info">Logs (Last 2 Min)</span>
              <button class="log-action-btn"
                      (click)="onLogButtonClick($event)"
                      title="Click to export logs, double-click to copy">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px; display: inline-block; vertical-align: middle;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Export Logs <span class="btn-subtext">(Double-click to Copy)</span>
              </button>
            </div>

            <!-- Scrollable logs terminal -->
            <div #logTerminalEl class="log-terminal">
              <div *ngIf="pollHistory.length === 0" class="log-empty">
                Waiting for telemetry polling data...
              </div>
              <div *ngFor="let log of pollHistory; let last = last" class="log-line" 
                [class.log-line--last]="last" 
                [class.log-line--triggered]="log.isTriggered">
                <span class="log-time">[{{ log.timestamp }}]</span>
                <span class="log-stat">Raw: <strong style="color: #ccc;">{{ log.temp }}°C</strong></span>
                <span class="log-separator">|</span>
                <span class="log-stat">Decider: 
                  <strong [style.color]="log.isInstant ? '#ef4444' : '#3b82f6'">{{ log.decisionTemp }}°C</strong>
                  <span class="log-mode-pill" [class.log-mode-pill--instant]="log.isInstant">
                    {{ log.isInstant ? 'Instant' : 'Avg' }}
                  </span>
                  <span class="avg-sources-text" *ngIf="!log.isInstant && log.avgSources && log.avgSources.length > 0">
                    ({{ log.avgSources.join(', ') }}°C)
                  </span>
                </span>
                <span class="log-separator">|</span>
                <span class="log-stat">Target: 
                  <strong style="color: #10b981;">{{ log.isSmartActive ? (log.targetRpm > 0 ? log.targetRpm + ' RPM' : '0 RPM (Off)') : 'Auto (HP)' }}</strong>
                  <span class="level-lbl" *ngIf="log.isSmartActive && log.targetLevel > 0">(L{{ log.targetLevel }})</span>
                </span>
                <span class="trigger-badge" *ngIf="log.isTriggered">
                  ⚡ Shifted
                </span>
              </div>
            </div>
          </div>
        </div>

        <button class="save-apply-btn" (click)="saveAndApply()">Save & Apply Curve</button>
      </div>
    </div>

    <!-- Fullscreen Warning Overlay -->
    <div class="warning-overlay" *ngIf="showAdvancedWarning" (click)="showAdvancedWarning = false">
      <div class="warning-modal" (click)="$event.stopPropagation()">
        <span class="warning-icon-large">⚠️</span>
        <h3 class="warning-modal-title">WARNING</h3>
        <p class="warning-modal-text">Fan turn-off at 0 RPM unlocked. Proceed with caution.</p>
        <button class="warning-modal-btn" (click)="showAdvancedWarning = false">I Understand</button>
      </div>
    </div>
  `,
  styles: [`
    .fancurve-card {
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: rgba(255, 255, 255, 0.04);
      backdrop-filter: blur(28px) brightness(1.08) saturate(160%);
      -webkit-backdrop-filter: blur(28px) brightness(1.08) saturate(160%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 14px;
      color: #fff;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      padding-bottom: 8px;
    }
    .section-title { font-size: 13px; font-weight: 600; color: #fff; letter-spacing: 0.02em; }
    .section-subtitle { font-size: 10px; color: #888; margin-top: 1px; }
    .header-actions { display: flex; align-items: center; gap: 10px; }
    
    .reset-btn {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.35);
      border-radius: 6px; color: #ef4444;
      font-size: 10px; font-weight: 600;
      padding: 4px 10px;
      transition: all 200ms ease;
      cursor: pointer;
    }
    .reset-btn:hover {
      background: rgba(239, 68, 68, 0.2);
      border-color: rgba(239, 68, 68, 0.5);
      color: #f87171;
    }

    .live-speed-badge {
      font-size: 9px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #aaa;
      letter-spacing: 0.02em;
    }
    .live-speed-badge--active {
      background: rgba(59, 130, 246, 0.1);
      border-color: rgba(59, 130, 246, 0.25);
      color: #3b82f6;
    }

    /* ─── ADVANCED CHECKBOX ─── */
    .advanced-checkbox-label {
      display: flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      user-select: none;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 6px;
      padding: 4px 8px;
      margin-right: 2px;
      transition: all 150ms ease;
    }
    .advanced-checkbox-label:hover {
      background: rgba(255, 255, 255, 0.06);
      border-color: rgba(255, 255, 255, 0.15);
    }
    .adv-checkbox {
      accent-color: #ef4444;
      cursor: pointer;
      width: 12px;
      height: 12px;
    }
    .adv-text {
      font-size: 10px;
      font-weight: 600;
      color: #ccc;
    }
    .danger-icon {
      font-size: 11px;
      margin-left: 2px;
      display: inline-block;
    }
    .blink-danger {
      animation: danger-blink 400ms ease-in-out 3;
    }
    @keyframes danger-blink {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.2); opacity: 0.3; }
    }

    /* ─── PILL TOGGLE ─── */
    .pill-toggle {
      position: relative; width: 36px; height: 20px;
      border-radius: 9999px; background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12); cursor: pointer;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.4);
      transition: background 200ms ease, border-color 200ms ease;
      padding: 0;
    }
    .pill-toggle--on {
      background: rgba(59, 130, 246, 0.85);
      border-color: rgba(59, 130, 246, 0.6);
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 10px rgba(59, 130, 246, 0.35);
    }
    .pill-thumb {
      position: absolute; top: 1px; left: 2px;
      width: 16px; height: 16px; border-radius: 50%;
      background: #fff; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
      transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
    }
    .pill-toggle--on .pill-thumb { transform: translateX(16px); }

    /* ─── GRAPH ─── */
    .graph-container {
      background: rgba(0, 0, 0, 0.25);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 10px;
      padding: 6px;
      position: relative;
    }
    .curve-svg {
      width: 100%; height: auto;
      display: block; overflow: visible;
    }
    .grid-text {
      font-size: 7px; fill: #555; font-weight: 500;
      font-family: inherit;
    }
    .text-right { text-anchor: end; }
    .text-center { text-anchor: middle; }
    .point-handle { cursor: grab; }
    .point-handle:active { cursor: grabbing; }
    .glow-ring {
      opacity: 0;
      transition: opacity 150ms ease;
    }
    .point-handle:hover .glow-ring {
      opacity: 1;
    }
    .live-temp-text {
      font-size: 7px;
      fill: #fff;
      font-weight: 700;
    }
    .live-temp-node {
      filter: drop-shadow(0 0 4px #ef4444);
    }

    .tooltip-box {
      filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.6));
    }

    /* ─── CONTROLS ─── */
    .controls-section { display: flex; flex-direction: column; gap: 10px; }
    .row { display: flex; gap: 12px; }
    .control-box {
      flex: 1; background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 8px; padding: 8px 10px;
      display: flex; flex-direction: column; gap: 2px;
    }
    .control-label { font-size: 13px; font-weight: 600; color: #eee; }
    .slider-row { display: flex; align-items: center; gap: 8px; }
    .param-slider {
      flex: 1; -webkit-appearance: none; appearance: none;
      height: 3px; border-radius: 9999px; background: rgba(255,255,255,0.08);
      outline: none; cursor: pointer;
    }
    .param-slider::-webkit-slider-thumb {
      -webkit-appearance: none; appearance: none;
      width: 10px; height: 10px; border-radius: 50%;
      background: #3b82f6; cursor: pointer;
    }
    .param-value { font-size: 13px; font-weight: 700; color: #3b82f6; min-width: 24px; }
    .control-desc { font-size: 11px; color: #aaa; }

    /* ─── STEERING COORDINATE POINTS ─── */
    .points-editor {
      background: rgba(255, 255, 255, 0.01);
      border: 1px solid rgba(255, 255, 255, 0.04);
      border-radius: 8px; padding: 10px;
      display: flex;
      flex-direction: column;
    }
    .editor-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      user-select: none;
    }
    .subsection-title { font-size: 11px; font-weight: 600; color: #ccc; margin: 0; }
    .collapse-icon { font-size: 10px; color: #777; font-weight: 600; }
    .editor-body {
      margin-top: 10px;
      display: flex;
      flex-direction: column;
    }
    .grid-inputs {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;
    }
    .point-row {
      display: flex; align-items: center; gap: 4px;
      background: rgba(0,0,0,0.15); border: 1px solid rgba(255,255,255,0.03);
      padding: 4px 6px; border-radius: 6px;
    }
    .point-num { font-size: 9px; font-weight: 700; color: #444; }
    .input-group {
      display: flex; align-items: center; background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.07); border-radius: 4px;
      padding: 1px 3px; width: 38px;
    }
    .point-input {
      background: none; border: none; color: #fff; width: 100%;
      font-size: 9px; font-weight: 600; text-align: center; outline: none;
      -moz-appearance: textfield;
    }
    .point-input::-webkit-outer-spin-button,
    .point-input::-webkit-inner-spin-button {
      -webkit-appearance: none; margin: 0;
    }
    .unit { font-size: 7.5px; color: #555; font-weight: 600; margin-left: 1px; }
    .rpm-label { font-size: 8px; color: #777; font-weight: 500; margin-left: auto; white-space: nowrap; }

    /* ─── SAVE APPLY ─── */
    .save-apply-btn {
      width: 100%; height: 30px;
      background: rgba(59, 130, 246, 0.12);
      border: 1px solid rgba(59, 130, 246, 0.35);
      border-radius: 8px; color: #3b82f6;
      font-size: 11px; font-weight: 600;
      transition: all 200ms ease;
      cursor: pointer;
    }
    .save-apply-btn:hover {
      background: rgba(59, 130, 246, 0.22);
      border-color: rgba(59, 130, 246, 0.5);
      color: #60a5fa;
      box-shadow: 0 4px 16px rgba(59, 130, 246, 0.25);
    }

    /* ─── LOGGER BOX ─── */
    .logger-editor {
      background: rgba(255, 255, 255, 0.01);
      border: 1px solid rgba(255, 255, 255, 0.04);
      border-radius: 8px; padding: 10px;
      display: flex;
      flex-direction: column;
      margin-top: 8px;
    }
    .live-pulse-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 6px #10b981;
      animation: live-pulse-glow 1.5s infinite alternate;
      display: inline-block;
    }
    @keyframes live-pulse-glow {
      from { opacity: 0.4; }
      to { opacity: 1; }
    }
    .log-summary {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      background: rgba(0, 0, 0, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.02);
      border-radius: 6px;
      padding: 8px 10px;
      margin-top: 10px;
      margin-bottom: 8px;
    }
    .summary-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .sum-lbl {
      font-size: 8px;
      font-weight: 600;
      color: #555;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .sum-val {
      font-size: 10.5px;
      font-weight: 600;
      color: #bbb;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .sum-val--active {
      color: #10b981;
    }
    .log-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
      padding: 0 2px;
      margin-top: 2px;
    }
    .toolbar-info {
      font-size: 8.5px;
      color: #666;
      font-weight: 500;
    }
    .log-action-btn {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #ccc;
      font-size: 8.5px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      transition: all 150ms ease;
      user-select: none;
    }
    .log-action-btn:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.15);
      color: #fff;
    }
    .log-action-btn:active {
      transform: scale(0.97);
    }
    .btn-subtext {
      color: #888;
      font-weight: 400;
      margin-left: 4px;
      font-size: 7.5px;
    }

    .log-terminal {
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.03);
      border-radius: 6px;
      padding: 8px;
      max-height: 150px;
      overflow-y: auto;
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .log-terminal::-webkit-scrollbar { width: 4px; }
    .log-terminal::-webkit-scrollbar-track { background: transparent; }
    .log-terminal::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 9999px; }
    
    .log-empty {
      font-size: 9px;
      color: #555;
      text-align: center;
      padding: 10px 0;
    }
    .log-line {
      font-size: 9px;
      color: #888;
      display: flex;
      align-items: center;
      gap: 6px;
      line-height: 1.4;
      border-bottom: 1px solid rgba(255, 255, 255, 0.01);
      padding-bottom: 2px;
      border-left: 2px solid transparent;
      padding-left: 2px;
    }
    .log-line--triggered {
      background: rgba(245, 158, 11, 0.05);
      border-left: 2px solid #f59e0b;
      padding-left: 4px;
    }
    .trigger-badge {
      font-size: 7px;
      font-weight: 700;
      color: #f59e0b;
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid rgba(245, 158, 11, 0.3);
      border-radius: 3px;
      padding: 0.5px 3px;
      margin-left: auto;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    .avg-sources-text {
      font-size: 7.5px;
      color: #555;
    }
    .log-line--last {
      border-bottom: none;
      padding-bottom: 0;
    }
    .log-time {
      color: #555;
    }
    .log-stat {
      display: flex;
      align-items: center;
      gap: 3px;
    }
    .log-separator {
      color: #333;
      font-weight: 300;
    }
    .log-mode-pill {
      font-size: 7.5px;
      font-weight: 700;
      padding: 0.5px 3px;
      border-radius: 3px;
      background: rgba(59, 130, 246, 0.1);
      border: 1px solid rgba(59, 130, 246, 0.15);
      color: #3b82f6;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    .log-mode-pill--instant {
      background: rgba(239, 68, 68, 0.1);
      border-color: rgba(239, 68, 68, 0.15);
      color: #ef4444;
    }
    .level-lbl {
      font-size: 8px;
      color: #666;
      font-weight: 500;
    }

    /* ─── WARNING OVERLAY ─── */
    .warning-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: fadeIn 200ms ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .warning-modal {
      background: #17171a;
      border: 1px solid rgba(239, 68, 68, 0.25);
      border-radius: 16px;
      padding: 30px;
      width: 320px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(239, 68, 68, 0.1);
      animation: scaleIn 250ms cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    @keyframes scaleIn {
      from { transform: scale(0.9); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    .warning-icon-large {
      font-size: 56px;
      margin-bottom: 16px;
      display: inline-block;
      filter: drop-shadow(0 0 10px rgba(239, 68, 68, 0.5));
      animation: modal-danger-blink 500ms ease-in-out 3;
    }
    @keyframes modal-danger-blink {
      0%, 100% { transform: scale(1); opacity: 1; filter: drop-shadow(0 0 10px rgba(239, 68, 68, 0.6)); }
      50% { transform: scale(1.15); opacity: 0.2; filter: drop-shadow(0 0 2px rgba(239, 68, 68, 0.1)); }
    }
    .warning-modal-title {
      font-size: 16px;
      font-weight: 700;
      color: #ef4444;
      margin-bottom: 8px;
      letter-spacing: 0.02em;
    }
    .warning-modal-text {
      font-size: 12.5px;
      color: #ccc;
      line-height: 1.5;
      margin-bottom: 20px;
    }
    .warning-modal-btn {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.4);
      color: #ef4444;
      border-radius: 8px;
      padding: 8px 24px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 150ms ease;
    }
    .warning-modal-btn:hover {
      background: rgba(239, 68, 68, 0.25);
      border-color: rgba(239, 68, 68, 0.6);
      box-shadow: 0 0 12px rgba(239, 68, 68, 0.2);
    }
  `]
})
export class FanCurvePanelComponent implements OnInit, OnDestroy {
  private fanCurveService = inject(FanCurveService);
  private ryzenService = inject(RyzenService);

  @ViewChild('svgEl', { static: false }) svgEl!: ElementRef<SVGElement>;
  @ViewChild('logTerminalEl', { static: false }) logTerminalEl!: ElementRef<HTMLDivElement>;

  config = {
    ...this.fanCurveService.config,
    points: this.fanCurveService.config.points.map(p => ({ ...p }))
  };
  activeDragIndex: number | null = null;
  hoveredIndex: number | null = null;
  currentTemp = 0;
  pointsCollapsed = true; // collapsed by default per user request
  shouldBlinkDanger = false;
  showAdvancedWarning = false;
  @Output() showToast = new EventEmitter<{ message: string; type: 'success' | 'error' | 'info' }>();
  loggerCollapsed = true;
  pollHistory: {
    timeMs: number;
    timestamp: string;
    temp: number;
    decisionTemp: number;
    isInstant: boolean;
    targetLevel: number;
    targetRpm: number;
    isSmartActive: boolean;
    avgSources?: number[];
    isTriggered?: boolean;
  }[] = [];
  private pollInterval: any;

  // Grid Lines calculations (Vertical core temp)
  get xGridLines() {
    return [
      { label: '30', x: this.getSvgX(30) },
      { label: '40', x: this.getSvgX(40) },
      { label: '50', x: this.getSvgX(50) },
      { label: '60', x: this.getSvgX(60) },
      { label: '70', x: this.getSvgX(70) },
      { label: '80', x: this.getSvgX(80) },
      { label: '90', x: this.getSvgX(90) },
      { label: '100', x: this.getSvgX(100) }
    ];
  }

  // Grid Lines calculations (Horizontal linear RPM)
  get yGridLines() {
    if (this.config.advanced) {
      return [
        { label: '0', y: this.getSvgYFromRpm(0) },
        { label: '1000', y: this.getSvgYFromRpm(1000) },
        { label: '2000', y: this.getSvgYFromRpm(2000) },
        { label: '3000', y: this.getSvgYFromRpm(3000) },
        { label: '4000', y: this.getSvgYFromRpm(4000) },
        { label: '5000', y: this.getSvgYFromRpm(5000) }
      ];
    } else {
      return [
        { label: '1000', y: this.getSvgYFromRpm(1000) },
        { label: '2000', y: this.getSvgYFromRpm(2000) },
        { label: '3000', y: this.getSvgYFromRpm(3000) },
        { label: '4000', y: this.getSvgYFromRpm(4000) },
        { label: '5000', y: this.getSvgYFromRpm(5000) }
      ];
    }
  }

  ngOnInit() {
    this.config = {
      ...this.fanCurveService.config,
      points: this.fanCurveService.config.points.map(p => ({ ...p }))
    };

    // Poll live temperature
    this.updateLiveTemp();
    this.pollInterval = setInterval(() => this.updateLiveTemp(), 2000);
  }

  ngOnDestroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  updateLiveTemp() {
    const limits = this.ryzenService.latestLimits;
    if (limits && limits.tctl_value !== undefined) {
      this.currentTemp = Math.round(limits.tctl_value);

      const decisionTemp = limits.smart_fan_decision_temp !== undefined 
        ? limits.smart_fan_decision_temp 
        : this.currentTemp;
        
      const isInstant = limits.smart_fan_is_instant !== undefined 
        ? limits.smart_fan_is_instant 
        : (this.config.enabled && this.currentTemp > this.config.instant_spool_temp);
        
      const targetLevel = this.activeFanLevel;
      const targetRpm = this.activeFanRpm;
      const isSmartActive = this.config.enabled;
      
      const now = new Date();
      const timestamp = now.toTimeString().split(' ')[0]; // HH:MM:SS

      // Check if we already logged this timestamp to avoid duplicates
      const lastEntry = this.pollHistory[this.pollHistory.length - 1];
      if (lastEntry && lastEntry.timestamp === timestamp) {
        return;
      }

      // Check if this poll triggered a fan speed level or mode shift
      const isTriggered = lastEntry 
        ? (lastEntry.targetLevel !== targetLevel || lastEntry.isSmartActive !== isSmartActive) 
        : false;

      // Extract the temperatures that contributed to the average
      const sampleSize = Math.max(1, this.config.average_poll_size || 3);
      const avgSources = this.pollHistory
        .slice(- (sampleSize - 1))
        .map(h => h.temp);
      avgSources.push(this.currentTemp);

      const timeMs = Date.now();
      this.pollHistory.push({
        timeMs,
        timestamp,
        temp: this.currentTemp,
        decisionTemp: Number(decisionTemp.toFixed(1)),
        isInstant,
        targetLevel,
        targetRpm,
        isSmartActive,
        avgSources,
        isTriggered
      });
      
      // Keep only logs from the last 2 minutes (120000 milliseconds)
      const cutoff = Date.now() - 120000;
      this.pollHistory = this.pollHistory.filter(h => h.timeMs >= cutoff);

      if (!this.loggerCollapsed) {
        setTimeout(() => {
          this.scrollToBottom();
        });
      }
    }
  }

  private logClickTimeout: any = null;

  onLogButtonClick(event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
    if (this.logClickTimeout) {
      clearTimeout(this.logClickTimeout);
      this.logClickTimeout = null;
      this.copyLogs();
    } else {
      this.logClickTimeout = setTimeout(() => {
        this.logClickTimeout = null;
        this.exportLogs();
      }, 250);
    }
  }

  getFormattedLogs(): string {
    const pointsStr = this.config.points
      .map((p, i) => `  #${i + 1}: ${p.temp}°C -> Level ${p.level} (${this.getRpm(p.level)} RPM)`)
      .join('\n');

    const lines = [
      `=========================================`,
      `NiyanTraK Smart Fan Decision Logs (Last 2 Mins)`,
      `Exported at: ${new Date().toLocaleString()}`,
      `=========================================`,
      `[CONFIGURATION SETTINGS]`,
      `- Smart Auto Fan: ${this.config.enabled ? 'Enabled' : 'Disabled'}`,
      `- Instant Spool Threshold: ${this.config.instant_spool_temp}°C`,
      `- Rolling Average Size: ${this.config.average_poll_size} samples`,
      `- Cooldown Delay: ${this.config.cooldown_secs}s`,
      `- Advanced Mode: ${this.config.advanced ? 'Enabled' : 'Disabled'}`,
      `- Steering Coordinate Points:`,
      pointsStr,
      `=========================================`,
      ``
    ];
    for (const log of this.pollHistory) {
      const mode = log.isInstant ? 'Instant Spool' : 'Rolling Average';
      const avgSourcesStr = (!log.isInstant && log.avgSources && log.avgSources.length > 0)
        ? ` (${log.avgSources.join(', ')}°C)`
        : '';
      const targetStr = log.isSmartActive 
        ? (log.targetRpm > 0 ? `${log.targetRpm} RPM (Lvl ${log.targetLevel})` : '0 RPM (Off)')
        : 'Auto (HP)';
      const shiftStr = log.isTriggered ? ' [⚡ Shifted]' : '';
      
      lines.push(`[${log.timestamp}] Raw: ${log.temp}°C | Decider: ${log.decisionTemp}°C (${mode}${avgSourcesStr}) | Target: ${targetStr}${shiftStr}`);
    }
    return lines.join('\n');
  }

  exportLogs() {
    const text = this.getFormattedLogs();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `niyantrak_fan_logs_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    this.showToast.emit({ message: 'Fan logs exported successfully!', type: 'success' });
  }

  copyLogs() {
    const text = this.getFormattedLogs();
    navigator.clipboard.writeText(text).then(() => {
      this.showToast.emit({ message: 'Fan logs copied to clipboard!', type: 'success' });
    }).catch(err => {
      this.showToast.emit({ message: 'Failed to copy logs: ' + err, type: 'error' });
    });
  }

  toggleLogger() {
    this.loggerCollapsed = !this.loggerCollapsed;
    if (!this.loggerCollapsed) {
      setTimeout(() => {
        this.scrollToBottom();
      }, 50);
    }
  }

  scrollToBottom() {
    if (this.logTerminalEl) {
      const el = this.logTerminalEl.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }

  // Live indicators
  get activeFanLevel(): number {
    return this.ryzenService.latestLimits?.smart_fan_active_level ?? 0;
  }

  get activeFanRpm(): number {
    return this.getRpm(this.activeFanLevel);
  }

  // Hover & Grab Tooltip Getters
  get activeTooltipIndex(): number | null {
    return this.activeDragIndex !== null ? this.activeDragIndex : this.hoveredIndex;
  }

  get activeTooltipPoint(): FanCurvePoint | null {
    const idx = this.activeTooltipIndex;
    if (idx === null) return null;
    return this.config.points[idx] || null;
  }

  get activeTooltipX(): number {
    const pt = this.activeTooltipPoint;
    return pt ? this.getSvgX(pt.temp) : 0;
  }

  get activeTooltipY(): number {
    const pt = this.activeTooltipPoint;
    return pt ? this.getSvgY(pt.level) : 0;
  }

  onAdvancedChange() {
    if (this.config.advanced) {
      this.showAdvancedWarning = true;
      this.shouldBlinkDanger = true;
      setTimeout(() => {
        this.shouldBlinkDanger = false;
      }, 1200); // 3 * 400ms = 1200ms animation duration
    } else {
      // Revert any levels below 8 back to 8
      let modified = false;
      for (const pt of this.config.points) {
        if (pt.level < 8) {
          pt.level = 8;
          modified = true;
        }
      }
      if (modified) {
        this.onPointManualChange();
      }
    }
  }

  // Coord Converters
  getSvgX(temp: number): number {
    const minTemp = 30;
    const maxTemp = 100;
    const plotWidth = 440; // 480 - 40
    const marginL = 40;
    const pct = (temp - minTemp) / (maxTemp - minTemp);
    return marginL + pct * plotWidth;
  }

  getSvgY(level: number): number {
    return this.getSvgYFromRpm(this.getRpm(level));
  }

  getSvgYFromRpm(rpm: number): number {
    const minRpm = this.config.advanced ? 0 : 800;
    const maxRpm = 5700;
    const plotHeight = 125; // 140 - 15
    const pct = (rpm - minRpm) / (maxRpm - minRpm);
    return 140 - pct * plotHeight;
  }

  getTempFromX(x: number): number {
    const minTemp = 30;
    const maxTemp = 100;
    const plotWidth = 440;
    const marginL = 40;
    const pct = (x - marginL) / plotWidth;
    const temp = minTemp + pct * (maxTemp - minTemp);
    return Math.round(Math.max(minTemp, Math.min(maxTemp, temp)));
  }

  getLevelFromRpm(rpm: number): number {
    const startLvl = this.config.advanced ? 0 : 8;
    let closestLevel = startLvl;
    let minDiff = Infinity;
    for (let l = startLvl; l <= 39; l++) {
      if (this.config.advanced && l > 0 && l < 8) {
        continue; // Skip levels 1 to 7 since BIOS only supports 0 (fan off) or 8-39
      }
      const diff = Math.abs(this.getRpm(l) - rpm);
      if (diff < minDiff) {
        minDiff = diff;
        closestLevel = l;
      }
    }
    return closestLevel;
  }

  getLevelFromY(y: number): number {
    const minRpm = this.config.advanced ? 0 : 800;
    const maxRpm = 5700;
    const plotHeight = 125;
    const marginT = 15;
    const pct = 1 - (y - marginT) / plotHeight;
    const rpm = minRpm + pct * (maxRpm - minRpm);
    return this.getLevelFromRpm(rpm);
  }

  getRpm(level: number): number {
    if (level <= 0)                 return 0;
    if (level <= 8)                 return 800;
    if (level === 9)                return 1200;
    if (level >= 10 && level <= 19) return 1600 + (level - 10) * 100;
    if (level === 29)               return 4200;
    if (level >= 20 && level <= 28) return 3200 + (level - 20) * 100;
    if (level >= 30)                return 4800 + (level - 30) * 100;
    return 800;
  }

  // Paths
  get linePath(): string {
    const pts = this.config.points;
    if (pts.length === 0) return '';
    const sorted = [...pts].sort((a, b) => a.temp - b.temp);
    return sorted.reduce((acc, pt, idx) => {
      const x = this.getSvgX(pt.temp);
      const y = this.getSvgY(pt.level);
      return acc + (idx === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
    }, '');
  }

  get areaPath(): string {
    const pts = this.config.points;
    if (pts.length === 0) return '';
    const sorted = [...pts].sort((a, b) => a.temp - b.temp);
    const startX = this.getSvgX(sorted[0].temp);
    const endX = this.getSvgX(sorted[sorted.length - 1].temp);
    const lineParts = sorted.map(pt => `${this.getSvgX(pt.temp)} ${this.getSvgY(pt.level)}`).join(' L ');
    return `M ${startX} 140 L ${lineParts} L ${endX} 140 Z`;
  }

  // Live indicator positions
  get tempX(): number {
    return this.getSvgX(this.currentTemp);
  }

  get tempY(): number {
    const pts = this.config.points;
    if (pts.length === 0) return 140;
    const sorted = [...pts].sort((a, b) => a.temp - b.temp);
    
    if (this.currentTemp <= sorted[0].temp) {
      return this.getSvgY(sorted[0].level);
    }
    if (this.currentTemp >= sorted[sorted.length - 1].temp) {
      return this.getSvgY(sorted[sorted.length - 1].level);
    }
    
    for (let i = 0; i < sorted.length - 1; i++) {
      const p1 = sorted[i];
      const p2 = sorted[i+1];
      if (this.currentTemp >= p1.temp && this.currentTemp <= p2.temp) {
        const ratio = (this.currentTemp - p1.temp) / (p2.temp - p1.temp);
        const y1 = this.getSvgY(p1.level);
        const y2 = this.getSvgY(p2.level);
        return y1 + ratio * (y2 - y1);
      }
    }
    return 140;
  }

  // Dragging logic
  startDrag(event: MouseEvent, index: number) {
    event.preventDefault();
    this.activeDragIndex = index;
  }

  onDrag(event: MouseEvent) {
    if (this.activeDragIndex === null) return;
    
    const rect = this.svgEl.nativeElement.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    // Scale SVG points mapping (500x160)
    const svgX = (mouseX / rect.width) * 500;
    const svgY = (mouseY / rect.height) * 160;
    
    const newTemp = this.getTempFromX(svgX);
    const newLevel = this.getLevelFromY(svgY);
    
    const pts = this.config.points;
    const idx = this.activeDragIndex;
    
    // Constrain temp movement to keep points sequential
    const minT = idx > 0 ? pts[idx - 1].temp + 1 : 30;
    const maxT = idx < pts.length - 1 ? pts[idx + 1].temp - 1 : 100;
    
    const minLvl = this.config.advanced ? 0 : 8;
    
    pts[idx].temp = Math.max(minT, Math.min(maxT, newTemp));
    pts[idx].level = Math.max(minLvl, Math.min(39, newLevel));
  }

  endDrag() {
    this.activeDragIndex = null;
  }

  onPointManualChange() {
    // Sort points after manual numeric entries
    this.config.points.sort((a, b) => a.temp - b.temp);
  }

  toggleSmartAuto() {
    this.config.enabled = !this.config.enabled;
  }

  resetToDefault() {
    const defaults = this.fanCurveService.getDefaultPoints();
    this.config = {
      ...this.config,
      points: defaults.map(p => ({ ...p })),
      instant_spool_temp: 85,
      average_poll_size: 3,
      cooldown_secs: 10,
      advanced: false
    };
  }

  // Graph Double-Click to Add Points
  onSvgDoubleClick(event: MouseEvent) {
    if (this.config.points.length >= 8) return;
    
    const rect = this.svgEl.nativeElement.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    const svgX = (mouseX / rect.width) * 500;
    const svgY = (mouseY / rect.height) * 160;
    
    const newTemp = this.getTempFromX(svgX);
    const newLevel = this.getLevelFromY(svgY);
    
    // Check if a point at this temperature already exists
    const exists = this.config.points.some(pt => pt.temp === newTemp);
    if (exists) return;

    this.config.points.push({ temp: newTemp, level: newLevel });
    this.onPointManualChange();
  }

  // Point Handle Double-Click to Remove
  onPointDoubleClick(event: MouseEvent, index: number) {
    event.stopPropagation();
    event.preventDefault();
    this.removePoint(index);
  }

  // Point Handle Right-Click to Remove
  onPointRightClick(event: MouseEvent, index: number) {
    event.stopPropagation();
    event.preventDefault();
    this.removePoint(index);
  }

  removePoint(index: number) {
    if (this.config.points.length <= 3) return;
    this.config.points.splice(index, 1);
    this.onPointManualChange();
  }

  addPoint() {
    if (this.config.points.length >= 8) return;
    const pts = [...this.config.points].sort((a, b) => a.temp - b.temp);
    
    let maxGap = 0;
    let insertIndex = 0;
    let insertTemp = 60;
    let insertLevel = 20;

    for (let i = 0; i < pts.length - 1; i++) {
      const gap = pts[i+1].temp - pts[i].temp;
      if (gap > maxGap) {
        maxGap = gap;
        insertIndex = i;
        insertTemp = Math.round((pts[i].temp + pts[i+1].temp) / 2);
        insertLevel = Math.round((pts[i].level + pts[i+1].level) / 2);
      }
    }

    if (maxGap < 5) {
      const last = pts[pts.length - 1];
      insertTemp = Math.min(100, last.temp + 5);
      insertLevel = Math.min(39, last.level + 3);
    }

    this.config.points.push({ temp: insertTemp, level: insertLevel });
    this.onPointManualChange();
  }

  async saveAndApply() {
    const messages = [
      'Whispering to the fans...',
      'Optimizing wind tunnels...',
      'Calibrating thermal thrusters...',
      'Spooling up wind pipes...',
      'Aligning cooling vectors...'
    ];
    const wittyMessage = messages[Math.floor(Math.random() * messages.length)];
    this.showToast.emit({ message: wittyMessage, type: 'info' });

    try {
      await this.fanCurveService.saveConfig(this.config);
      await new Promise(resolve => setTimeout(resolve, 1300));
      this.showToast.emit({ message: 'Smart Auto Fan Curve settings successfully applied!', type: 'success' });
    } catch (err) {
      this.showToast.emit({ message: 'Failed to save settings: ' + err, type: 'error' });
    }
  }
}
