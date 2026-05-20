import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stress-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="stress-banner overflow-hidden flex items-center justify-between px-4 bg-[#0f0f0f] border-b border-border-muted select-none transition-all duration-300 ease-in-out"
      [style.height]="running ? '36px' : '0px'"
      [style.opacity]="running ? '1' : '0'"
    >
      <!-- Fire icon -->
      <span class="text-accent-red animate-pulse flex items-center justify-center shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
          <path fill-rule="evenodd" d="M12.963 2.285a.75.75 0 0 0-1.071-.105 9.715 9.715 0 0 1-3.662 1.777C7.03 4.3 6 5.376 6 6.75c0 1.258.625 2.186 1.488 2.76.818.544 1.83.746 2.512.746a.75.75 0 0 0 .736-.834 5.25 5.25 0 0 1 .425-3.32.75.75 0 0 1 1.157-.117 9.716 9.716 0 0 1 2.424 5.12 3.75 3.75 0 0 0 2.222-2.12.75.75 0 0 0-.613-.984 6.75 6.75 0 0 1-3.42-8.794ZM4.002 18.003A8.966 8.966 0 0 0 12 22.002a8.966 8.966 0 0 0 7.998-3.999A9.957 9.957 0 0 1 12 16.002a9.956 9.956 0 0 1-7.998 2.001Z" clip-rule="evenodd" />
          <path fill-rule="evenodd" d="M19.1 11.603a.75.75 0 0 0-1.071-.105c-.131.11-.268.214-.412.311a3.75 3.75 0 0 0-5.714 3.753c.014.248-.19.46-.439.424A7.25 7.25 0 0 1 6 8.752c0-.528.095-1.033.268-1.5a.75.75 0 0 0-1.03-.918A8.75 8.75 0 0 0 12 20.252a8.75 8.75 0 0 0 7.1-8.649Z" clip-rule="evenodd" />
        </svg>
      </span>
      
      <!-- Progress Bar (flex-1) -->
      <div class="flex-1 mx-4 h-[3px] bg-[#1e1e1e] overflow-hidden">
        <div 
          class="h-full bg-accent-blue transition-all duration-300"
          [style.width.%]="percent"
        ></div>
      </div>
      
      <!-- Timer & Actions -->
      <div class="flex items-center gap-4 shrink-0">
        <span class="text-[10px] text-[#888] font-normal font-mono">{{ remainingTimeStr }} remaining</span>
        <button 
          type="button"
          (click)="stop()"
          class="stop-btn px-[10px] py-[2px] rounded-[4px] bg-[#2a1a1a] border border-[#3a1a1a] text-accent-red text-[10px] leading-none transition-colors duration-150"
        >
          Stop
        </button>
      </div>
    </div>
  `,
  styles: [`
    .stress-banner {
      transition: height 300ms cubic-bezier(0.4, 0, 0.2, 1), opacity 300ms ease;
    }
    .stop-btn:hover {
      background-color: #3b1e1e;
      border-color: #551a1a;
    }
  `]
})
export class StressBannerComponent implements OnChanges {
  @Input() running: boolean = false;
  @Input() elapsed: number = 0; // in seconds
  @Input() total: number = 60;   // in seconds
  
  @Output() onStop = new EventEmitter<void>();

  percent: number = 0;
  remainingTimeStr: string = '0s';

  ngOnChanges(changes: SimpleChanges) {
    this.calculateProgress();
  }

  stop() {
    this.onStop.emit();
  }

  private calculateProgress() {
    if (!this.total) {
      this.percent = 100;
      this.remainingTimeStr = '0s';
      return;
    }
    this.percent = Math.min((this.elapsed / this.total) * 100, 100);
    
    const remaining = Math.max(this.total - this.elapsed, 0);
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    
    if (mins > 0) {
      this.remainingTimeStr = `${mins}m ${secs}s`;
    } else {
      this.remainingTimeStr = `${secs}s`;
    }
  }
}
