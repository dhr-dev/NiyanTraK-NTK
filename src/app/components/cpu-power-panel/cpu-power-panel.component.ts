import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SelectableCardComponent } from '../../shared/selectable-card/selectable-card.component';
import { RangeSliderComponent } from '../../shared/range-slider/range-slider.component';

@Component({
  selector: 'app-cpu-power-panel',
  standalone: true,
  imports: [CommonModule, SelectableCardComponent, RangeSliderComponent],
  template: `
    <div class="cpu-power-panel flex flex-col w-full select-none">
      <!-- Section Title -->
      <h2 class="text-[11px] font-medium text-[#aaa] uppercase tracking-wider mb-2">CPU Power Presets</h2>
      
      <!-- Presets Horizontal Row -->
      <div class="flex items-center gap-[6px] w-full mb-4">
        <!-- Silent Preset -->
        <app-selectable-card
          [active]="cpuMode === 'silent'"
          (cardClick)="selectMode('silent')"
          class="flex-1 p-[8px_6px] text-center"
        >
          <div class="text-[11px] font-medium text-[#ccc] leading-none mb-[2px]">Silent</div>
          <div class="text-[9px] text-[#555] font-normal leading-none uppercase">15W · 70°C</div>
        </app-selectable-card>
        
        <!-- Bed Mode Preset -->
        <app-selectable-card
          [active]="cpuMode === 'balanced' || cpuMode === 'bed'"
          (cardClick)="selectMode('bed')"
          class="flex-1 p-[8px_6px] text-center"
        >
          <div class="text-[11px] font-medium text-[#ccc] leading-none mb-[2px]">Bed Mode</div>
          <div class="text-[9px] text-[#555] font-normal leading-none uppercase">35W · 80°C</div>
        </app-selectable-card>
        
        <!-- Performance Preset -->
        <app-selectable-card
          [active]="cpuMode === 'performance'"
          (cardClick)="selectMode('performance')"
          class="flex-1 p-[8px_6px] text-center"
        >
          <div class="text-[11px] font-medium text-[#ccc] leading-none mb-[2px]">Performance</div>
          <div class="text-[9px] text-[#555] font-normal leading-none uppercase">45W · 90°C</div>
        </app-selectable-card>
      </div>
      
      <!-- Divider -->
      <div class="w-full h-[1px] bg-border-muted mb-4"></div>
      
      <!-- Custom TDP Target Section -->
      <div class="flex flex-col gap-2 mb-4">
        <span class="text-[10px] text-[#555] uppercase font-medium tracking-wider">Custom TDP Target</span>
        
        <app-range-slider
          [min]="10"
          [max]="55"
          [step]="1"
          [value]="cpuTdp"
          (valueChange)="updateTdp($event)"
        ></app-range-slider>
        
        <div class="flex items-baseline justify-between mt-1">
          <div class="flex flex-col text-left">
            <span class="text-[9px] text-[#444] uppercase tracking-wider font-semibold">CUSTOM</span>
            <span class="text-[9px] text-[#444] italic font-normal leading-none mt-[2px]">Target PPT Limit</span>
          </div>
          <span class="text-[20px] font-medium text-[#ccc] leading-none">{{ cpuTdp }}W</span>
        </div>
      </div>
      
      <!-- Apply Button -->
      <button
        type="button"
        (click)="apply()"
        class="apply-btn flex items-center justify-center w-full h-[30px] rounded-[4px] bg-[#1a2a3a] border border-[#2a4a6a] text-[11px] font-medium text-accent-blue transition-colors duration-150"
      >
        Apply Custom TDP
      </button>
    </div>
  `,
  styles: [`
    .apply-btn:hover {
      background-color: #1e3040;
    }
  `]
})
export class CPUPowerPanelComponent {
  @Input() cpuTdp: number = 20;
  @Input() cpuMode: 'performance' | 'balanced' | 'silent' | 'custom' | 'bed' = 'bed';
  
  @Output() cpuTdpChange = new EventEmitter<number>();
  @Output() cpuModeChange = new EventEmitter<'performance' | 'balanced' | 'silent' | 'custom' | 'bed'>();
  @Output() onApply = new EventEmitter<void>();

  selectMode(mode: 'performance' | 'balanced' | 'silent' | 'custom' | 'bed') {
    this.cpuMode = mode;
    this.cpuModeChange.emit(mode);
    
    // Automatically update local TDP target slider to match preset power limits
    if (mode === 'silent') {
      this.cpuTdp = 15;
    } else if (mode === 'bed' || mode === 'balanced') {
      this.cpuTdp = 35;
    } else if (mode === 'performance') {
      this.cpuTdp = 45;
    }
    this.cpuTdpChange.emit(this.cpuTdp);
  }

  updateTdp(val: number) {
    this.cpuTdp = val;
    this.cpuMode = 'custom';
    this.cpuTdpChange.emit(val);
    this.cpuModeChange.emit('custom');
  }

  apply() {
    this.onApply.emit();
  }
}
