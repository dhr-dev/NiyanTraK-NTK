import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { invoke } from '@tauri-apps/api/core';
import { RyzenService } from './ryzen.service';
import { DEFAULT_PROFILES } from './presets.config';

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
import { SettingsPanelComponent } from './components/settings-panel/settings-panel.component';
import { WidgetComponent } from './components/widget/widget.component';

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
    FooterStripComponent,
    SettingsPanelComponent,
    WidgetComponent
  ],
  template: `
    <ng-container *ngIf="isWidget; else fullAppShell">
      <app-widget></app-widget>
    </ng-container>

    <ng-template #fullAppShell>
      <div class="app-shell">

        <!-- TOP BAR -->
        <app-top-bar 
          [statusText]="statusPillText"
          [activeProfileLabel]="activeProfileLabel"
          [activeToast]="activeToast"
          [cpuName]="cpuName"
        ></app-top-bar>

        <!-- MAIN CONTAINER -->
        <div class="main-container">

          <!-- LEFT: NAV RAIL -->
          <app-nav-rail [activePage]="activePage" (pageChange)="activePage = $event"></app-nav-rail>

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
              [dgpuBrand]="dgpuBrand"
              (reset)="resetPeaks()"
            ></app-monitor-strip>

            <!-- PROFILES DRAWER -->
            <app-profiles-drawer *ngIf="activePage === 'quick'"
              [open]="profilesOpen"
              [currentProfile]="profileName"
              [profiles]="profiles"
              (selectProfile)="onSelectProfile($event)"
              (savePreset)="saveCustomPreset($event)"
              (deletePreset)="deleteCustomPreset($event)"
              (togglePin)="togglePresetPin($event)"
            ></app-profiles-drawer>

            <!-- BEZEL RIBBONS: Profiles + Stress on right edge -->
            <app-bezel-strips
              [stressActive]="stressActive"
              (toggleStress)="toggleStressTest()"
              (toggleWidget)="toggleWidget()"
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
                    (tdpChange)="cpuTdp = $event; cpuMode = 'custom'; profileName = 'custom'"
                    [tempLimit]="cpuTempLimit"
                    (tempLimitChange)="cpuTempLimit = $event; cpuMode = 'custom'; profileName = 'custom'"
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

              <!-- SYSTEM SETTINGS PAGE -->
              <app-settings-panel *ngIf="activePage === 'settings'"></app-settings-panel>

            </main>

            <!-- FOOTER -->
            <app-footer-strip></app-footer-strip>
          </div>

        </div><!-- /main-container -->

      </div>
    </ng-template>
  `,
  styles: [`
    /* ─── RESET ─── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    button { font-family: inherit; cursor: pointer; }

    /* ─── ROOT SHELL: top bar + main container underneath ─── */
    .app-shell {
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
      background: #0f0f0f;
      color: #e0e0e0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
    }

    /* ─── MAIN CONTAINER: left rail + main frame body ─── */
    .main-container {
      display: flex;
      flex-direction: row;
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
      padding: 16px 59px 16px 16px;
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
  activePage: 'quick' | 'stress' | 'settings' = 'quick';
  isWidget = false;
  profilesOpen = true;
  cpuName = '';
  dgpuBrand = 'UNKNOWN';

  // Fan state
  fanLevel = 30;
  fanEnabled = true;
  profileFan = 30;

  // Profile
  profileName = '';

  // CPU state
  cpuTdp = 35;
  cpuTempLimit = 90;
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
  activeToast: any = null;
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

  profiles: any[] = [...DEFAULT_PROFILES.map(p => ({ ...p }))];

  // ── Getters ──

  get monitorMetrics() {
    const limits = this.cpuLimits;
    return {
      fastPpt:      limits?.fast_value ?? 0,
      fastPptLimit: limits?.fast_limit ?? 0,
      slowPpt:      limits?.slow_value ?? 0,
      slowPptLimit: limits?.slow_limit ?? 0,
      slowTime:     limits?.slow_time ?? 0,
      temp:         limits?.tctl_value ?? 0,
      tempLimit:    limits?.tctl_limit ?? 0,
      stapm:        limits?.stapm_value ?? 0,
      stapmLimit:   limits?.stapm_limit ?? 0,
      stapmTime:    limits?.stapm_time ?? 0,
      apuSkin:      limits?.apu_skin_value ?? 0,
      apuSkinLimit: limits?.apu_skin_limit ?? 0,
      dgpuSkin:     limits?.dgpu_skin_value ?? 0,
      dgpuSkinLimit: limits?.dgpu_skin_limit ?? 0
    };
  }

  get statusPillText(): string {
    const label = this.cpuMode === 'bed' ? 'Bed Mode' : this.cpuMode.toUpperCase();
    const temp = this.cpuLimits?.tctl_value ? `${Math.round(this.cpuLimits.tctl_value)}°C` : '--°C';
    return `${label} · ${this.cpuTdp}W · ${temp}`;
  }

  get activeProfileLabel(): string {
    const p = this.profiles.find(item => item.name === this.profileName);
    if (p) return p.label;
    if (this.profileName === 'custom') return 'Custom';
    return 'Manual';
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

  async ngOnInit() {
    const urlParams = new URLSearchParams(window.location.search);
    this.isWidget = urlParams.get('window') === 'widget';
    
    if (this.isWidget) {
      return;
    }

    this.startCpuStatusPolling();
    this.checkStressStatus();
    await this.loadPresets();
    await this.syncMinimizeToTray();
  }

  async syncMinimizeToTray() {
    try {
      const stored = localStorage.getItem('niyantrak_settings');
      if (stored) {
        const settings = JSON.parse(stored);
        if (settings.minimizeToTray !== undefined) {
          await invoke('set_minimize_to_tray', { enabled: settings.minimizeToTray });
        }
      }
    } catch (e) {
      console.error('Failed to sync minimize to tray on startup', e);
    }
  }

  ngOnDestroy() {
    if (this.pollInterval)       clearInterval(this.pollInterval);
    if (this.stressTimerInterval) clearInterval(this.stressTimerInterval);
    if (this.stressActive)       this.ryzenService.stopCpuStress();
  }

  // ── Toast ──

  showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
    const id = this.toastIdCounter++;
    const toast = { message, type, id };
    this.toasts.push(toast);
    this.activeToast = toast;
    setTimeout(() => {
      this.toasts = this.toasts.filter(t => t.id !== id);
      if (this.activeToast?.id === id) {
        this.activeToast = null;
      }
    }, 4500);
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
      if (res.data.cpu_name !== undefined && res.data.cpu_name !== null) {
        this.cpuName = res.data.cpu_name;
      }
      if (res.data.dgpu_brand !== undefined && res.data.dgpu_brand !== null) {
        this.dgpuBrand = res.data.dgpu_brand;
      }
      // Update peak values from real-time sensors with explicit null guards
      if (this.cpuLimits.fast_value !== undefined && this.cpuLimits.fast_value !== null && this.cpuLimits.fast_value > this.peakFastPpt) {
        this.peakFastPpt = Math.round(this.cpuLimits.fast_value);
      }
      if (this.cpuLimits.slow_value !== undefined && this.cpuLimits.slow_value !== null && this.cpuLimits.slow_value > this.peakSlowPpt) {
        this.peakSlowPpt = Math.round(this.cpuLimits.slow_value);
      }
      if (this.cpuLimits.tctl_value !== undefined && this.cpuLimits.tctl_value !== null && this.cpuLimits.tctl_value > this.peakTemp) {
        this.peakTemp = Math.round(this.cpuLimits.tctl_value);
      }
      if (this.cpuLimits.stapm_value !== undefined && this.cpuLimits.stapm_value !== null && this.cpuLimits.stapm_value > this.peakStapm) {
        this.peakStapm = Math.round(this.cpuLimits.stapm_value);
      }
      // Sync tempLimit from active core throttle target only if not in custom mode
      if (this.cpuMode !== 'custom' && this.cpuLimits.tctl_limit !== undefined && this.cpuLimits.tctl_limit !== null && this.cpuLimits.tctl_limit >= 50) {
        this.cpuTempLimit = Math.round(this.cpuLimits.tctl_limit);
      }
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
    if (this.cpuTempLimit < 50) this.cpuTempLimit = 50;
    if (this.cpuTempLimit > 95) this.cpuTempLimit = 95;
    const res = await this.ryzenService.setTdp(this.cpuTdp, this.cpuTempLimit);
    if (res.success) {
      this.showToast(`Limits set: TDP ${this.cpuTdp}W · Temp ${this.cpuTempLimit}°C`, 'success');
      this.pollCpuStatus();
    } else {
      this.showToast(res.message || 'Failed to set limits.', 'error');
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

  async loadPresets() {
    try {
      const dataStr = await this.ryzenService.loadCustomPresets();
      const custom = JSON.parse(dataStr || '[]');
      
      const standardPinsStr = localStorage.getItem('pinned_standard_presets');
      const standardPins = JSON.parse(standardPinsStr || '[]');

      this.profiles = [...DEFAULT_PROFILES.map(p => ({ ...p }))];

      for (const p of this.profiles) {
        if (standardPins.includes(p.name)) {
          p.isPinned = true;
        }
      }

      if (Array.isArray(custom)) {
        for (const p of custom) {
          this.profiles.push(p);
        }
      }
    } catch (err) {
      console.error('Failed to load custom presets', err);
    }
  }

  async saveCustomPreset(name: string) {
    if (!name) return;
    const trimmed = name.trim();
    if (!trimmed) return;

    const existingIndex = this.profiles.findIndex(p => p.label.toLowerCase() === trimmed.toLowerCase() && p.isCustom);
    
    let presetObj: any;
    if (existingIndex !== -1) {
      presetObj = this.profiles[existingIndex];
      presetObj.powerLimit = this.cpuTdp;
      presetObj.fanLevel = this.fanLevel;
      presetObj.fanLabel = `${this.getRpm(this.fanLevel)} RPM`;
      presetObj.tempLimit = this.cpuTempLimit;
    } else {
      const id = 'custom_' + Date.now();
      presetObj = {
        name: id,
        powerLimit: this.cpuTdp,
        fan: 'manual',
        fanLevel: this.fanLevel,
        fanLabel: `${this.getRpm(this.fanLevel)} RPM`,
        label: trimmed,
        isCustom: true,
        tempLimit: this.cpuTempLimit
      };
      this.profiles.push(presetObj);
    }

    const customOnly = this.profiles.filter(p => p.isCustom);
    try {
      await this.ryzenService.saveCustomPresets(JSON.stringify(customOnly));
      this.showToast(`Preset '${trimmed}' saved successfully!`, 'success');
      this.profileName = presetObj.name;
    } catch (err) {
      this.showToast(`Failed to save preset: ${err}`, 'error');
    }
  }

  async deleteCustomPreset(name: string) {
    const p = this.profiles.find(item => item.name === name);
    if (!p) return;
    const confirmDelete = confirm(`Are you sure you want to delete the custom preset '${p.label}'?`);
    if (!confirmDelete) return;

    this.profiles = this.profiles.filter(item => item.name !== name);
    if (this.profileName === name) {
      this.profileName = '';
      this.cpuMode = 'custom';
    }

    const customOnly = this.profiles.filter(p => p.isCustom);
    try {
      await this.ryzenService.saveCustomPresets(JSON.stringify(customOnly));
      this.showToast(`Preset '${p.label}' deleted successfully!`, 'info');
      try {
        const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow');
        const widgetWin = await WebviewWindow.getByLabel('widget');
        if (widgetWin) {
          await widgetWin.emit('profiles_changed');
        }
      } catch (e) {
        console.error(e);
      }
    } catch (err) {
      this.showToast(`Failed to delete preset: ${err}`, 'error');
    }
  }

  async togglePresetPin(name: string) {
    const p = this.profiles.find(item => item.name === name);
    if (!p) return;
    p.isPinned = !p.isPinned;
    
    const standardPins = this.profiles.filter(item => !item.isCustom && item.isPinned).map(item => item.name);
    localStorage.setItem('pinned_standard_presets', JSON.stringify(standardPins));

    const customOnly = this.profiles.filter(p => p.isCustom);
    try {
      await this.ryzenService.saveCustomPresets(JSON.stringify(customOnly));
      this.showToast(p.isPinned ? `Preset '${p.label}' pinned to widget` : `Preset '${p.label}' unpinned from widget`, 'success');
      try {
        const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow');
        const widgetWin = await WebviewWindow.getByLabel('widget');
        if (widgetWin) {
          await widgetWin.emit('profiles_changed');
        }
      } catch (e) {
        console.error(e);
      }
    } catch (err) {
      this.showToast(`Failed to update preset pin: ${err}`, 'error');
    }
  }

  async onSelectProfile(profileName: string) {
    if (profileName === 'custom') {
      this.profileName = 'custom';
      this.cpuMode = 'custom';
      this.showToast('Custom TDP ready — adjust and apply.', 'info');
      return;
    }
    
    const p = this.profiles.find(item => item.name === profileName);
    if (p) {
      this.profileName = p.name;
      this.cpuTdp = p.powerLimit;
      this.fanLevel = p.fanLevel;
      
      if (p.tempLimit !== undefined && p.tempLimit !== null) {
        this.cpuTempLimit = p.tempLimit;
      } else {
        if (p.name === 'performance' || p.name === 'extreme') {
          this.cpuTempLimit = 90;
        } else if (p.name === 'table' || p.name === 'laptop') {
          this.cpuTempLimit = 80;
        } else {
          this.cpuTempLimit = 70;
        }
      }
      
      this.cpuMode = (p.isCustom ? 'custom' : p.name) as any;
      
      const res = await this.ryzenService.setTdp(this.cpuTdp, this.cpuTempLimit);
      if (res.success) {
        this.showToast(`Profile '${p.label}' applied (TDP: ${this.cpuTdp}W, Temp: ${this.cpuTempLimit}°C)`, 'success');
      } else {
        this.showToast(res.message || 'Failed to apply profile TDP.', 'error');
      }

      if (this.fanEnabled) {
        await this.applyFan();
      }
    }
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

  async toggleWidget() {
    try {
      const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow');
      const label = 'widget';
      const widgetWin = await WebviewWindow.getByLabel(label);
      if (widgetWin) {
        await widgetWin.close();
      } else {
        // Load settings to calculate height
        let height = 188; // Default fully loaded height
        try {
          const stored = localStorage.getItem('niyantrak_settings');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.widget) {
              height = 32; // Header
              if (parsed.widget.showTemp) height += 48;
              if (parsed.widget.showTdp) height += 36;
              if (parsed.widget.showFan) height += 36;
              if (parsed.widget.showProfiles) height += 36;
            }
          }
        } catch (e) {
          console.error(e);
        }

        const isDev = window.location.port !== '';
        const url = isDev ? '?window=widget' : 'index.html?window=widget';
        await new WebviewWindow(label, {
          url: url,
          width: 210,
          height: height,
          decorations: false,
          alwaysOnTop: true,
          resizable: false,
          transparent: true,
          skipTaskbar: true
        });
      }
    } catch (e) {
      console.error('Failed to toggle widget window', e);
    }
  }
}