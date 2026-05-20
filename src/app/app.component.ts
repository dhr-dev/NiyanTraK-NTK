import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { invoke } from '@tauri-apps/api/core';
import { RyzenService } from './ryzen.service';

// Modular Component Imports
import { NavRailComponent } from './components/nav-rail/nav-rail.component';
import { TopBarComponent } from './components/top-bar/top-bar.component';
import { StressBannerComponent } from './components/stress-banner/stress-banner.component';
import { MonitorStripComponent } from './components/monitor-strip/monitor-strip.component';
import { ProfilesDrawerComponent } from './components/profiles-drawer/profiles-drawer.component';
import { BezelStripsComponent } from './components/bezel-strips/bezel-strips.component';
import { FanControlComponent } from './components/fan-control/fan-control.component';
import { CPUPowerPanelComponent } from './components/cpu-power-panel/cpu-power-panel.component';
import { StressPanelComponent } from './components/stress-panel/stress-panel.component';
import { FooterStripComponent } from './components/footer-strip/footer-strip.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NavRailComponent,
    TopBarComponent,
    StressBannerComponent,
    MonitorStripComponent,
    ProfilesDrawerComponent,
    BezelStripsComponent,
    FanControlComponent,
    CPUPowerPanelComponent,
    StressPanelComponent,
    FooterStripComponent
  ],
  template: `
    <div class="app-shell">

      <!-- LEFT: FULL-HEIGHT NAV RAIL -->
      <app-nav-rail [activePage]="activePage" (pageChange)="activePage = $event"></app-nav-rail>

      <!-- RIGHT: ALL CONTENT STACKED VERTICALLY -->
      <div class="content-col">

        <!-- TOP BAR -->
        <app-top-bar [statusText]="statusPillText"></app-top-bar>

        <div class="main-frame-body">
          <!-- STRESS BANNER -->
          <app-stress-banner
            [active]="stressActive"
            [percent]="stressPercent"
            [remaining]="stressRemaining"
            (stop)="toggleStressTest()"
          ></app-stress-banner>

          <!-- MONITOR STRIP -->
          <app-monitor-strip
            [metrics]="monitorMetrics"
            [peakFast]="peakFastPpt"
            [peakSlow]="peakSlowPpt"
            [peakTemp]="peakTemp"
            (reset)="resetPeaks()"
          ></app-monitor-strip>

          <!-- PROFILES DRAWER -->
          <app-profiles-drawer
            [open]="profilesOpen"
            [currentProfile]="profileName"
            [profiles]="profiles"
            (selectProfile)="onSelectProfile($event)"
          ></app-profiles-drawer>

          <!-- BEZEL RIBBONS: Profiles + Stress on right edge -->
          <app-bezel-strips
            [profilesOpen]="profilesOpen"
            [stressActive]="stressActive"
            (toggleProfiles)="profilesOpen = !profilesOpen"
            (toggleStress)="toggleStressTest()"
          ></app-bezel-strips>

          <!-- VIEWPORT: SCROLLABLE PAGES -->
          <main class="viewport">

            <!-- QUICK CONTROL PAGE -->
            <div *ngIf="activePage === 'quick'" class="page-quick">
              <!-- FAN CONTROL CARD -->
              <app-fan-control
                [enabled]="fanEnabled"
                [level]="fanLevel"
                (toggle)="toggleFanControl()"
                (levelChange)="fanLevel = $event"
                (apply)="applyFan()"
              ></app-fan-control>

              <!-- RIGHT COLUMN: CPU Power limit stacked -->
              <aside class="right-col">
                <app-cpu-power-panel
                  [mode]="cpuMode"
                  [tdp]="cpuTdp"
                  (tdpChange)="cpuTdp = $event"
                  (apply)="applyCustomTdp()"
                ></app-cpu-power-panel>
              </aside>
            </div>

            <!-- STRESS TEST DETAIL PAGE -->
            <app-stress-panel *ngIf="activePage === 'stress'"
              [stressActive]="stressActive"
              [stressDuration]="stressDuration"
              [stressTotal]="stressTotal"
              [stressSelectedDuration]="stressSelectedDuration"
              [stressSelectedIntensity]="stressSelectedIntensity"
              (selectDuration)="stressSelectedDuration = $event; stressTotal = $event"
              (selectIntensity)="stressSelectedIntensity = $event"
              (toggleStress)="toggleStressTest()"
            ></app-stress-panel>

          </main>

          <!-- FOOTER -->
          <app-footer-strip></app-footer-strip>
        </div>

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

    /* ─── CONTENT COLUMN: topbar + strips + viewport + footer ─── */
    .content-col {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
      overflow: hidden;
      position: relative;
      background: #0d0d0d;
    }

    /* ─── MAIN INNER FRAME PANEL ─── */
    .main-frame-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      background: #111111;
      border-top: 1px solid #222;
      border-left: 1px solid #222;
      border-top-left-radius: 14px;
      overflow: hidden;
      position: relative;
    }

    /* ─── VIEWPORT ─── */
    .viewport {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      padding: 8px 59px 16px 16px;
    }
    .viewport::-webkit-scrollbar { width: 4px; }
    .viewport::-webkit-scrollbar-track { background: transparent; }
    .viewport::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 9999px; }

    /* ─── QUICK PAGE LAYOUT ─── */
    .page-quick { display: flex; gap: 16px; align-items: stretch; }
    app-fan-control { flex: 1; display: flex; flex-direction: column; }

    /* ─── RIGHT COLUMN ─── */
    .right-col { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .right-col app-cpu-power-panel { flex: 1; display: flex; flex-direction: column; }

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