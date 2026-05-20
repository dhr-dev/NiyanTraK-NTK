import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToggleComponent } from '../../shared/toggle/toggle.component';
import { RangeSliderComponent } from '../../shared/range-slider/range-slider.component';

@Component({
  selector: 'app-fan-control',
  standalone: true,
  imports: [CommonModule, ToggleComponent, RangeSliderComponent],
  template: `
    <div class="fan-control-panel flex flex-col w-full select-none">
      <!-- Section Title -->
      <h2 class="text-[13px] font-medium text-[#ccc] uppercase tracking-wider mb-2">Cooling Fan Control</h2>
      
      <!-- Card Container -->
      <div class="bg-card-bg border border-border-muted rounded-[6px] p-4 flex flex-col gap-4">
        
        <!-- Toggle Row -->
        <div class="flex items-center justify-between border-b border-border-muted pb-3">
          <span class="text-[11px] text-[#aaa]">Manual Override</span>
          <app-toggle 
            [on]="manual" 
            (onChange)="toggleManual($event)"
          ></app-toggle>
        </div>
        
        <!-- Slider Row (Visible when manual is true) -->
        <div 
          class="flex flex-col gap-2 transition-all duration-200"
          [class.opacity-35]="!manual"
          [class.pointer-events-none]="!manual"
        >
          <div class="flex items-center justify-between text-[9px] text-[#444] uppercase tracking-wider">
            <span>Silent</span>
            <span>Max</span>
          </div>
          
          <app-range-slider
            [min]="8"
            [max]="39"
            [step]="1"
            [value]="fanLevel"
            [disabled]="!manual"
            (valueChange)="updateFanLevel($event)"
          ></app-range-slider>
          
          <div class="flex items-baseline justify-between mt-1">
            <span class="text-[13px] font-medium text-[#ccc]">{{ rpm }} RPM</span>
            <span class="text-[11px] text-[#555] font-normal uppercase">{{ percent }}% Duty Cycle</span>
          </div>
        </div>
        
        <!-- Apply button -->
        <button
          type="button"
          (click)="apply()"
          [disabled]="!manual"
          class="apply-btn flex items-center justify-center w-full h-[30px] rounded-[4px] bg-[#1a2a3a] border border-[#2a4a6a] text-[11px] font-medium text-accent-blue transition-colors duration-150"
        >
          Apply Changes
        </button>
        
        <!-- Rotating SVG Fan Icon -->
        <div class="flex items-center justify-center pt-2">
          <div 
            class="fan-wrapper flex items-center justify-center spin-fan"
            [style.--spin-duration]="spinDuration"
            [class.paused]="!manual && percent === 0"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 100 100" 
              class="w-[40px] h-[40px] text-[#333] fill-[#2a2a2a]"
            >
              <!-- Center Hub -->
              <circle cx="50" cy="50" r="10" fill="#333" />
              <!-- Outer Ring -->
              <circle cx="50" cy="50" r="46" stroke="#222" stroke-width="2" fill="none" />
              <!-- Blade 1 -->
              <path d="M50 40 C45 25 35 15 50 10 C65 15 55 25 50 40 Z" />
              <!-- Blade 2 -->
              <path d="M60 50 C75 45 85 35 90 50 C85 65 75 55 60 50 Z" />
              <!-- Blade 3 -->
              <path d="M50 60 C55 75 65 85 50 90 C35 85 45 75 50 60 Z" />
              <!-- Blade 4 -->
              <path d="M40 50 C25 55 15 65 10 50 C15 35 25 45 40 50 Z" />
              <!-- Small Hub Core -->
              <circle cx="50" cy="50" r="4" fill="#666" />
            </svg>
          </div>
        </div>
        
      </div>
    </div>
  `,
  styles: [`
    .apply-btn:hover:not(:disabled) {
      background-color: #1e3040;
    }
    .apply-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .spin-fan {
      animation: spin var(--spin-duration, 3s) linear infinite;
    }
    .spin-fan.paused {
      animation-play-state: paused;
    }
  `]
})
export class FanControlComponent implements OnChanges {
  @Input() fanLevel: number = 8;
  @Input() manual: boolean = true;
  
  @Output() manualChange = new EventEmitter<boolean>();
  @Output() fanLevelChange = new EventEmitter<number>();
  @Output() onApply = new EventEmitter<void>();

  rpm: number = 800;
  percent: number = 14;
  spinDuration: string = '3s';

  ngOnChanges(changes: SimpleChanges) {
    this.recalculateMetrics();
  }

  toggleManual(val: boolean) {
    this.manual = val;
    this.manualChange.emit(val);
    this.recalculateMetrics();
  }

  updateFanLevel(val: number) {
    this.fanLevel = val;
    this.fanLevelChange.emit(val);
    this.recalculateMetrics();
  }

  apply() {
    this.onApply.emit();
  }

  private recalculateMetrics() {
    // If auto mode, let's show default quiet metrics
    if (!this.manual) {
      this.rpm = 1200; // default auto baseline
      this.percent = 21;
      this.spinDuration = '4s'; // slow baseline rotation
      return;
    }

    // Manual RPM calculations matching system specs
    const lvl = this.fanLevel;
    if (lvl === 8) {
      this.rpm = 800;
    } else if (lvl === 9) {
      this.rpm = 1200;
    } else if (lvl >= 10 && lvl <= 19) {
      this.rpm = 1600 + (lvl - 10) * 100;
    } else if (lvl === 29) {
      this.rpm = 4200;
    } else if (lvl >= 20 && lvl <= 28) {
      this.rpm = 3200 + (lvl - 20) * 100;
    } else if (lvl >= 30) {
      this.rpm = 4800 + (lvl - 30) * 100;
    } else {
      this.rpm = 800;
    }

    this.percent = Math.round((this.rpm / 5700) * 100);

    // Dynamic rotation speed calculation
    if (this.percent === 0) {
      this.spinDuration = '0s';
    } else {
      // 100% duty cycle maps to 0.15s spin duration (extremely fast)
      // 14% duty cycle maps to 3.5s spin duration (slow)
      const duration = Math.max(0.12, 3.8 - (this.percent / 100) * 3.65);
      this.spinDuration = `${duration.toFixed(2)}s`;
    }
  }
}
