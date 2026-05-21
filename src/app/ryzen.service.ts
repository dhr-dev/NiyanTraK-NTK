import { Injectable } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';

export interface RyzenAdjResponse {
  success: boolean;
  message: string;
  data?: {
    stapm_limit?: number;
    stapm_value?: number;
    fast_limit?: number;
    fast_value?: number;
    slow_limit?: number;
    slow_value?: number;
    stapm_time?: number;
    slow_time?: number;
    tctl_limit?: number;
    tctl_value?: number;
    apu_skin_limit?: number;
    apu_skin_value?: number;
    dgpu_skin_limit?: number;
    dgpu_skin_value?: number;
    stdout?: string;
    stderr?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class RyzenService {

  async setMode(mode: 'performance' | 'balanced' | 'silent' | 'bed'): Promise<RyzenAdjResponse> {
    try {
      const res = await invoke<RyzenAdjResponse>('set_cpu_mode', { mode });
      console.log('[RyzenService] setMode response:', res);
      return res;
    } catch (err) {
      console.error('[RyzenService] Failed to set CPU mode:', err);
      return {
        success: false,
        message: String(err)
      };
    }
  }

  async setTdp(value: number, tempLimit?: number): Promise<RyzenAdjResponse> {
    try {
      const res = await invoke<RyzenAdjResponse>('set_cpu_tdp', { value, tempLimit });
      console.log('[RyzenService] setTdp response:', res);
      return res;
    } catch (err) {
      console.error('[RyzenService] Failed to set CPU TDP Limit:', err);
      return {
        success: false,
        message: String(err)
      };
    }
  }

  async saveCustomPresets(presets: string): Promise<string> {
    try {
      return await invoke<string>('save_custom_presets', { presets });
    } catch (err) {
      console.error('[RyzenService] Failed to save presets:', err);
      throw err;
    }
  }

  async loadCustomPresets(): Promise<string> {
    try {
      return await invoke<string>('load_custom_presets');
    } catch (err) {
      console.error('[RyzenService] Failed to load presets:', err);
      throw err;
    }
  }

  async getStatus(): Promise<RyzenAdjResponse> {
    try {
      const res = await invoke<RyzenAdjResponse>('get_cpu_status');
      return res;
    } catch (err) {
      console.error('[RyzenService] Failed to get CPU status:', err);
      return {
        success: false,
        message: String(err)
      };
    }
  }

  async startCpuStress(): Promise<boolean> {
    try {
      return await invoke<boolean>('start_cpu_stress');
    } catch (err) {
      console.error('[RyzenService] Failed to start CPU Stress Test:', err);
      return false;
    }
  }

  async stopCpuStress(): Promise<boolean> {
    try {
      return await invoke<boolean>('stop_cpu_stress');
    } catch (err) {
      console.error('[RyzenService] Failed to stop CPU Stress Test:', err);
      return false;
    }
  }

  async getStressStatus(): Promise<boolean> {
    try {
      return await invoke<boolean>('get_stress_status');
    } catch (err) {
      console.error('[RyzenService] Failed to query CPU Stress status:', err);
      return false;
    }
  }
}
