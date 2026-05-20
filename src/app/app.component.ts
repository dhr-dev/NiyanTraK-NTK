import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { invoke } from '@tauri-apps/api/core';
import { RyzenService } from './ryzen.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="app-shell">

      <!-- ══ LEFT: FULL-HEIGHT NAV RAIL (anchored to window, not content) ══ -->
      <nav class="nav-rail">
        <div class="brand-pill">
          <span class="brand-dot"></span>
        </div>
        <button class="nav-btn nav-btn--active" title="Quick Control">
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path fill-rule="evenodd" d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z" clip-rule="evenodd"/>
          </svg>
          <span class="nav-label">Quick</span>
        </button>
      </nav>

      <!-- ══ RIGHT: ALL CONTENT STACKED VERTICALLY ══ -->
      <div class="content-col">

        <!-- TOP BAR -->
        <header class="topbar">
          <div class="brand">
            <span class="brand-name">VictusDeck</span>
            <span class="brand-sep">·</span>
            <span class="brand-sub">HP Victus Tuning Suite</span>
          </div>
          <div class="status-pill">{{ statusPillText }}</div>
        </header>

        <!-- STRESS BANNER -->
        <div class="stress-banner" [class.stress-banner--active]="stressActive">
          <svg viewBox="0 0 24 24" fill="#ef4444" width="13" height="13" style="flex-shrink:0">
            <path d="M12.963 2.285a.75.75 0 0 0-1.071-.105 9.715 9.715 0 0 1-3.662 1.777C7.03 4.3 6 5.376 6 6.75c0 1.258.625 2.186 1.488 2.76.818.544 1.83.746 2.512.746a.75.75 0 0 0 .736-.834 5.25 5.25 0 0 1 .425-3.32.75.75 0 0 1 1.157-.117 9.716 9.716 0 0 1 2.424 5.12 3.75 3.75 0 0 0 2.222-2.12.75.75 0 0 0-.613-.984 6.75 6.75 0 0 1-3.42-8.794ZM4.002 18.003A8.966 8.966 0 0 0 12 22.002a8.966 8.966 0 0 0 7.998-3.999A9.957 9.957 0 0 1 12 16.002a9.956 9.956 0 0 1-7.998 2.001Z"/>
          </svg>
          <div class="stress-bar-track">
            <div class="stress-bar-fill" [style.width]="stressPercent + '%'"></div>
          </div>
          <span class="stress-timer">{{ stressRemaining }}</span>
          <button class="stress-stop-btn" (click)="toggleStressTest()">Stop</button>
        </div>

        <!-- MONITOR STRIP -->
        <div class="monitor-strip">
          <!-- FAST PPT -->
          <div class="monitor-seg">
            <div class="monitor-row">
              <span class="monitor-label">FAST PPT</span>
              <span class="monitor-peak"
                *ngIf="peakFastPpt > 0"
                [style.color]="metricColor(peakFastPpt, monitorMetrics.fastPptLimit)"
              >↑ {{ peakFastPpt }}W</span>
            </div>
            <div class="monitor-value">{{ monitorMetrics.fastPpt }}W</div>
            <div class="monitor-bar-track">
              <div class="monitor-bar-fill"
                [style.width]="metricPct(monitorMetrics.fastPpt, monitorMetrics.fastPptLimit) + '%'"
                [style.background]="metricColor(monitorMetrics.fastPpt, monitorMetrics.fastPptLimit)">
              </div>
            </div>
          </div>
          <div class="monitor-divider"></div>
          <!-- SLOW PPT -->
          <div class="monitor-seg">
            <div class="monitor-row">
              <span class="monitor-label">SLOW PPT</span>
              <span class="monitor-peak"
                *ngIf="peakSlowPpt > 0"
                [style.color]="metricColor(peakSlowPpt, monitorMetrics.slowPptLimit)"
              >↑ {{ peakSlowPpt }}W</span>
            </div>
            <div class="monitor-value">{{ monitorMetrics.slowPpt }}W</div>
            <div class="monitor-bar-track">
              <div class="monitor-bar-fill"
                [style.width]="metricPct(monitorMetrics.slowPpt, monitorMetrics.slowPptLimit) + '%'"
                [style.background]="metricColor(monitorMetrics.slowPpt, monitorMetrics.slowPptLimit)">
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
                [style.color]="metricColor(peakTemp, monitorMetrics.tempLimit)"
              >↑ {{ peakTemp }}°C</span>
            </div>
            <div class="monitor-value">{{ monitorMetrics.temp }}°C</div>
            <div class="monitor-bar-track">
              <div class="monitor-bar-fill"
                [style.width]="metricPct(monitorMetrics.temp, monitorMetrics.tempLimit) + '%'"
                [style.background]="metricColor(monitorMetrics.temp, monitorMetrics.tempLimit)">
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
            <div class="monitor-value">{{ monitorMetrics.stapm }}W</div>
            <div class="monitor-bios-sub">BIOS-ctrl</div>
          </div>
          <!-- RESET PEAKS -->
          <button class="peak-reset-btn" (click)="resetPeaks()" title="Reset peak values">↺</button>
        </div>

        <!-- PROFILES DRAWER (bezel ribbon handles open/close — no close button to avoid collision) -->
        <div class="profiles-drawer" [class.profiles-drawer--open]="profilesOpen">
          <div class="drawer-header">
            <span class="drawer-title">PROFILES</span>
          </div>
          <div class="drawer-cards">
            <div *ngFor="let p of profiles"
              class="drawer-card"
              [class.drawer-card--active]="profileName === p.name"
              (click)="onSelectProfile(p.name)"
            >
              <div class="drawer-card-name">{{ p.label }}</div>
              <div class="drawer-card-spec">{{ p.powerLimit }}W · {{ p.fanLabel }}</div>
            </div>
            <div class="drawer-card"
              [class.drawer-card--active]="profileName === 'custom'"
              (click)="onSelectProfile('custom')"
            >
              <div class="drawer-card-name">+ Custom</div>
              <div class="drawer-card-spec">Manual</div>
            </div>
          </div>
        </div>

        <!-- BEZEL RIBBONS: Profiles + Stress on right edge -->
        <div class="bezel-wrap">
          <!-- Profiles ribbon: always visible, toggles the drawer -->
          <div class="ribbon"
            [class.ribbon--open]="profilesOpen"
            (click)="profilesOpen = !profilesOpen"
            title="Performance Profiles"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path fill-rule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clip-rule="evenodd"/>
            </svg>
            <span class="ribbon-text">{{ profilesOpen ? '✕ CLOSE' : 'PROFILES' }}</span>
          </div>
          <!-- Stress ribbon: always visible, toggles stress test -->
          <div class="ribbon ribbon--stress"
            [class.ribbon--stress-on]="stressActive"
            (click)="toggleStressTest()"
            title="{{ stressActive ? 'Stop Stress Test' : 'Start Stress Test' }}"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path fill-rule="evenodd" d="M12.963 2.285a.75.75 0 0 0-1.071-.105 9.715 9.715 0 0 1-3.662 1.777C7.03 4.3 6 5.376 6 6.75c0 1.258.625 2.186 1.488 2.76.818.544 1.83.746 2.512.746a.75.75 0 0 0 .736-.834 5.25 5.25 0 0 1 .425-3.32.75.75 0 0 1 1.157-.117 9.716 9.716 0 0 1 2.424 5.12 3.75 3.75 0 0 0 2.222-2.12.75.75 0 0 0-.613-.984 6.75 6.75 0 0 1-3.42-8.794ZM4.002 18.003A8.966 8.966 0 0 0 12 22.002a8.966 8.966 0 0 0 7.998-3.999A9.957 9.957 0 0 1 12 16.002a9.956 9.956 0 0 1-7.998 2.001Z" clip-rule="evenodd"/>
            </svg>
            <span class="ribbon-text">{{ stressActive ? '■ STOP' : 'STRESS' }}</span>
          </div>
        </div>

        <!-- VIEWPORT: SCROLLABLE PAGES -->
        <main class="viewport">

          <!-- ── QUICK CONTROL PAGE ── -->
          <div *ngIf="activePage === 'quick'" class="page-quick">

            <!-- FAN CONTROL CARD (compact) -->
            <section class="card fan-card">
              <div class="card-header">
                <h2 class="section-title">Fan Control</h2>
                <button class="pill-toggle" [class.pill-toggle--on]="fanEnabled"
                  (click)="toggleFanControl()" role="switch" [attr.aria-checked]="fanEnabled">
                  <span class="pill-thumb"></span>
                </button>
              </div>

              <div class="slider-block" [class.slider-block--disabled]="!fanEnabled">
                <div class="slider-labels">
                  <span class="slider-edge">Silent</span>
                  <span class="slider-edge">Max</span>
                </div>
                <input type="range" class="range-slider" id="fan-slider"
                  min="8" max="39" step="1"
                  [(ngModel)]="fanLevel"
                  [disabled]="!fanEnabled"
                  [ngStyle]="{'--fill-pct': fanSliderFill}"/>
                <div class="fan-readout">
                  <span class="readout-big">{{ fanEnabled ? getRpm(fanLevel) + ' RPM' : 'Auto' }}</span>
                  <span class="readout-sub">{{ fanEnabled ? (getPercent(fanLevel) + '% · L' + fanLevel) : 'Thermal policy' }}</span>
                </div>
              </div>

              <button class="apply-btn" [disabled]="!fanEnabled" (click)="applyFan()">Apply Fan</button>
            </section>

          <!-- RIGHT: TDP + STRESS SHORTCUT stacked -->
            <aside class="right-col">

              <!-- CPU Power Limit -->
              <div class="card">
                <h2 class="section-title">CPU Power Limit</h2>
                <div class="tdp-section">
                  <div class="tdp-display-row">
                    <div class="tdp-mode-stack">
                      <span class="tdp-mode-badge">{{ cpuMode === 'bed' ? 'BED' : cpuMode.toUpperCase() }}</span>
                      <span class="tdp-mode-sub">Active Mode</span>
                    </div>
                    <span class="tdp-value">{{ cpuTdp }}W</span>
                  </div>
                  <input type="range" class="range-slider" id="tdp-slider"
                    min="8" max="55" step="1"
                    [(ngModel)]="cpuTdp"
                    [ngStyle]="{'--fill-pct': tdpSliderFill}"/>
                  <div class="tdp-range-labels">
                    <span>8W</span><span>55W</span>
                  </div>
                </div>
                <button class="apply-btn" (click)="applyCustomTdp()">Apply TDP</button>
              </div>

            </aside>

          </div>

          <!-- ── STRESS TEST DETAIL PAGE (nav rail shortcut) ── -->
          <div *ngIf="activePage === 'stress'" class="page-stress">
            <div class="page-title-row">
              <h2 class="section-title">Synthetic CPU Stress</h2>
              <span class="page-sub">FPU workload on all logical cores</span>
            </div>

            <div class="card stress-config-card">
              <div class="stress-row">
                <span class="field-label">Duration</span>
                <div class="seg-control">
                  <button *ngFor="let d of durationPresets" class="seg-btn"
                    [class.seg-btn--active]="stressSelectedDuration === d.value"
                    (click)="stressSelectedDuration = d.value; stressTotal = d.value">
                    {{ d.label }}
                  </button>
                </div>
              </div>
              <div class="stress-row">
                <span class="field-label">Intensity</span>
                <div class="seg-control">
                  <button *ngFor="let i of intensityPresets" class="seg-btn"
                    [class.seg-btn--active]="stressSelectedIntensity === i"
                    (click)="stressSelectedIntensity = i">
                    {{ i }}
                  </button>
                </div>
              </div>
              <button class="apply-btn" [class.apply-btn--stop]="stressActive" (click)="toggleStressTest()">
                {{ stressActive ? 'Stop Stress Test' : 'Start Stress Test' }}
              </button>
            </div>

            <div class="card thread-grid-card">
              <div class="thread-header">
                <span class="field-label">Core Burn Allocator</span>
                <span *ngIf="stressActive" class="thread-badge">● ACTIVE ({{ stressDuration }}s)</span>
              </div>
              <div class="thread-grid">
                <div *ngFor="let c of threadCores" class="thread-cell" [class.thread-cell--active]="stressActive">
                  <span class="thread-id">T{{ c }}</span>
                  <span class="thread-pct" [class.thread-pct--on]="stressActive">{{ stressActive ? '100%' : '0%' }}</span>
                </div>
              </div>
            </div>
          </div>

        </main>

        <!-- FOOTER -->
        <footer class="footer-strip">
          v0.1 &nbsp;·&nbsp; Made with passion by DhruvilGajjar
        </footer>

      </div><!-- /content-col -->

      <!-- TOASTER -->
      <div class="toaster">
        <div *ngFor="let toast of toasts" class="toast" [ngClass]="'toast--' + toast.type">
          <span class="toast-icon">
            <ng-container *ngIf="toast.type === 'success'">✓</ng-container>
            <ng-container *ngIf="toast.type === 'error'">⚠</ng-container>
            <ng-container *ngIf="toast.type === 'info'">ℹ</ng-container>
          </span>
          <span class="toast-msg">{{ toast.message }}</span>
        </div>
      </div>

    </div>
  `,
  styles: [`
    /* ─── RESET ─── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    button { font-family: inherit; cursor: pointer; }

    /* ─── ROOT SHELL: side-by-side nav + content ─── */
    .app-shell {
      display: flex;
      flex-direction: row;
      height: 100vh;
      overflow: hidden;
      background: #0f0f0f;
      color: #e0e0e0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
    }

    /* ─── NAV RAIL: fixed full height on left ─── */
    .nav-rail {
      width: 56px;
      min-width: 56px;
      height: 100vh;
      background: #0d0d0d;
      border-right: 1px solid #222;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px 0;
      gap: 4px;
      flex-shrink: 0;
      z-index: 10;
    }
    .brand-pill {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;
    }
    .brand-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #3b82f6;
    }
    .nav-btn {
      width: 40px;
      height: 44px;
      border-radius: 10px;
      border: none;
      background: transparent;
      color: #444;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      transition: background 150ms ease, color 150ms ease;
    }
    .nav-btn:hover { background: #161616; color: #aaa; }
    .nav-btn--active { background: #1a2a3a; color: #3b82f6; }
    .nav-btn--active:hover { background: #1e3040; }
    .nav-label { font-size: 9px; font-weight: 500; letter-spacing: 0.04em; text-transform: uppercase; }

    /* ─── CONTENT COLUMN: topbar + strips + viewport + footer ─── */
    .content-col {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
      overflow: hidden;
      position: relative;
    }
 
    /* ─── TOPBAR ─── */
    .topbar {
      height: 44px;
      min-height: 44px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      background: #0d0d0d;
      border-bottom: none;
      flex-shrink: 0;
      user-select: none;
    }
    .brand { display: flex; align-items: center; gap: 8px; }
    .brand-name { font-size: 13px; font-weight: 600; color: #e0e0e0; }
    .brand-sep { color: #333; font-size: 12px; }
    .brand-sub { font-size: 10px; color: #444; }
    .status-pill {
      padding: 4px 12px;
      border-radius: 8px;
      background: #1e1e1e;
      border: 1px solid #2a2a2a;
      font-size: 11px;
      color: #888;
    }
 
    /* ─── STRESS BANNER ─── */
    .stress-banner {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0 110px 0 16px;
      background: #171717;
      border: 1px solid #242424;
      border-radius: 10px;
      margin: 0 59px 0 16px;
      flex-shrink: 0;
      height: 0;
      overflow: hidden;
      opacity: 0;
      transition: height 280ms cubic-bezier(0.4,0,0.2,1), opacity 200ms ease, margin 280ms cubic-bezier(0.4,0,0.2,1);
    }
    .stress-banner--active { height: 38px; opacity: 1; margin: 8px 59px 8px 16px; }
    .stress-bar-track { flex: 1; height: 4px; background: #1e1e1e; border-radius: 9999px; overflow: hidden; }
    .stress-bar-fill { height: 100%; background: #3b82f6; border-radius: 9999px; transition: width 1s linear; }
    .stress-timer { font-size: 10px; color: #666; font-variant-numeric: tabular-nums; }
    .stress-stop-btn {
      padding: 3px 10px; background: #2a1a1a; border: 1px solid #3a1a1a;
      border-radius: 6px; color: #ef4444; font-size: 10px;
      transition: background 150ms;
    }
    .stress-stop-btn:hover { background: #3b1e1e; }
 
    /* ─── MONITOR STRIP ─── */
    .monitor-strip {
      display: flex;
      align-items: stretch;
      height: auto;
      min-height: auto;
      background: transparent;
      padding: 8px 59px 8px 16px;
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
    /* peak: 11px, bold, colour applied via [style.color] from metricColor() */
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
 
    /* ─── PROFILES DRAWER ─── */
    .profiles-drawer {
      background: #171717;
      border: 1px solid #242424;
      border-radius: 14px;
      margin: 0 59px 0 16px;
      flex-shrink: 0;
      max-height: 0;
      overflow: hidden;
      opacity: 0;
      transition: max-height 300ms cubic-bezier(0.4,0,0.2,1), opacity 200ms ease, margin 300ms cubic-bezier(0.4,0,0.2,1), padding 200ms ease;
    }
    .profiles-drawer--open {
      max-height: 130px;
      opacity: 1;
      margin: 8px 59px 8px 16px;
      padding: 4px 0;
      box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    }
    .drawer-header {
      display: flex;
      align-items: center;
      padding: 12px 16px 8px;
    }
    .drawer-title { font-size: 10px; font-weight: 600; color: #555; text-transform: uppercase; letter-spacing: 0.1em; }
    .drawer-cards {
      display: flex;
      gap: 8px;
      padding: 0 16px 12px;
      overflow-x: auto;
    }
    .drawer-cards::-webkit-scrollbar { display: none; }
    .drawer-card {
      flex-shrink: 0;
      width: 130px;
      background: #171717;
      border: 1px solid #242424;
      border-radius: 10px;
      padding: 10px 12px;
      cursor: pointer;
      transition: background 150ms, border-color 150ms;
    }
    .drawer-card:hover { background: #1e1e1e; border-color: #333; }
    .drawer-card--active {
      background: #141e2a;
      border-left: 2px solid #3b82f6;
      border-top-color: #1a3a5a;
      border-right-color: #1a3a5a;
      border-bottom-color: #1a3a5a;
      border-radius: 0 10px 10px 0;
    }
    /* Profile name: larger and clearly readable */
    .drawer-card-name { font-size: 13px; font-weight: 600; color: #ddd; }
    .drawer-card-spec { font-size: 10px; color: #555; text-transform: uppercase; margin-top: 3px; letter-spacing: 0.04em; }

    /* ─── BEZEL RIBBONS ─── */
    .bezel-wrap {
      position: absolute;
      right: 0;
      top: 44px;
      z-index: 40;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    /* Shared ribbon base */
    .ribbon {
      width: 84px;
      height: 52px;
      background: #111827;
      border: 1px solid #1e3a5f;
      border-right: none;
      border-left: 3px solid #2563eb;
      border-radius: 12px 0 0 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      cursor: pointer;
      pointer-events: auto;
      color: #4d90d6;
      transition: transform 200ms ease, background 150ms, border-color 150ms, color 150ms;
      user-select: none;
    }
    .ribbon:hover {
      transform: translateX(-5px);
      background: #152035;
      border-color: #3b82f6;
      border-left-color: #3b82f6;
      color: #7ab8f5;
    }
    /* Profiles: open/active state */
    .ribbon--open {
      background: #1a2e4a;
      border-color: #3b82f6;
      border-left-color: #3b82f6;
      color: #93c5fd;
      transform: translateX(-5px);
    }
    .ribbon--open:hover { background: #1e3550; color: #bfdbfe; }
    /* Stress ribbon: same shape, red accent */
    .ribbon--stress {
      border-color: #3a1220;
      border-left-color: #7f1d1d;
      color: #b45555;
    }
    .ribbon--stress:hover {
      background: #1a0a0a;
      border-color: #ef4444;
      border-left-color: #ef4444;
      color: #fca5a5;
      transform: translateX(-5px);
    }
    /* Stress active: pulsing red glow */
    .ribbon--stress-on {
      background: #1a0a0a;
      border-color: #ef4444;
      border-left-color: #ef4444;
      color: #fca5a5;
      transform: translateX(-5px);
      animation: stress-glow 1.6s infinite alternate;
    }
    @keyframes stress-glow {
      from { box-shadow: -3px 0 6px rgba(239,68,68,0.25); }
      to   { box-shadow: -3px 0 14px rgba(239,68,68,0.6); }
    }
    .ribbon-text { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; }

    /* ─── VIEWPORT: padding-right = 70% of bezel (84px) = ~59px so 30% of bezel peeks as chrome ─── */
    .viewport {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      padding: 16px 59px 16px 16px;
    }
    .viewport::-webkit-scrollbar { width: 4px; }
    .viewport::-webkit-scrollbar-track { background: transparent; }
    .viewport::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 9999px; }

    /* ─── QUICK PAGE LAYOUT ─── */
    /* align-items:stretch so both cards grow to the same height */
    .page-quick { display: flex; gap: 16px; align-items: stretch; }

    /* ─── SHARED CARD ─── */
    .card {
      background: #171717;
      border: 1px solid #242424;
      border-radius: 14px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .section-title { font-size: 13px; font-weight: 500; color: #bbb; }

    /* ─── FAN CARD: same flex share as right-col ─── */
    .fan-card { flex: 1; }

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
    .apply-btn--stop { background: #2a1a1a; border-color: #3a1a1a; color: #ef4444; }
    .apply-btn--stop:hover:not(:disabled) { background: #3b1e1e; }

    /* ─── FAN SVG ─── */
    .fan-icon-wrap { display: flex; justify-content: center; padding-top: 4px; }
    .fan-svg { display: block; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .fan-slow { animation: spin 2s linear infinite; transform-origin: 50% 50%; }
    .fan-mid  { animation: spin 0.8s linear infinite; transform-origin: 50% 50%; }
    .fan-fast { animation: spin 0.3s linear infinite; transform-origin: 50% 50%; }
    .fan-paused { animation-play-state: paused; }

    /* ─── RIGHT COLUMN: equal flex to fan card ─── */
    .right-col { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .right-col .card { flex: 1; }
    .tdp-section { display: flex; flex-direction: column; gap: 8px; }
    .tdp-display-row { display: flex; align-items: center; justify-content: space-between; }
    .tdp-mode-stack { display: flex; flex-direction: column; gap: 1px; }
    .tdp-mode-badge { font-size: 9px; font-weight: 600; color: #555; text-transform: uppercase; letter-spacing: 0.08em; }
    .tdp-mode-sub { font-size: 9px; color: #3a3a3a; font-style: italic; }
    .tdp-value { font-size: 26px; font-weight: 500; color: #e0e0e0; line-height: 1; }
    .tdp-range-labels { display: flex; justify-content: space-between; font-size: 9px; color: #444; }

    /* ─── STRESS PAGE ─── */
    .page-stress { display: flex; flex-direction: column; gap: 14px; }
    .page-title-row { display: flex; flex-direction: column; gap: 3px; }
    .page-sub { font-size: 10px; color: #555; }
    .stress-config-card { gap: 14px; }
    .stress-row { display: flex; flex-direction: column; gap: 6px; }
    .field-label { font-size: 10px; font-weight: 500; color: #666; text-transform: uppercase; letter-spacing: 0.06em; }
    .seg-control { display: flex; gap: 3px; background: #111; border: 1px solid #222; border-radius: 8px; padding: 2px; }
    .seg-btn {
      flex: 1; padding: 5px 0;
      background: transparent; border: 1px solid transparent;
      border-radius: 6px; color: #555; font-size: 11px; font-weight: 500;
      text-align: center; transition: background 150ms, color 150ms, border-color 150ms;
    }
    .seg-btn:hover { color: #999; }
    .seg-btn--active { background: #1a2a3a; border-color: #2a4a6a; color: #3b82f6; }
    /* Stress shortcut card on quick page */
    .stress-shortcut-card { border-color: #242424; }
    .stress-shortcut-card--active {
      border-color: #3a1a1a;
      background: #1a0f0f;
    }
    .stress-live-badge {
      font-size: 10px; font-weight: 600; color: #ef4444;
      animation: pulse-red 1.4s infinite alternate;
    }
    @keyframes pulse-red {
      from { opacity: 1; } to { opacity: 0.4; }
    }
    .stress-sc-progress { display: flex; align-items: center; gap: 10px; }
    .stress-sc-bar-track {
      flex: 1; height: 4px; background: #2a2a2a;
      border-radius: 9999px; overflow: hidden;
    }
    .stress-sc-bar-fill {
      height: 100%; background: #ef4444;
      border-radius: 9999px; transition: width 1s linear;
    }
    .stress-sc-timer { font-size: 11px; color: #888; font-variant-numeric: tabular-nums; flex-shrink: 0; }
    /* Thread grid card */
    .thread-grid-card { gap: 10px; }
    .thread-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #222; padding-bottom: 8px; }
    .thread-badge { font-size: 10px; color: #ef4444; font-weight: 500; }
    .thread-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
    .thread-cell {
      background: #1a1a1a; border: 1px solid #222; border-radius: 8px;
      padding: 8px; display: flex; flex-direction: column; align-items: center; gap: 3px;
      transition: background 300ms, border-color 300ms;
    }
    .thread-cell--active { background: #1a0f0f; border-color: #3a1a1a; }
    .thread-id { font-size: 9px; color: #444; font-weight: 600; }
    .thread-pct { font-size: 10px; color: #444; }
    .thread-pct--on { color: #ef4444; font-weight: 600; }

    /* ─── FOOTER ─── */
    .footer-strip {
      height: 24px; min-height: 24px;
      background: #0a0a0a; border-top: 1px solid #1a1a1a;
      display: flex; align-items: center; justify-content: center;
      font-size: 10px; color: #333; letter-spacing: 0.05em;
      flex-shrink: 0; user-select: none;
    }

    /* ─── TOASTER ─── */
    .toaster {
      position: fixed; bottom: 36px; left: 50%;
      transform: translateX(-50%);
      z-index: 1000; display: flex; flex-direction: column;
      gap: 8px; align-items: center; pointer-events: none;
    }
    @keyframes toast-in {
      from { opacity:0; transform: translateY(10px) scale(0.96); }
      to   { opacity:1; transform: translateY(0) scale(1); }
    }
    .toast {
      pointer-events: auto;
      display: flex; align-items: center; gap: 10px;
      background: rgba(22,22,24,0.94);
      border: 1px solid rgba(255,255,255,0.07);
      backdrop-filter: blur(16px);
      padding: 7px 18px; border-radius: 9999px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.5);
      animation: toast-in 0.3s cubic-bezier(0.34,1.56,0.64,1);
      white-space: nowrap;
    }
    .toast-icon {
      font-size: 11px; font-weight: 700;
      width: 16px; height: 16px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
    }
    .toast-msg { font-size: 12px; font-weight: 500; color: #e0e0e0; }
    .toast--success .toast-icon { background: rgba(34,197,94,0.15); color: #22c55e; }
    .toast--error   .toast-icon { background: rgba(239,68,68,0.15);  color: #ef4444; }
    .toast--info    .toast-icon { background: rgba(59,130,246,0.15); color: #3b82f6; }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  private ryzenService = inject(RyzenService);

  // Navigation
  activePage: 'quick' | 'stress' = 'quick';
  profilesOpen = false;

  // Fan state
  fanLevel = 30;
  fanEnabled = true;
  profileFan = 30;

  // Profile
  profileName = '';

  // CPU state
  cpuTdp = 35;
  cpuMode: 'performance' | 'balanced' | 'silent' | 'custom' | 'bed' = 'bed';
  cpuLimits: any = null;
  cpuErrorMsg = '';

  // Peak tracking for monitor strip
  peakFastPpt = 0;
  peakSlowPpt = 0;
  peakTemp = 0;
  peakStapm = 0;

  // Stress state
  stressActive = false;
  stressDuration = 0;
  stressTotal = 60;
  stressSelectedDuration = 60;
  stressSelectedIntensity = 'Heavy';
  private stressTimerInterval: any = null;

  // Toast
  toasts: { message: string; type: 'success' | 'error' | 'info'; id: number }[] = [];
  private toastIdCounter = 0;
  private pollInterval: any;

  readonly durationPresets = [
    { label: '30s',    value: 30   },
    { label: '1 min',  value: 60   },
    { label: '5 min',  value: 300  },
    { label: '10 min', value: 600  },
    { label: '30 min', value: 1800 }
  ];
  readonly intensityPresets = ['Light', 'Medium', 'Heavy', 'Maximum'];
  readonly threadCores = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16];

  profiles = [
    { name: 'battery',     powerLimit: 12, fan: 'silent',   fanLevel: 8,  fanLabel: 'Silent',  label: 'Battery Saver'   },
    { name: 'laptop',      powerLimit: 25, fan: 'balanced',  fanLevel: 30, fanLabel: 'Quiet',   label: 'Bed Mode'        },
    { name: 'table',       powerLimit: 35, fan: 'medium',    fanLevel: 30, fanLabel: 'Med',     label: 'Table Mode'      },
    { name: 'performance', powerLimit: 45, fan: 'high',      fanLevel: 34, fanLabel: 'High',    label: 'Performance'     },
    { name: 'extreme',     powerLimit: 55, fan: 'max',       fanLevel: 39, fanLabel: 'Max',     label: 'Extreme'         }
  ];

  // ── Getters ──

  get monitorMetrics() {
    return {
      fastPpt:      this.cpuLimits?.fast_limit  ?? 0,
      fastPptLimit: 55,
      slowPpt:      this.cpuLimits?.slow_limit  ?? 0,
      slowPptLimit: 55,
      temp:         this.cpuLimits?.tctl_temp   ?? 0,
      tempLimit:    90,
      stapm:        this.cpuLimits?.stapm_limit ?? 0
    };
  }

  get statusPillText(): string {
    const label = this.cpuMode === 'bed' ? 'Bed Mode' : this.cpuMode.toUpperCase();
    const temp = this.cpuLimits?.tctl_temp ? `${Math.round(this.cpuLimits.tctl_temp)}°C` : '--°C';
    return `${label} · ${this.cpuTdp}W · ${temp}`;
  }

  get stressPercent(): number {
    if (!this.stressTotal) return 0;
    return Math.min((this.stressDuration / this.stressTotal) * 100, 100);
  }

  get stressRemaining(): string {
    const r = Math.max(this.stressTotal - this.stressDuration, 0);
    const m = Math.floor(r / 60), s = r % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  }

  /** Position-based fill for fan slider (level 8–39) */
  get fanSliderFill(): string {
    return `${((this.fanLevel - 8) / 31) * 100}%`;
  }

  /** Position-based fill for TDP slider (8–55W) */
  get tdpSliderFill(): string {
    return `${((this.cpuTdp - 8) / 47) * 100}%`;
  }

  // ── Helpers ──

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

  resetPeaks() {
    this.peakFastPpt = 0;
    this.peakSlowPpt = 0;
    this.peakTemp = 0;
    this.peakStapm = 0;
  }

  // ── Lifecycle ──

  ngOnInit() {
    this.startCpuStatusPolling();
    this.checkStressStatus();
  }

  ngOnDestroy() {
    if (this.pollInterval)       clearInterval(this.pollInterval);
    if (this.stressTimerInterval) clearInterval(this.stressTimerInterval);
    if (this.stressActive)       this.ryzenService.stopCpuStress();
  }

  // ── Toast ──

  showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
    const id = this.toastIdCounter++;
    this.toasts.push({ message, type, id });
    setTimeout(() => { this.toasts = this.toasts.filter(t => t.id !== id); }, 4500);
  }

  // ── CPU polling ──

  startCpuStatusPolling() {
    this.pollCpuStatus();
    this.pollInterval = setInterval(() => { this.pollCpuStatus(); }, 2000);
  }

  async pollCpuStatus() {
    const res = await this.ryzenService.getStatus();
    if (res.success && res.data) {
      this.cpuLimits = res.data;
      this.cpuErrorMsg = '';
      // Update peak values
      if ((this.cpuLimits.fast_limit  ?? 0) > this.peakFastPpt) this.peakFastPpt = Math.round(this.cpuLimits.fast_limit);
      if ((this.cpuLimits.slow_limit  ?? 0) > this.peakSlowPpt) this.peakSlowPpt = Math.round(this.cpuLimits.slow_limit);
      if ((this.cpuLimits.tctl_temp   ?? 0) > this.peakTemp)    this.peakTemp    = Math.round(this.cpuLimits.tctl_temp);
      if ((this.cpuLimits.stapm_limit ?? 0) > this.peakStapm)   this.peakStapm   = Math.round(this.cpuLimits.stapm_limit);
    } else {
      this.cpuLimits = null;
      this.cpuErrorMsg = res.message || 'RyzenAdj requires Administrator privileges.';
    }
  }

  // ── CPU mode ──

  async applyCpuMode(mode: 'performance' | 'balanced' | 'silent' | 'bed') {
    this.cpuMode = mode;
    if (mode === 'performance')                    this.cpuTdp = 55;
    else if (mode === 'balanced' || mode === 'bed') this.cpuTdp = 35;
    else if (mode === 'silent')                    this.cpuTdp = 15;

    const res = await this.ryzenService.setMode(mode);
    if (res.success) {
      this.showToast(`CPU Mode → ${mode === 'bed' ? 'Bed Mode' : mode.toUpperCase()}`, 'success');
      this.pollCpuStatus();
    } else {
      this.showToast(res.message || 'Failed to set CPU mode.', 'error');
    }
  }

  async applyCustomTdp() {
    this.cpuMode = 'custom';
    if (this.cpuTdp < 8)  this.cpuTdp = 8;
    if (this.cpuTdp > 55) this.cpuTdp = 55;
    const res = await this.ryzenService.setTdp(this.cpuTdp);
    if (res.success) {
      this.showToast(`TDP limit set to ${this.cpuTdp}W`, 'success');
      this.pollCpuStatus();
    } else {
      this.showToast(res.message || 'Failed to set TDP.', 'error');
    }
  }

  // ── Fan ──

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

  async applyFan() {
    let level: string;
    if (this.fanEnabled) {
      const padded = String(this.fanLevel).padStart(2, '0');
      level = `${padded}:${padded}`;
    } else {
      level = '0:0';
    }
    try {
      const res = await invoke<string>('set_fan_mode', { mode: level });
      console.log(`[Fan] ${res}`);
      this.showToast(this.fanEnabled ? `Fan → ${this.getRpm(this.fanLevel)} RPM` : 'Fan → Auto', 'success');
    } catch (err) {
      this.showToast(`Failed to set fan: ${err}`, 'error');
    }
  }

  async toggleFanControl() {
    this.fanEnabled = !this.fanEnabled;
    await this.applyFan();
  }

  // ── Profiles ──

  selectProfile(name: string) {
    this.profileName = name;
    const p = this.profiles.find(item => item.name === name);
    if (p) {
      // Sync fan level from profile definition
      this.fanLevel = p.fanLevel;
    }
  }

  async applyProfile() {
    if (!this.profileName) { this.showToast('Please select a profile first.', 'error'); return; }
    try {
      const res = await invoke<string>('run_profile', { profile: this.profileName.toLowerCase() });
      console.log(`[Profile] ${res}`);
      this.showToast(`Profile '${this.profileName}' applied`, 'success');
    } catch (err) {
      this.showToast(`Failed to apply profile: ${err}`, 'error');
    }
  }

  async onSelectProfile(profileName: string) {
    if (profileName === 'custom') {
      this.profileName = 'custom';
      this.cpuMode = 'custom';
      this.showToast('Custom TDP ready — adjust and apply.', 'info');
      this.profilesOpen = false;
      return;
    }
    this.selectProfile(profileName);
    // Apply profile (CPU + system) and also sync fan speed
    await this.applyProfile();
    if (this.fanEnabled) {
      await this.applyFan();
    }
    this.profilesOpen = false;
  }

  // ── Stress ──

  async checkStressStatus() {
    const active = await this.ryzenService.getStressStatus();
    this.stressActive = active;
    if (active && !this.stressTimerInterval) {
      this.stressDuration = 0;
      this.stressTimerInterval = setInterval(() => {
        this.stressDuration++;
        if (this.stressDuration >= this.stressTotal) this.toggleStressTest();
      }, 1000);
    }
  }

  async toggleStressTest() {
    if (this.stressActive) {
      const active = await this.ryzenService.stopCpuStress();
      this.stressActive = active;
      if (this.stressTimerInterval) { clearInterval(this.stressTimerInterval); this.stressTimerInterval = null; }
      this.showToast('Stress test terminated.', 'info');
    } else {
      const active = await this.ryzenService.startCpuStress();
      this.stressActive = active;
      if (active) {
        this.stressDuration = 0;
        this.stressTimerInterval = setInterval(() => {
          this.stressDuration++;
          if (this.stressDuration >= this.stressTotal) this.toggleStressTest();
        }, 1000);
        this.showToast(`Stress test started — ${this.stressTotal}s at ${this.stressSelectedIntensity}`, 'success');
      } else {
        this.showToast('Failed to start stress test.', 'error');
      }
    }
  }
}