import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { LogicalSize } from '@tauri-apps/api/dpi';
import { RyzenService } from '../../ryzen.service';
import DEFAULT_PROFILES from '../../config/presets.json';

export interface WidgetSettings {
  showTemp: boolean;
  showTdp: boolean;
  showFan: boolean;
  showProfiles: boolean;
}

@Component({
  selector: 'app-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="widget-shell" [class.glassy]="true">
      
      <!-- HEADER (32px) -->
      <header class="widget-header" (mousedown)="startDrag($event)">
        <div class="header-drag-zone">
          <span class="widget-title-text">NiyanTraK</span>
        </div>
        <div class="header-controls" (mousedown)="$event.stopPropagation()">
          <button class="icon-btn pin-btn" [class.active]="isAlwaysOnTop" (click)="toggleAlwaysOnTop()" title="Pin Widget (Always on Top)">
            📌
          </button>
          <button class="icon-btn close-btn" (click)="closeWidget()" title="Close Widget">
            ×
          </button>
        </div>
      </header>

      <!-- TEMPERATURE RINGS (54px) -->
      <div *ngIf="settings.showTemp" class="widget-panel panel-temp">
        <div class="rings-row">
          <!-- CPU Ring -->
          <div class="ring-container" title="CPU Core Temperature">
            <svg class="ring-svg" viewBox="0 0 36 36">
              <path class="ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path class="ring-fill" [style.stroke]="getTempColor(cpuTemp, tempLimit)" [style.strokeDasharray]="getStrokeDash(cpuTemp, tempLimit)" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <div class="ring-value-box">
              <span class="ring-val">{{ cpuTemp ? cpuTemp : '--' }}</span>
              <span class="ring-lbl">CPU</span>
            </div>
          </div>

          <!-- Skin Ring -->
          <div class="ring-container" title="Chassis Skin Temperature">
            <svg class="ring-svg" viewBox="0 0 36 36">
              <path class="ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path class="ring-fill" [style.stroke]="getTempColor(skinTemp, 85)" [style.strokeDasharray]="getStrokeDash(skinTemp, 85)" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <div class="ring-value-box">
              <span class="ring-val">{{ skinTemp ? skinTemp : '--' }}</span>
              <span class="ring-lbl">SKIN</span>
            </div>
          </div>

          <!-- Limit Text -->
          <div class="limit-status">
            <span class="limit-label">Limit</span>
            <span class="limit-val">{{ tempLimit ? tempLimit : '--' }}°C</span>
          </div>
        </div>
        <button class="panel-remove-btn" (click)="hidePanel('showTemp')" title="Hide Temperature Panel">-</button>
      </div>

      <!-- TDP SELECTOR ROW (36px) -->
      <div *ngIf="settings.showTdp" class="widget-panel panel-tdp">
        <div class="row-layout">
          <div class="row-label">
            <span class="row-title">TDP</span>
            <span class="row-desc">{{ cpuTdp }}W / {{ maxTdp }}W</span>
          </div>
          <div class="radio-selectors">
            <button *ngFor="let stage of tdpStages" class="radio-point" [class.checked]="activeTdpStage === stage" (click)="setTdpStage(stage)" [title]="stage + 'W TDP Limit'">
              {{ stage }}
            </button>
          </div>
        </div>
        <button class="panel-remove-btn" (click)="hidePanel('showTdp')" title="Hide TDP Panel">-</button>
      </div>

      <!-- FAN SPEED ROW (36px) -->
      <div *ngIf="settings.showFan" class="widget-panel panel-fan">
        <div class="row-layout">
          <div class="row-label">
            <span class="row-title">FAN</span>
            <span class="row-desc">{{ fanRpm ? fanRpm + ' RPM' : 'Auto' }}</span>
          </div>
          <div class="radio-selectors">
            <button *ngFor="let point of fanPoints" class="radio-point" [class.checked]="activeFanPoint === point.id" (click)="setFanPoint(point.id)" [title]="point.label">
              {{ point.short }}
            </button>
          </div>
        </div>
        <button class="panel-remove-btn" (click)="hidePanel('showFan')" title="Hide Fan Panel">-</button>
      </div>

      <!-- PINNED PROFILES ROW (36px) -->
      <div *ngIf="settings.showProfiles && pinnedProfiles.length > 0" class="widget-panel panel-profiles">
        <div class="profiles-strip">
          <button *ngFor="let p of pinnedProfiles.slice(0, 3)" class="profile-chip" [class.active]="activeProfile === p.name" (click)="applyProfile(p)" [title]="'Apply Profile: ' + p.label">
            {{ p.label }}
          </button>
        </div>
        <button class="panel-remove-btn" (click)="hidePanel('showProfiles')" title="Hide Profiles Panel">-</button>
      </div>

    </div>
  `,
  styles: [`
    ::ng-deep html, ::ng-deep body {
      overflow: hidden !important;
      background: transparent !important;
      margin: 0 !important;
      padding: 0 !important;
      height: 100% !important;
      width: 100% !important;
    }

    .widget-shell {
      width: 210px;
      display: flex;
      flex-direction: column;
      background: rgba(13, 15, 20, 0.94);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      overflow: hidden;
      font-family: 'Inter', -apple-system, sans-serif;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.04);
      user-select: none;
    }
    .glassy {
      backdrop-filter: blur(20px);
    }

    /* HEADER */
    .widget-header {
      height: 32px;
      min-height: 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 10px;
      background: rgba(0, 0, 0, 0.2);
      border-bottom: 1px solid rgba(255, 255, 255, 0.03);
      cursor: move;
    }
    .header-drag-zone {
      flex: 1;
      height: 100%;
      display: flex;
      align-items: center;
    }
    .widget-title-text {
      font-size: 10px;
      font-weight: 700;
      color: #888888;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .header-controls {
      display: flex;
      align-items: center;
      gap: 6px;
      z-index: 10;
    }
    .icon-btn {
      background: transparent;
      border: none;
      color: #666666;
      font-size: 11px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border-radius: 4px;
      transition: all 120ms ease;
      padding: 0;
      line-height: 1;
    }
    .icon-btn:hover {
      background: rgba(255, 255, 255, 0.05);
      color: #ffffff;
    }
    .pin-btn {
      font-size: 10px;
      opacity: 0.5;
      border: 1px solid transparent;
      transition: all 150ms ease;
    }
    .pin-btn.active {
      opacity: 1;
      color: #3b82f6;
      background: rgba(59, 130, 246, 0.15) !important;
      border: 1px solid rgba(59, 130, 246, 0.3) !important;
      box-shadow: 0 0 8px rgba(59, 130, 246, 0.2);
    }
    .close-btn {
      font-size: 14px;
      font-weight: 500;
    }
    .close-btn:hover {
      background: rgba(239, 68, 68, 0.15);
      color: #ef4444;
    }

    /* PANELS */
    .widget-panel {
      position: relative;
      border-bottom: 1px solid rgba(255, 255, 255, 0.03);
      padding: 0 10px;
      display: flex;
      align-items: center;
      background: transparent;
    }
    .widget-panel:last-child {
      border-bottom: none;
    }
    .panel-remove-btn {
      position: absolute;
      top: 4px;
      right: 4px;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #777777;
      font-size: 11px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      opacity: 0;
      pointer-events: auto;
      transition: all 150ms ease;
      z-index: 20;
      padding: 0;
      line-height: 1;
    }
    .widget-panel:hover .panel-remove-btn {
      opacity: 1;
    }
    .panel-remove-btn:hover {
      background: rgba(239, 68, 68, 0.15);
      border-color: rgba(239, 68, 68, 0.3);
      color: #ef4444;
      box-shadow: 0 0 6px rgba(239, 68, 68, 0.2);
      transform: scale(1.05);
    }

    /* TEMPERATURE SECTION (48px) */
    .panel-temp {
      height: 48px;
    }
    .rings-row {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
    }
    .ring-container {
      position: relative;
      width: 32px;
      height: 32px;
    }
    .ring-svg {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }
    .ring-bg {
      fill: none;
      stroke: rgba(255, 255, 255, 0.04);
      stroke-width: 2.8;
    }
    .ring-fill {
      fill: none;
      stroke-width: 2.8;
      stroke-linecap: round;
      transition: stroke-dasharray 0.3s ease, stroke 0.3s ease;
    }
    .ring-value-box {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .ring-val {
      font-size: 10px;
      font-weight: 400 !important;
      color: #ffffff;
      line-height: 1;
    }
    .ring-lbl {
      font-size: 6px;
      font-weight: 400 !important;
      color: #555555;
      letter-spacing: 0.05em;
      margin-top: 1px;
    }
    .limit-status {
      display: flex;
      flex-direction: column;
      gap: 1px;
      margin-left: auto;
    }
    .limit-label {
      font-size: 8px;
      color: #555555;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .limit-val {
      font-size: 10.5px;
      font-weight: 600;
      color: #999999;
    }

    /* TDP & FAN ROWS (36px) */
    .panel-tdp, .panel-fan {
      height: 36px;
    }
    .row-layout {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }
    .row-label {
      display: flex;
      flex-direction: column;
      gap: 0px;
    }
    .row-title {
      font-size: 9px;
      font-weight: 700;
      color: #444444;
      letter-spacing: 0.05em;
      line-height: 1;
    }
    .row-desc {
      font-size: 10px;
      font-weight: 600;
      color: #cccccc;
      margin-top: 2px;
      line-height: 1;
    }

    /* BORDERLESS RADIO SELECTORS */
    .radio-selectors {
      display: flex;
      flex: 1;
      background: rgba(0, 0, 0, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.02);
      border-radius: 6px;
      padding: 2px;
      gap: 2px;
      margin-left: 10px;
    }
    .radio-point {
      flex: 1;
      background: transparent;
      border: none;
      color: #555555;
      font-size: 11px;
      font-weight: 700;
      padding: 6px 0;
      border-radius: 4px;
      cursor: pointer;
      transition: all 120ms ease;
      line-height: 1;
      text-align: center;
    }
    .radio-point:hover {
      color: #aaaaaa;
    }
    .radio-point.checked {
      background: rgba(59, 130, 246, 0.12);
      color: #3b82f6;
      text-shadow: 0 0 6px rgba(59, 130, 246, 0.4);
    }

    /* PINNED PROFILES ROW (36px) */
    .panel-profiles {
      height: 36px;
    }
    .profiles-strip {
      display: flex;
      gap: 6px;
      width: 100%;
      padding: 2px 0;
    }
    .profile-chip {
      flex: 1;
      min-width: 0;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.03);
      border-radius: 6px;
      color: #888888;
      font-size: 9.5px;
      font-weight: 600;
      padding: 4.5px 4px;
      cursor: pointer;
      text-align: center;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
      transition: all 150ms ease;
    }
    .profile-chip:hover {
      background: rgba(255, 255, 255, 0.05);
      color: #cccccc;
    }
    .profile-chip.active {
      background: #1a2a3a;
      border-color: rgba(59, 130, 246, 0.25);
      color: #3b82f6;
    }
  `]
})
export class WidgetComponent implements OnInit, OnDestroy {
  private ryzenService = inject(RyzenService);

  // Configuration
  settings: WidgetSettings = {
    showTemp: true,
    showTdp: true,
    showFan: true,
    showProfiles: true
  };

  isAlwaysOnTop = true;
  pollInterval: any = null;

  // Real-time telemetry values
  cpuTemp = 0;
  skinTemp = 0;
  tempLimit = 90;
  cpuTdp = 35;
  maxTdp = 45;
  fanRpm = 0;
  activeProfile = '';

  // Selector definitions
  readonly tdpStages = [12, 25, 35, 45];
  readonly fanPoints = [
    { id: 'auto', label: 'Auto Speed Mode', short: 'A' },
    { id: 'quiet', label: 'Quiet Profile (Silent)', short: 'Q' },
    { id: 'med', label: 'Medium Performance Profile', short: 'M' },
    { id: 'max', label: 'Maximum Turbo Mode', short: 'X' }
  ];

  pinnedProfiles: any[] = [];
  activeTdpStage = 35;
  activeFanPoint = 'auto';

  async ngOnInit() {
    await this.loadLayoutSettings();
    await this.loadPinnedProfiles();
    this.startPolling();
    this.setupTauriListeners();
    this.applyAlwaysOnTopState();
  }

  ngOnDestroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  async loadLayoutSettings() {
    try {
      const config = await invoke<any>('get_app_config');
      if (config && config.widget) {
        this.settings = config.widget;
      }
      this.resizeWindow();
    } catch (e) {
      console.error('Failed to load widget layout settings', e);
    }
  }

  async setupTauriListeners() {
    try {
      const win = getCurrentWebviewWindow();
      // Listen to layout changes emitted by the Settings Panel
      await win.listen<WidgetSettings>('layout_changed', (event) => {
        this.settings = event.payload;
        this.resizeWindow();
      });
      // Listen to profile/pin updates emitted by the main window
      await win.listen('profiles_changed', async () => {
        await this.loadPinnedProfiles();
      });
    } catch (e) {
      console.error('Failed to set up Tauri event listeners', e);
    }
  }

  async resizeWindow() {
    try {
      const win = getCurrentWebviewWindow();
      let height = 32; // Header height
      if (this.settings.showTemp) height += 48;
      if (this.settings.showTdp) height += 36;
      if (this.settings.showFan) height += 36;
      if (this.settings.showProfiles && this.pinnedProfiles.length > 0) height += 36;

      await win.setSize(new LogicalSize(210, height));
    } catch (e) {
      console.error('Failed to resize widget window', e);
    }
  }

  async loadPinnedProfiles() {
    try {
      const dataStr = await this.ryzenService.loadCustomPresets();
      const custom = JSON.parse(dataStr || '[]');
      
      const standardPinsStr = localStorage.getItem('pinned_standard_presets');
      const standardPins = JSON.parse(standardPinsStr || '[]');

      const pinnedCustom = Array.isArray(custom) ? custom.filter((p: any) => p.isPinned) : [];
      
      const defaultProfiles = [...DEFAULT_PROFILES.map(p => ({ ...p }))];
      
      const pinnedStandard = defaultProfiles.filter((p: any) => standardPins.includes(p.name));
      const allPinned = [...pinnedStandard, ...pinnedCustom];

      if (allPinned.length > 0) {
        this.pinnedProfiles = allPinned;
      } else {
        // Fallback to Battery, Table, Perf
        this.pinnedProfiles = [
          { name: 'battery', powerLimit: 12, fanLevel: 8, label: 'Battery' },
          { name: 'table', powerLimit: 35, fanLevel: 30, label: 'Table' },
          { name: 'performance', powerLimit: 45, fanLevel: 34, label: 'Perf' }
        ];
      }
      this.resizeWindow();
    } catch (e) {
      console.error('Failed to load pinned profiles', e);
      this.pinnedProfiles = [
        { name: 'battery', powerLimit: 12, fanLevel: 8, label: 'Battery' },
        { name: 'table', powerLimit: 35, fanLevel: 30, label: 'Table' },
        { name: 'performance', powerLimit: 45, fanLevel: 34, label: 'Perf' }
      ];
      this.resizeWindow();
    }
  }

  startPolling() {
    this.pollStatus();
    this.pollInterval = setInterval(() => {
      this.pollStatus();
    }, 1500); // Poll every 1.5s for snappy real-time feedback
  }

  async pollStatus() {
    try {
      const res = await this.ryzenService.getStatus();
      if (res.success && res.data) {
        const limits = res.data;
        this.cpuTemp = Math.round(limits.tctl_value ?? 0);
        this.skinTemp = Math.round(limits.apu_skin_value ?? 0);
        this.tempLimit = Math.round(limits.tctl_limit ?? 90);
        this.cpuTdp = Math.round(limits.fast_value ?? 35);
        this.maxTdp = Math.round(limits.fast_limit ?? 45);

        // Find nearest TDP stage checkbox
        let closest = this.tdpStages[0];
        let minDiff = Math.abs(this.maxTdp - closest);
        for (const stage of this.tdpStages) {
          const diff = Math.abs(this.maxTdp - stage);
          if (diff < minDiff) {
            minDiff = diff;
            closest = stage;
          }
        }
        this.activeTdpStage = closest;
      }
    } catch (e) {
      console.error('Failed to poll status in widget', e);
    }
  }

  // TDP Radio changer
  async setTdpStage(stage: number) {
    this.activeTdpStage = stage;
    try {
      await this.ryzenService.setTdp(stage, this.tempLimit);
      this.pollStatus();
    } catch (e) {
      console.error('Failed to change TDP stage in widget', e);
    }
  }

  // Fan Radio Changer
  async setFanPoint(id: string) {
    this.activeFanPoint = id;
    let level = '0:0';
    this.fanRpm = 0;
    
    if (id === 'quiet') {
      level = '08:08';
      this.fanRpm = 800;
    } else if (id === 'med') {
      level = '30:30';
      this.fanRpm = 4800;
    } else if (id === 'max') {
      level = '39:39';
      this.fanRpm = 5700;
    }

    try {
      await invoke('set_fan_mode', { mode: level });
    } catch (e) {
      console.error('Failed to set fan mode in widget', e);
    }
  }

  async applyProfile(profile: any) {
    this.activeProfile = profile.name;
    this.activeTdpStage = profile.powerLimit;
    
    // Apply TDP
    try {
      await this.ryzenService.setTdp(profile.powerLimit, 90);
      
      // Apply Fan level corresponding to preset
      const padded = String(profile.fanLevel).padStart(2, '0');
      const level = `${padded}:${padded}`;
      await invoke('set_fan_mode', { mode: level });
      
      this.pollStatus();
    } catch (e) {
      console.error('Failed to apply profile inside widget', e);
    }
  }

  // Ring styling helper
  getStrokeDash(value: number, limit: number): string {
    const clampedLimit = limit > 0 ? limit : 90;
    const pct = Math.min((value / clampedLimit) * 100, 100);
    const strokeLength = 2 * Math.PI * 15.9155; // 100
    return `${(pct / 100) * strokeLength} ${strokeLength}`;
  }

  getTempColor(value: number, limit: number): string {
    const clampedLimit = limit > 0 ? limit : 90;
    const pct = (value / clampedLimit) * 100;
    if (pct < 70) return '#22c55e'; // Green
    if (pct < 85) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  }

  // Windows management
  async startDrag(event: MouseEvent) {
    if (event.button === 0) { // Left click only
      try {
        const win = getCurrentWebviewWindow();
        await win.startDragging();
      } catch (e) {
        console.error('Failed to start dragging window', e);
      }
    }
  }
  async hidePanel(panelKey: keyof WidgetSettings) {
    this.settings[panelKey] = false;
    try {
      const config = await invoke<any>('get_app_config');
      const mergedConfig = {
        ...config,
        widget: this.settings
      };
      await invoke('save_app_config', { config: mergedConfig });
      
      const win = getCurrentWebviewWindow();
      await win.emit('layout_changed', this.settings);
    } catch (e) {
      console.error('Failed to save layout settings on panel hide', e);
    }
    this.resizeWindow();
  }

  async toggleAlwaysOnTop() {
    this.isAlwaysOnTop = !this.isAlwaysOnTop;
    this.applyAlwaysOnTopState();
  }

  async applyAlwaysOnTopState() {
    try {
      const win = getCurrentWebviewWindow();
      await win.setAlwaysOnTop(this.isAlwaysOnTop);
    } catch (e) {
      console.error('Failed to set always-on-top mode', e);
    }
  }

  async closeWidget() {
    try {
      const win = getCurrentWebviewWindow();
      await win.close();
    } catch (e) {
      console.error('Failed to close widget window', e);
    }
  }
}
