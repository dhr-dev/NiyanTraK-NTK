import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SelectableCardComponent } from '../../shared/selectable-card/selectable-card.component';

export interface PerformanceProfile {
  name: string;
  label: string;
  powerLimit: number;
  fan: string;
  desc: string;
}

@Component({
  selector: 'app-profiles-drawer',
  standalone: true,
  imports: [CommonModule, SelectableCardComponent],
  template: `
    <div 
      class="profiles-drawer overflow-hidden border-b border-border-muted transition-all duration-300 ease-in-out select-none bg-[#0f0f0f]"
      [style.height]="open ? 'auto' : '0px'"
      [style.padding-top]="open ? '12px' : '0px'"
      [style.padding-bottom]="open ? '12px' : '0px'"
    >
      <!-- Header row -->
      <div class="flex items-center gap-1 px-4 mb-3 text-[10px] uppercase font-medium text-[#555] tracking-wider">
        <span>Profiles</span>
        <span>{{ open ? '▲' : '▼' }}</span>
      </div>
      
      <!-- Horizontal row of cards -->
      <div class="flex items-center gap-[6px] px-4 overflow-x-auto scrollbar-none pb-1">
        <app-selectable-card
          *ngFor="let p of profiles"
          [active]="activeProfile === p.name"
          (cardClick)="selectProfile(p.name)"
          class="flex-shrink-0 w-[130px] p-[8px_12px]"
        >
          <div class="text-[11px] font-medium text-[#ccc] leading-none mb-1">{{ p.label }}</div>
          <div class="text-[10px] text-[#555] font-normal leading-none uppercase tracking-wide">
            {{ p.powerLimit }}W · {{ p.fan }}
          </div>
        </app-selectable-card>

        <!-- Custom Card -->
        <app-selectable-card
          [active]="activeProfile === 'custom'"
          (cardClick)="selectProfile('custom')"
          class="flex-shrink-0 w-[130px] p-[8px_12px]"
        >
          <div class="text-[11px] font-medium text-[#ccc] leading-none mb-1">+ Custom</div>
          <div class="text-[10px] text-[#555] font-normal leading-none uppercase tracking-wide">
            Configure Limit
          </div>
        </app-selectable-card>
      </div>
    </div>
  `,
  styles: [`
    .profiles-drawer {
      /* Pushes down the content below */
    }
    /* Hide scrollbar for Chrome, Safari and Opera */
    .scrollbar-none::-webkit-scrollbar {
      display: none;
    }
    /* Hide scrollbar for IE, Edge and Firefox */
    .scrollbar-none {
      -ms-overflow-style: none;  /* IE and Edge */
      scrollbar-width: none;  /* Firefox */
    }
  `]
})
export class ProfilesDrawerComponent {
  @Input() open: boolean = false;
  @Input() activeProfile: string = 'laptop'; // e.g. 'laptop' which has 'Bed Mode' label
  @Output() onSelect = new EventEmitter<string>();

  profiles: PerformanceProfile[] = [
    { name: 'battery', label: 'Battery Saver', powerLimit: 12, fan: 'silent', desc: 'Minimizes power and limits fan.' },
    { name: 'laptop', label: 'Bed Mode', powerLimit: 25, fan: 'silent', desc: 'Low noise and temperature curves.' },
    { name: 'table', label: 'Table Mode', powerLimit: 35, fan: 'balanced', desc: 'Optimal office compiling profiles.' },
    { name: 'performance', label: 'Performance', powerLimit: 45, fan: 'turbo', desc: 'Full compilation horsepower.' },
    { name: 'extreme', label: 'Extreme', powerLimit: 55, fan: 'max', desc: 'Max overclock cooling response.' }
  ];

  selectProfile(name: string) {
    this.activeProfile = name;
    this.onSelect.emit(name);
  }
}
