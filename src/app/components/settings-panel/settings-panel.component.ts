import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { invoke } from '@tauri-apps/api/core';
import { WebviewWindow, getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';

export interface WidgetSettings {
  showTemp: boolean;
  showTdp: boolean;
  showFan: boolean;
  showProfiles: boolean;
}

export interface AppSettings {
  minimizeToTray: boolean;
  widget: WidgetSettings;
}

@Component({
  selector: 'app-settings-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-container">
      <div class="settings-header">
        <h2 class="settings-title">System Settings</h2>
        <p class="settings-subtitle">Manage system integration, window behaviors, and desktop widget preferences.</p>
      </div>

      <div class="settings-grid">
        <!-- WINDOW & TRAY OPTIONS -->
        <section class="settings-card">
          <h3 class="card-title">
            <svg viewBox="0 0 24 24" fill="currentColor" class="card-icon">
              <path d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM6.16 5.1a.75.75 0 0 1 1.06 0l1.59 1.59a.75.75 0 1 1-1.06 1.06L6.16 6.16a.75.75 0 0 1 0-1.06ZM17.84 5.1a.75.75 0 0 1 0 1.06l-1.59 1.59a.75.75 0 1 1-1.06-1.06l1.59-1.59a.75.75 0 0 1 1.06 0ZM3 12a.75.75 0 0 1 .75-.75h2.25a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 12ZM17.25 12a.75.75 0 0 1 .75-.75h2.25a.75.75 0 0 1 0 1.5H18a.75.75 0 0 1-.75-.75ZM7.75 16.25a.75.75 0 0 1 .53.22l1.59 1.59a.75.75 0 1 1-1.06 1.06l-1.59-1.59a.75.75 0 0 1 .53-1.28ZM16.25 16.25a.75.75 0 0 1 1.06 0l1.59 1.59a.75.75 0 1 1-1.06 1.06l-1.59-1.59a.75.75 0 0 1 0-1.06ZM12 17.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V18a.75.75 0 0 1 .75-.75Z" />
            </svg>
            System Integration
          </h3>

          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-label">Minimize to System Tray</span>
              <span class="setting-desc">Hide the main window in the system tray instead of closing or minimizing to the taskbar.</span>
            </div>
            <label class="switch-container">
              <input type="checkbox" [(ngModel)]="settings.minimizeToTray" (change)="saveSettings()">
              <span class="switch-slider"></span>
            </label>
          </div>
        </section>

        <!-- WIDGET GLOBAL CONTROLS -->
        <section class="settings-card">
          <h3 class="card-title">
            <svg viewBox="0 0 24 24" fill="currentColor" class="card-icon">
              <path d="M12.75 3a.75.75 0 0 0-1.5 0v8.25H3a.75.75 0 0 0 0 1.5h8.25V21a.75.75 0 0 0 1.5 0v-8.25H21a.75.75 0 0 0 0-1.5h-8.25V3Z" />
            </svg>
            Desktop Companion Widget
          </h3>

          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-label">Launch Floating Widget</span>
              <span class="setting-desc">Spawn or dismiss the ultra-compact, frameless desktop telemetry overlay.</span>
            </div>
            <button class="btn-launch-widget" (click)="toggleWidget()">
              {{ isWidgetRunning ? 'Dismiss Widget' : 'Launch Widget' }}
            </button>
          </div>

          <div class="setting-divider"></div>

          <h4 class="settings-section-subtitle">Customize Widget Layout</h4>
          <p class="settings-section-desc">Toggle specific rows to make the widget as slim and compact as possible.</p>

          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-label">Temperature Circles</span>
              <span class="setting-desc">Show circular gauges for core CPU temp, chassis skin temp, and limits.</span>
            </div>
            <label class="switch-container">
              <input type="checkbox" [(ngModel)]="settings.widget.showTemp" (change)="saveSettings(); updateWidgetLayout()">
              <span class="switch-slider"></span>
            </label>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-label">TDP Selector Row</span>
              <span class="setting-desc">Show real-time wattage draw and 1, 2, 3, 4 points (12W to 45W).</span>
            </div>
            <label class="switch-container">
              <input type="checkbox" [(ngModel)]="settings.widget.showTdp" (change)="saveSettings(); updateWidgetLayout()">
              <span class="switch-slider"></span>
            </label>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-label">Fan Speed Row</span>
              <span class="setting-desc">Show RPM speed and 1, 2, 3, 4 points (Auto to L3 cooling).</span>
            </div>
            <label class="switch-container">
              <input type="checkbox" [(ngModel)]="settings.widget.showFan" (change)="saveSettings(); updateWidgetLayout()">
              <span class="switch-slider"></span>
            </label>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-label">Pinned Profiles Row</span>
              <span class="setting-desc">Show quick-action shortcut pills for all your pinned custom presets.</span>
            </div>
            <label class="switch-container">
              <input type="checkbox" [(ngModel)]="settings.widget.showProfiles" (change)="saveSettings(); updateWidgetLayout()">
              <span class="switch-slider"></span>
            </label>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .settings-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
      color: #e0e0e0;
      animation: fade-in 250ms ease-out;
    }
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .settings-header {
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      padding-bottom: 16px;
    }
    .settings-title {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #ffffff;
      margin-bottom: 4px;
    }
    .settings-subtitle {
      font-size: 12px;
      color: #888888;
    }
    .settings-grid {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .settings-card {
      background: rgba(30, 30, 32, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 16px;
      backdrop-filter: blur(16px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }
    .card-title {
      font-size: 14px;
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .card-icon {
      width: 16px;
      height: 16px;
      color: #3b82f6;
    }
    .setting-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      gap: 24px;
    }
    .setting-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
    }
    .setting-label {
      font-size: 13px;
      font-weight: 500;
      color: #e0e0e0;
    }
    .setting-desc {
      font-size: 11px;
      color: #777777;
      line-height: 1.4;
    }
    .setting-divider {
      height: 1px;
      background: rgba(255, 255, 255, 0.05);
      margin: 14px 0;
    }
    .settings-section-subtitle {
      font-size: 12px;
      font-weight: 600;
      color: #3b82f6;
      margin-bottom: 2px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .settings-section-desc {
      font-size: 11px;
      color: #888888;
      margin-bottom: 12px;
    }

    /* PREMIUM BUTTON */
    .btn-launch-widget {
      background: #1a2a3a;
      border: 1px solid rgba(59, 130, 246, 0.3);
      color: #3b82f6;
      border-radius: 6px;
      padding: 6px 12px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 150ms ease;
    }
    .btn-launch-widget:hover {
      background: #1e3040;
      border-color: #3b82f6;
      box-shadow: 0 0 10px rgba(59, 130, 246, 0.15);
    }

    /* PREMIUM SWITCH SLIDER */
    .switch-container {
      position: relative;
      display: inline-block;
      width: 36px;
      height: 20px;
      flex-shrink: 0;
    }
    .switch-container input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    .switch-slider {
      position: absolute;
      cursor: pointer;
      top: 0; left: 0; right: 0; bottom: 0;
      background-color: #2a2a2a;
      transition: .2s;
      border-radius: 20px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    .switch-slider:before {
      position: absolute;
      content: "";
      height: 14px;
      width: 14px;
      left: 2px;
      bottom: 2px;
      background-color: #777777;
      transition: .2s;
      border-radius: 50%;
    }
    input:checked + .switch-slider {
      background-color: #1a2a3a;
      border-color: rgba(59, 130, 246, 0.3);
    }
    input:checked + .switch-slider:before {
      transform: translateX(16px);
      background-color: #3b82f6;
    }
  `]
})
export class SettingsPanelComponent implements OnInit {
  settings: AppSettings = {
    minimizeToTray: false,
    widget: {
      showTemp: true,
      showTdp: true,
      showFan: true,
      showProfiles: true
    }
  };

  isWidgetRunning = false;

  async ngOnInit() {
    this.loadSettings();
    this.checkWidgetStatus();
    
    // Listen to layout changes in real-time (e.g. when widget panels are hidden)
    try {
      const win = getCurrentWebviewWindow();
      await win.listen<WidgetSettings>('layout_changed', (event) => {
        this.settings.widget = event.payload;
      });
    } catch (e) {
      console.error('Failed to listen to layout_changed in settings panel', e);
    }
  }

  loadSettings() {
    try {
      const stored = localStorage.getItem('niyantrak_settings');
      if (stored) {
        this.settings = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load settings', e);
    }
  }

  async saveSettings() {
    try {
      localStorage.setItem('niyantrak_settings', JSON.stringify(this.settings));
      // Sync minimize to tray with Rust
      await invoke('set_minimize_to_tray', { enabled: this.settings.minimizeToTray });
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  }

  async checkWidgetStatus() {
    try {
      const widgetWin = await WebviewWindow.getByLabel('widget');
      this.isWidgetRunning = widgetWin !== null;
    } catch (e) {
      this.isWidgetRunning = false;
    }
  }

  async toggleWidget() {
    try {
      const label = 'widget';
      const widgetWin = await WebviewWindow.getByLabel(label);
      if (widgetWin) {
        await widgetWin.close();
        this.isWidgetRunning = false;
      } else {
        // Calculate initial height based on enabled panels
        const height = this.calculateWidgetHeight();
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
        this.isWidgetRunning = true;
      }
    } catch (e) {
      console.error('Failed to toggle widget window', e);
    }
  }

  calculateWidgetHeight(): number {
    let height = 32; // Header
    if (this.settings.widget.showTemp) height += 48;
    if (this.settings.widget.showTdp) height += 36;
    if (this.settings.widget.showFan) height += 36;
    if (this.settings.widget.showProfiles) height += 36;
    return height;
  }

  async updateWidgetLayout() {
    // Notify the widget window if it is running to adjust its height
    try {
      const widgetWin = await WebviewWindow.getByLabel('widget');
      if (widgetWin) {
        // Emit layout change event
        await widgetWin.emit('layout_changed', this.settings.widget);
      }
    } catch (e) {
      console.error('Failed to notify widget layout change', e);
    }
  }
}
