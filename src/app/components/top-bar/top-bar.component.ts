import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="top-bar flex items-center justify-between px-4 h-[36px] bg-bar-rail border-b border-border-muted select-none">
      <!-- Left side: Brand Logo -->
      <div class="flex items-center gap-2">
        <span class="w-[6px] h-[6px] rounded-full bg-accent-blue"></span>
        <span class="text-[13px] font-medium text-[#e0e0e0] leading-none">VictusDeck</span>
        <span class="text-[10px] text-[#444] leading-none">HP Victus Tuning Suite</span>
      </div>
      
      <!-- Right side: Status Pill -->
      <div class="status-pill px-3 py-1 rounded-[4px] bg-[#1e1e1e] border border-[#2a2a2a] text-[#888] text-[10px] leading-none">
        {{ status }}
      </div>
    </div>
  `,
  styles: [`
    .top-bar {
      /* Pinned width layout helper */
    }
  `]
})
export class TopBarComponent {
  @Input() status: string = 'Bed Mode · 25W · 45°C';
}
