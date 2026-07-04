import { Injectable, inject } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';
import { RyzenService, SmartFanConfig, FanCurvePoint } from './ryzen.service';

@Injectable({
  providedIn: 'root'
})
export class FanCurveService {
  private ryzenService = inject(RyzenService);

  private readonly STORAGE_KEY = 'niyantrak_autofan_config';

  private defaultPoints: FanCurvePoint[] = [
    { temp: 40, level: 9 },   // 1200 RPM
    { temp: 50, level: 14 },  // 2000 RPM
    { temp: 65, level: 19 },  // 2500 RPM
    { temp: 75, level: 26 },  // 3800 RPM
    { temp: 80, level: 29 },  // 4200 RPM
    { temp: 85, level: 32 },  // 5000 RPM
    { temp: 90, level: 39 }   // 5700 RPM
  ];

  config: SmartFanConfig = {
    enabled: false,
    points: [...this.defaultPoints.map(p => ({ ...p }))],
    instant_spool_temp: 85,
    average_poll_size: 3,
    cooldown_secs: 10,
    advanced: false
  };

  constructor() {
    this.loadFromStorage();
  }

  async loadFromStorage() {
    try {
      const config = await invoke<any>('get_app_config');
      if (config && config.smartFanConfig) {
        const parsed = config.smartFanConfig;
        this.config = {
          enabled: parsed.enabled ?? false,
          points: parsed.points || [...this.defaultPoints.map(p => ({ ...p }))],
          instant_spool_temp: parsed.instant_spool_temp ?? 85,
          average_poll_size: parsed.average_poll_size ?? 3,
          cooldown_secs: parsed.cooldown_secs ?? 10,
          advanced: parsed.advanced ?? false
        };
      }
    } catch (e) {
      console.error('[FanCurveService] Failed to load config from backend:', e);
    }
  }

  async saveConfig(config: SmartFanConfig): Promise<void> {
    this.config = {
      ...config,
      points: [...config.points.map(p => ({ ...p }))]
    };
    try {
      const currentConfig = await invoke<any>('get_app_config');
      const mergedConfig = {
        ...currentConfig,
        smartFanConfig: this.config
      };
      await invoke('save_app_config', { config: mergedConfig });
    } catch (e) {
      console.error('[FanCurveService] Failed to save/sync config:', e);
      throw e;
    }
  }

  async setEnabled(enabled: boolean): Promise<void> {
    this.config.enabled = enabled;
    await this.saveConfig(this.config);
  }

  async syncWithBackend(): Promise<void> {
    try {
      await this.loadFromStorage();
      await this.ryzenService.setSmartFanConfig(this.config);
    } catch (e) {
      console.error('[FanCurveService] Failed to sync config with backend:', e);
    }
  }

  getDefaultPoints(): FanCurvePoint[] {
    return [...this.defaultPoints.map(p => ({ ...p }))];
  }
}
