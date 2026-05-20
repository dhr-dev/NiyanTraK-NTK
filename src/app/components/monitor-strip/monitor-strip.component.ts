import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface MonitorMetrics {
  fastPpt: number;
  fastPptLimit: number;
  slowPpt: number;
  slowPptLimit: number;
  temp: number;
  tempLimit: number;
  stapm: number;
}

@Component({
  selector: 'app-monitor-strip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="monitor-strip flex items-center justify-between h-[40px] bg-bar-rail border-b border-border-muted select-none text-[11px]">
      
      <!-- FAST PPT Segment -->
      <div class="flex-1 flex flex-col justify-center px-4 h-full">
        <div class="flex items-baseline gap-2">
          <span class="text-[9px] font-medium text-[#555] uppercase tracking-wider">FAST PPT</span>
          <span class="text-[13px] font-medium text-[#ccc]">{{ metrics.fastPpt }}W</span>
        </div>
        <div class="w-[80px] h-[4px] bg-[#2a2a2a] rounded-sm overflow-hidden mt-[2px]">
          <div 
            class="h-full transition-all duration-300"
            [ngClass]="getColorClass(metrics.fastPpt, metrics.fastPptLimit)"
            [style.width.%]="getPercent(metrics.fastPpt, metrics.fastPptLimit)"
          ></div>
        </div>
      </div>
      
      <!-- Divider -->
      <div class="w-[1px] h-full bg-border-muted"></div>
      
      <!-- SLOW PPT Segment -->
      <div class="flex-1 flex flex-col justify-center px-4 h-full">
        <div class="flex items-baseline gap-2">
          <span class="text-[9px] font-medium text-[#555] uppercase tracking-wider">SLOW PPT</span>
          <span class="text-[13px] font-medium text-[#ccc]">{{ metrics.slowPpt }}W</span>
        </div>
        <div class="w-[80px] h-[4px] bg-[#2a2a2a] rounded-sm overflow-hidden mt-[2px]">
          <div 
            class="h-full transition-all duration-300"
            [ngClass]="getColorClass(metrics.slowPpt, metrics.slowPptLimit)"
            [style.width.%]="getPercent(metrics.slowPpt, metrics.slowPptLimit)"
          ></div>
        </div>
      </div>
      
      <!-- Divider -->
      <div class="w-[1px] h-full bg-border-muted"></div>
      
      <!-- TEMP Segment -->
      <div class="flex-1 flex flex-col justify-center px-4 h-full">
        <div class="flex items-baseline gap-2">
          <span class="text-[9px] font-medium text-[#555] uppercase tracking-wider">TEMP</span>
          <span class="text-[13px] font-medium text-[#ccc]">{{ metrics.temp }}°C</span>
        </div>
        <div class="w-[80px] h-[4px] bg-[#2a2a2a] rounded-sm overflow-hidden mt-[2px]">
          <div 
            class="h-full transition-all duration-300"
            [ngClass]="getColorClass(metrics.temp, metrics.tempLimit)"
            [style.width.%]="getPercent(metrics.temp, metrics.tempLimit)"
          ></div>
        </div>
      </div>
      
      <!-- Divider -->
      <div class="w-[1px] h-full bg-border-muted"></div>
      
      <!-- STAPM Segment -->
      <div class="flex-1 flex flex-col justify-center px-4 h-full">
        <div class="flex items-baseline gap-2">
          <span class="text-[9px] font-medium text-[#555] uppercase tracking-wider">STAPM</span>
          <span class="text-[13px] font-medium text-[#ccc]">{{ metrics.stapm }}W</span>
          <span class="text-[9px] text-[#444] italic font-normal ml-1">(BIOS-ctrl)</span>
        </div>
      </div>
      
    </div>
  `,
  styles: [`
    .monitor-strip {
      /* Pinned width layouts helper */
    }
  `]
})
export class MonitorStripComponent {
  @Input() metrics: MonitorMetrics = {
    fastPpt: 20,
    fastPptLimit: 55,
    slowPpt: 54,
    slowPptLimit: 55,
    temp: 64,
    tempLimit: 90,
    stapm: 45
  };

  getPercent(val: number, limit: number): number {
    if (!limit) return 0;
    return Math.min(Math.round((val / limit) * 100), 100);
  }

  getColorClass(val: number, limit: number): string {
    const pct = this.getPercent(val, limit);
    if (pct < 70) {
      return 'bg-accent-green'; // green
    } else if (pct < 90) {
      return 'bg-accent-amber'; // amber
    } else {
      return 'bg-accent-red'; // red
    }
  }
}
