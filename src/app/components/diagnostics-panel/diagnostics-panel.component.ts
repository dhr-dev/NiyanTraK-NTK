import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DiagnosticsData {
  stapm_limit?: number;
  fast_limit?: number;
  slow_limit?: number;
  tctl_temp?: number;
  apu_skin_temp?: number;
  stdout?: string;
  stderr?: string;
}

@Component({
  selector: 'app-diagnostics-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="diagnostics-panel flex flex-col w-full h-full select-none gap-4">
      
      <!-- Header Row -->
      <div class="flex items-center justify-between">
        <div class="flex flex-col">
          <h2 class="text-[13px] font-medium text-[#ccc] uppercase tracking-wider">Ryzen Diagnostics Dashboard</h2>
          <span class="text-[10px] text-[#555] font-normal mt-[2px]">Real-time hardware limit tables & thermal thresholds</span>
        </div>
        <div class="flex items-center gap-2 px-3 py-1 rounded-[4px] bg-[#161616] border border-border-muted">
          <span class="text-[10px] font-medium text-[#888]">POLLING ONLINE</span>
          <span class="w-[6px] h-[6px] rounded-full bg-accent-green pulse-dot"></span>
        </div>
      </div>
      
      <!-- Main Grid Layout -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <!-- Grid Tile 1: Fast PPT Limit -->
        <div class="bg-card-bg border border-border-muted rounded-[6px] p-4 flex flex-col justify-between h-[90px]">
          <div class="flex items-baseline justify-between">
            <span class="text-[9px] text-[#555] uppercase tracking-wider font-semibold">Fast PPT Limit</span>
            <span class="text-[18px] font-medium text-[#ccc] leading-none">{{ data?.fast_limit ?? 20 }}W</span>
          </div>
          <div class="w-full flex flex-col gap-1">
            <div class="h-[3px] bg-[#2a2a2a] rounded-sm overflow-hidden">
              <div 
                class="h-full transition-all duration-300"
                [ngClass]="getColorClass(data?.fast_limit ?? 20, 55)"
                [style.width.%]="getPercent(data?.fast_limit ?? 20, 55)"
              ></div>
            </div>
            <div class="flex items-center justify-between text-[9px] text-[#444]">
              <span>Current limit</span>
              <span>Max: 55W</span>
            </div>
          </div>
        </div>
        
        <!-- Grid Tile 2: Slow PPT Limit -->
        <div class="bg-card-bg border border-border-muted rounded-[6px] p-4 flex flex-col justify-between h-[90px]">
          <div class="flex items-baseline justify-between">
            <span class="text-[9px] text-[#555] uppercase tracking-wider font-semibold">Slow PPT Limit</span>
            <span class="text-[18px] font-medium text-[#ccc] leading-none">{{ data?.slow_limit ?? 54 }}W</span>
          </div>
          <div class="w-full flex flex-col gap-1">
            <div class="h-[3px] bg-[#2a2a2a] rounded-sm overflow-hidden">
              <div 
                class="h-full transition-all duration-300"
                [ngClass]="getColorClass(data?.slow_limit ?? 54, 55)"
                [style.width.%]="getPercent(data?.slow_limit ?? 54, 55)"
              ></div>
            </div>
            <div class="flex items-center justify-between text-[9px] text-[#444]">
              <span>Current limit</span>
              <span>Max: 55W</span>
            </div>
          </div>
        </div>
        
        <!-- Grid Tile 3: Temp Throttle -->
        <div class="bg-card-bg border border-border-muted rounded-[6px] p-4 flex flex-col justify-between h-[90px]">
          <div class="flex items-baseline justify-between">
            <span class="text-[9px] text-[#555] uppercase tracking-wider font-semibold">Temp Throttle Limit</span>
            <span class="text-[18px] font-medium text-[#ccc] leading-none">{{ data?.tctl_temp ?? 90 }}°C</span>
          </div>
          <div class="w-full flex flex-col gap-1">
            <div class="h-[3px] bg-[#2a2a2a] rounded-sm overflow-hidden">
              <div 
                class="h-full transition-all duration-300"
                [ngClass]="getColorClass(data?.tctl_temp ?? 90, 100)"
                [style.width.%]="getPercent(data?.tctl_temp ?? 90, 100)"
              ></div>
            </div>
            <div class="flex items-center justify-between text-[9px] text-[#444]">
              <span>Current limit</span>
              <span>Max: 100°C</span>
            </div>
          </div>
        </div>
        
        <!-- Grid Tile 4: STAPM Limit -->
        <div class="bg-card-bg border border-border-muted rounded-[6px] p-4 flex flex-col justify-between h-[90px]">
          <div class="flex items-baseline justify-between">
            <span class="text-[9px] text-[#555] uppercase tracking-wider font-semibold">STAPM Limit</span>
            <span class="text-[18px] font-medium text-[#ccc] leading-none">{{ data?.stapm_limit ?? 45 }}W</span>
          </div>
          <div class="w-full flex flex-col gap-1 mt-3">
            <div class="text-[10px] text-accent-blue font-medium flex items-center gap-1">
              <span>●</span>
              <span>SYSTEM BIOS MANAGED</span>
            </div>
            <span class="text-[9px] text-[#444] italic">(BIOS-controlled)</span>
          </div>
        </div>
        
      </div>
      
      <!-- Graph mockup area (Vercel/Linear style, no neon, 10% opacity fill) -->
      <div class="flex-1 bg-card-bg border border-border-muted rounded-[6px] p-4 flex flex-col gap-3 min-h-[160px]">
        <div class="flex items-center justify-between border-b border-border-muted pb-2">
          <span class="text-[10px] text-[#aaa] uppercase font-medium tracking-wider">Package Power History (20s)</span>
          <span class="text-[10px] text-accent-blue font-mono font-medium">Avg load: 24.5W</span>
        </div>
        
        <!-- Vector SVG Chart Mockup -->
        <div class="flex-1 relative w-full h-full flex items-end">
          <svg class="w-full h-full text-accent-blue" viewBox="0 0 400 120" preserveAspectRatio="none">
            <!-- Grid Lines -->
            <line x1="0" y1="30" x2="400" y2="30" stroke="#1c1c1c" stroke-width="1" stroke-dasharray="2,2" />
            <line x1="0" y1="60" x2="400" y2="60" stroke="#1c1c1c" stroke-width="1" stroke-dasharray="2,2" />
            <line x1="0" y1="90" x2="400" y2="90" stroke="#1c1c1c" stroke-width="1" stroke-dasharray="2,2" />
            
            <!-- Graph Area Fill (10% opacity) -->
            <path 
              d="M0 120 L0 80 Q50 95 100 60 T200 85 T300 40 T400 45 L400 120 Z" 
              fill="currentColor" 
              fill-opacity="0.10" 
            />
            
            <!-- Graph Line -->
            <path 
              d="M0 80 Q50 95 100 60 T200 85 T300 40 T400 45" 
              fill="none" 
              stroke="currentColor" 
              stroke-width="1.5" 
            />
          </svg>
        </div>
        
      </div>
      
    </div>
  `,
  styles: [`
    .pulse-dot {
      box-shadow: 0 0 6px var(--color-green, #22c55e);
      animation: pulse-glow 1.5s infinite alternate;
    }
    @keyframes pulse-glow {
      from { opacity: 0.4; }
      to { opacity: 1; }
    }
  `]
})
export class DiagnosticsPanelComponent {
  @Input() data: DiagnosticsData | null = null;

  getPercent(val: number, limit: number): number {
    if (!limit) return 0;
    return Math.min(Math.round((val / limit) * 100), 100);
  }

  getColorClass(val: number, limit: number): string {
    const pct = this.getPercent(val, limit);
    if (pct < 70) {
      return 'bg-accent-green';
    } else if (pct < 90) {
      return 'bg-accent-amber';
    } else {
      return 'bg-accent-red';
    }
  }
}
