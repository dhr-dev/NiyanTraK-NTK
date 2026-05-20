import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { invoke } from '@tauri-apps/api/core';
import { RyzenService } from './ryzen.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  private ryzenService = inject(RyzenService);

  tab: 'quick' | 'profile' = 'quick';

  fanLevel = 8; // Default leftmost 800 RPM
  fanEnabled = true; // Manual Control override status

  profileName = '';
  profileFan = 30;

  // CPU RyzenAdj state
  cpuTdp = 35;
  cpuMode: 'performance' | 'balanced' | 'silent' | 'custom' = 'balanced';
  cpuLimits: any = null;
  cpuErrorMsg = '';

  // Toast System
  toasts: { message: string; type: 'success' | 'error' | 'info'; id: number }[] = [];
  private toastIdCounter = 0;
  private pollInterval: any;

  profiles = [
    { name: 'battery', powerLimit: 12, fan: 'silent', label: 'Battery Saver', icon: '', desc: 'Maximizes battery life by limiting power and keeping fans silent.' },
    { name: 'laptop', powerLimit: 25, fan: 'balanced', label: 'Balanced Mode', icon: '', desc: 'Standard power limits with balanced fan curves for general office work.' },
    { name: 'table', powerLimit: 35, fan: 'medium', label: 'Table Mode', icon: '', desc: 'Boosted performance profile for desk usage, keeping temperatures optimal.' },
    { name: 'performance', powerLimit: 45, fan: 'high', label: 'Performance Mode', icon: '', desc: 'High power limits and aggressive fan response for compiling.' },
    { name: 'extreme', powerLimit: 55, fan: 'max', label: 'Extreme Mode', icon: '', desc: 'Max power limits and maximum fan cooling profile for heavy loads.' }
  ];

  ngOnInit() {
    this.startCpuStatusPolling();
  }

  ngOnDestroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
    const id = this.toastIdCounter++;
    this.toasts.push({ message, type, id });
    setTimeout(() => {
      this.toasts = this.toasts.filter(t => t.id !== id);
    }, 4500);
  }

  startCpuStatusPolling() {
    // Poll once immediately, then every 2 seconds
    this.pollCpuStatus();
    this.pollInterval = setInterval(() => {
      this.pollCpuStatus();
    }, 2000);
  }

  async pollCpuStatus() {
    const res = await this.ryzenService.getStatus();
    if (res.success && res.data) {
      this.cpuLimits = res.data;
      this.cpuErrorMsg = '';
    } else {
      this.cpuLimits = null;
      this.cpuErrorMsg = res.message || 'RyzenAdj is not running or lacks permission.';
    }
  }

  async applyCpuMode(mode: 'performance' | 'balanced' | 'silent') {
    this.cpuMode = mode;
    if (mode === 'performance') this.cpuTdp = 55;
    else if (mode === 'balanced') this.cpuTdp = 35;
    else if (mode === 'silent') this.cpuTdp = 15;

    const res = await this.ryzenService.setMode(mode);
    if (res.success) {
      this.showToast(`Ryzen CPU Mode set to ${mode.toUpperCase()}!`, 'success');
      this.pollCpuStatus();
    } else {
      this.showToast(res.message || 'Failed to set CPU mode.', 'error');
    }
  }

  async applyCustomTdp() {
    this.cpuMode = 'custom';
    if (this.cpuTdp < 8) this.cpuTdp = 8;
    if (this.cpuTdp > 55) this.cpuTdp = 55;
    const res = await this.ryzenService.setTdp(this.cpuTdp);
    if (res.success) {
      this.showToast(`Ryzen CPU TDP custom limit set to ${this.cpuTdp}W!`, 'success');
      this.pollCpuStatus();
    } else {
      this.showToast(res.message || 'Failed to set TDP custom limit.', 'error');
    }
  }

  getRpm(level: number): number {
    if (level === 8) {
      return 800;
    }
    if (level === 9) {
      return 1200;
    }
    if (level >= 10 && level <= 19) {
      return 1600 + (level - 10) * 100;
    }
    if (level === 29) {
      return 4200;
    }
    if (level >= 20 && level <= 28) {
      return 3200 + (level - 20) * 100;
    }
    if (level >= 30) {
      return 4800 + (level - 30) * 100;
    }
    return 800;
  }

  getPercent(level: number): number {
    const rpm = this.getRpm(level);
    return Math.round((rpm / 5700) * 100);
  }

  async applyFan() {
    let level: string;
    if (this.fanEnabled) {
      const padded = String(this.fanLevel).padStart(2, '0');
      level = `${padded}:${padded}`;
      console.log(`[Fan] Sending manual override level → ${level} (${this.getRpm(this.fanLevel)} RPM)`);
    } else {
      level = '0:0';
      console.log(`[Fan] Disabling manual control. Restoring Auto Curve / Fan Off → ${level}`);
    }

    try {
      const res = await invoke<string>('set_fan_mode', {
        mode: level
      });
      console.log(`[Response] ${res}`);
      this.showToast(this.fanEnabled ? `Fan manual override applied (${this.getRpm(this.fanLevel)} RPM)` : 'Fan manual control disabled (Auto).', 'success');
    } catch (err) {
      console.error(`[Error] Failed to set fan level: ${err}`);
      this.showToast(`Failed to set fan level: ${err}`, 'error');
    }
  }

  async toggleFanControl() {
    this.fanEnabled = !this.fanEnabled;
    await this.applyFan();
  }

  async saveProfile() {
    console.log(`[Profile] Saved profile preference locally: ${this.profileName} (Fan Offset: ${this.getPercent(this.profileFan)}%)`);
    this.showToast(`Profile preference '${this.profileName}' saved locally!`, 'info');
  }

  async applyProfile() {
    if (!this.profileName) {
      this.showToast('Please enter or select a profile first.', 'error');
      return;
    }
    console.log(`[Profile] Invoking profile → ${this.profileName}`);

    try {
      const res = await invoke<string>('run_profile', {
        profile: this.profileName.toLowerCase()
      });
      console.log(`[Response] ${res}`);
      this.showToast(`Performance Profile '${this.profileName}' applied!`, 'success');
    } catch (err) {
      console.error(`[Error] Failed to apply profile: ${err}`);
      this.showToast(`Failed to apply profile: ${err}`, 'error');
    }
  }

  selectProfile(name: string) {
    this.profileName = name;
    const p = this.profiles.find(item => item.name === name);
    if (p) {
      if (p.fan === 'silent') {
        this.profileFan = 8; // 800 RPM
      } else if (p.fan === 'balanced' || p.fan === 'medium') {
        this.profileFan = 30; // 4800 RPM
      } else if (p.fan === 'high') {
        this.profileFan = 34; // 5200 RPM
      } else if (p.fan === 'max') {
        this.profileFan = 39; // 5700 RPM
      }
    }
  }
}