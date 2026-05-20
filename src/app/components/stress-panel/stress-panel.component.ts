import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stress-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stress-panel flex flex-col w-full h-full select-none gap-4">
      
      <!-- Title -->
      <div class="flex flex-col">
        <h2 class="text-[13px] font-medium text-[#ccc] uppercase tracking-wider">Synthetic CPU Stress Load</h2>
        <span class="text-[10px] text-[#555] font-normal mt-[2px]">Verify cooling curves and TDP margins under continuous FPU workloads</span>
      </div>
      
      <!-- Setup Panel -->
      <div class="bg-card-bg border border-border-muted rounded-[6px] p-4 flex flex-col gap-4">
        
        <!-- Duration Segmented Control -->
        <div class="flex flex-col gap-2">
          <span class="text-[10px] text-[#aaa] font-medium uppercase tracking-wider">Duration</span>
          <div class="flex items-center gap-1 w-full bg-[#111] p-[2px] rounded-[4px] border border-border-card">
            <button
              *ngFor="let dur of durationPresets"
              type="button"
              (click)="selectedDuration = dur.value"
              [ngClass]="selectedDuration === dur.value ? 'bg-[#1a2a3a] border-[#2a4a6a] text-accent-blue' : 'bg-transparent border-transparent text-[#666]'"
              class="flex-1 text-[11px] font-medium py-1 border rounded-[3px] text-center transition-all duration-150"
            >
              {{ dur.label }}
            </button>
          </div>
        </div>
        
        <!-- Intensity Segmented Control -->
        <div class="flex flex-col gap-2">
          <span class="text-[10px] text-[#aaa] font-medium uppercase tracking-wider">Workload Intensity</span>
          <div class="flex items-center gap-1 w-full bg-[#111] p-[2px] rounded-[4px] border border-border-card">
            <button
              *ngFor="let intent of intensityPresets"
              type="button"
              (click)="selectedIntensity = intent"
              [ngClass]="selectedIntensity === intent ? 'bg-[#1a2a3a] border-[#2a4a6a] text-accent-blue' : 'bg-transparent border-transparent text-[#666]'"
              class="flex-1 text-[11px] font-medium py-1 border rounded-[3px] text-center transition-all duration-150"
            >
              {{ intent }}
            </button>
          </div>
        </div>
        
        <!-- Start/Stop Button -->
        <button
          type="button"
          (click)="toggle()"
          [ngClass]="stressActive ? 'bg-[#2a1a1a] border-[#3a1a1a] text-accent-red hover:bg-[#3b1e1e]' : 'bg-[#1a2a3a] border-[#2a4a6a] text-accent-blue hover:bg-[#1e3040]'"
          class="flex items-center justify-center w-full h-[34px] border text-[12px] font-medium rounded-[4px] transition-colors duration-150 mt-2"
        >
          {{ stressActive ? 'Stop Stress Test' : 'Start Stress Test' }}
        </button>
        
      </div>
      
      <!-- Thread Loading Grid Mockup -->
      <div class="flex-1 bg-card-bg border border-border-muted rounded-[6px] p-4 flex flex-col gap-3 min-h-[140px]">
        <div class="flex items-center justify-between border-b border-border-muted pb-2">
          <span class="text-[10px] text-[#aaa] uppercase font-medium tracking-wider">FPU Core Burn Workload Allocator</span>
          <span 
            *ngIf="stressActive"
            class="text-[10px] text-accent-red font-mono font-medium animate-pulse"
          >
            ACTIVE BURN ({{ stressDuration }}s)
          </span>
        </div>
        
        <!-- Thread grid boxes -->
        <div class="grid grid-cols-4 gap-2 flex-grow overflow-y-auto max-h-[160px] pb-1">
          <div 
            *ngFor="let core of [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]"
            [ngClass]="stressActive ? 'border-accent-red bg-[#1a0f0f]' : 'border-[#222] bg-[#1a1a1a]'"
            class="border rounded-[4px] p-2 flex flex-col items-center justify-center gap-1 transition-all duration-300"
          >
            <span class="text-[9px] text-[#555] font-semibold">T{{ core }}</span>
            <span 
              [ngClass]="stressActive ? 'text-accent-red font-semibold' : 'text-[#444]'"
              class="text-[10px]"
            >
              {{ stressActive ? '100%' : '0%' }}
            </span>
          </div>
        </div>
      </div>
      
    </div>
  `,
  styles: [`
    /* Scrollbar minimal customization */
    ::-webkit-scrollbar {
      width: 4px;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
    }
    ::-webkit-scrollbar-thumb {
      background: #2a2a2a;
      border-radius: 2px;
    }
  `]
})
export class StressPanelComponent {
  @Input() stressActive: boolean = false;
  @Input() stressDuration: number = 0;
  
  @Output() onStartTest = new EventEmitter<{duration: number, intensity: string}>();
  @Output() onStopTest = new EventEmitter<void>();

  selectedDuration: number = 60; // default 1 min (in seconds)
  selectedIntensity: string = 'Heavy';

  durationPresets = [
    { label: '30s', value: 30 },
    { label: '1 min', value: 60 },
    { label: '5 min', value: 300 },
    { label: '10 min', value: 600 },
    { label: '30 min', value: 1800 }
  ];

  intensityPresets = ['Light', 'Medium', 'Heavy', 'Maximum'];

  toggle() {
    if (this.stressActive) {
      this.onStopTest.emit();
    } else {
      this.onStartTest.emit({
        duration: this.selectedDuration,
        intensity: this.selectedIntensity
      });
    }
  }
}
