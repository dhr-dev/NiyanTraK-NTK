import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bezel-strips',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-0 right-0 z-50 pointer-events-none select-none flex flex-col items-end">
      
      <!-- Profiles Bezel Ribbon (👤) -->
      <div 
        (click)="toggleProfiles()"
        [ngClass]="profilesOpen ? 'active-ribbon bg-[#141e2a] text-accent-blue border-accent-blue translate-x-[-6px]' : 'bg-[#1a1a1a] text-[#888] border-[#222]'"
        class="ribbon-tab pointer-events-auto flex items-center gap-[6px] justify-center px-2 w-[34px] h-[34px] cursor-pointer border-l border-t border-b rounded-l-[4px] shadow-lg transition-all duration-200 ease-out"
        style="position: fixed; top: 36px; right: 0;"
        title="Toggle Performance Profiles Drawer"
      >
        <span class="shrink-0 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-[14px] h-[14px]">
            <path fill-rule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clip-rule="evenodd" />
          </svg>
        </span>
      </div>
      
      <!-- Stress Bezel Ribbon (🔥) -->
      <div 
        (click)="triggerStress()"
        [ngClass]="stressRunning ? 'active-ribbon-stress bg-[#2a1a1a] text-accent-red border-accent-red translate-x-[-6px] pulsing-stress-border' : 'bg-[#1a1a1a] text-[#888] border-[#222]'"
        class="ribbon-tab pointer-events-auto flex items-center gap-[6px] justify-center px-2 w-[34px] h-[34px] cursor-pointer border-l border-t border-b rounded-l-[4px] shadow-lg transition-all duration-200 ease-out"
        style="position: fixed; top: 76px; right: 0;"
        title="Toggle Synthetic Load / Quick Stress Run"
      >
        <span class="shrink-0 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-[14px] h-[14px]">
            <path fill-rule="evenodd" d="M12.963 2.285a.75.75 0 0 0-1.071-.105 9.715 9.715 0 0 1-3.662 1.777C7.03 4.3 6 5.376 6 6.75c0 1.258.625 2.186 1.488 2.76.818.544 1.83.746 2.512.746a.75.75 0 0 0 .736-.834 5.25 5.25 0 0 1 .425-3.32.75.75 0 0 1 1.157-.117 9.716 9.716 0 0 1 2.424 5.12 3.75 3.75 0 0 0 2.222-2.12.75.75 0 0 0-.613-.984 6.75 6.75 0 0 1-3.42-8.794ZM4.002 18.003A8.966 8.966 0 0 0 12 22.002a8.966 8.966 0 0 0 7.998-3.999A9.957 9.957 0 0 1 12 16.002a9.956 9.956 0 0 1-7.998 2.001Z" clip-rule="evenodd" />
          </svg>
        </span>
      </div>
      
    </div>
  `,
  styles: [`
    .ribbon-tab {
      transition: transform 150ms cubic-bezier(0.4, 0, 0.2, 1), background-color 150ms ease, border-color 150ms ease;
    }
    .ribbon-tab:hover {
      transform: translateX(-4px);
      background-color: #222;
      border-color: #444;
      color: #ccc;
    }
    .ribbon-tab.active-ribbon:hover {
      transform: translateX(-8px);
      background-color: #141e2a;
      border-color: #3b82f6;
      color: #3b82f6;
    }
    .ribbon-tab.active-ribbon-stress:hover {
      transform: translateX(-8px);
      background-color: #2a1a1a;
      border-color: #ef4444;
      color: #ef4444;
    }
    .pulsing-stress-border {
      animation: stress-glow 2s infinite alternate;
    }
    @keyframes stress-glow {
      from {
        box-shadow: 0 0 4px rgba(239, 68, 68, 0.2), 0 4px 10px rgba(0, 0, 0, 0.4);
      }
      to {
        box-shadow: 0 0 10px rgba(239, 68, 68, 0.5), 0 4px 10px rgba(0, 0, 0, 0.4);
      }
    }
  `]
})
export class BezelStripsComponent {
  @Input() profilesOpen: boolean = false;
  @Input() stressRunning: boolean = false;
  
  @Output() onToggleProfiles = new EventEmitter<void>();
  @Output() onTriggerStress = new EventEmitter<void>();

  toggleProfiles() {
    this.onToggleProfiles.emit();
  }

  triggerStress() {
    this.onTriggerStress.emit();
  }
}
