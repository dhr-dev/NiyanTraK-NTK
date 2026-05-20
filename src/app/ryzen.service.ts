import { Injectable } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';

export interface RyzenAdjResponse {
  success: boolean;
  message: string;
  data?: {
    stapm_limit?: number;
    fast_limit?: number;
    slow_limit?: number;
    tctl_temp?: number;
    apu_skin_temp?: number;
    stdout?: string;
    stderr?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class RyzenService {

  async setMode(mode: 'performance' | 'balanced' | 'silent'): Promise<RyzenAdjResponse> {
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

  async setTdp(value: number): Promise<RyzenAdjResponse> {
    try {
      const res = await invoke<RyzenAdjResponse>('set_cpu_tdp', { value });
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
}
