import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-nav-rail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="nav-rail flex flex-col items-center py-3 w-[44px] h-full bg-bar-rail border-r border-border-muted select-none gap-1 shrink-0">
      
      <!-- Quick Control Tab (⚡) -->
      <button 
        type="button"
        (click)="setPage('quick')"
        [class.active]="activePage === 'quick'"
        class="nav-btn flex items-center justify-center w-[32px] h-[32px] rounded-[6px] transition-all duration-150 group"
        title="Quick Control"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 text-[#555] group-hover:text-accent-blue transition-colors">
          <path fill-rule="evenodd" d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z" clip-rule="evenodd" />
        </svg>
      </button>
      
      <!-- Diagnostics Tab (📊) -->
      <button 
        type="button"
        (click)="setPage('diagnostics')"
        [class.active]="activePage === 'diagnostics'"
        class="nav-btn flex items-center justify-center w-[32px] h-[32px] rounded-[6px] transition-all duration-150 group"
        title="Ryzen Diagnostics"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 text-[#555] group-hover:text-accent-blue transition-colors">
          <path fill-rule="evenodd" d="M3 6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6Zm11.25 4.5a.75.75 0 0 0-1.5 0v6a.75.75 0 0 0 1.5 0v-6Zm-3.75 3a.75.75 0 0 0-1.5 0v3a.75.75 0 0 0 1.5 0v-3Zm7.5-6a.75.75 0 0 0-1.5 0v9a.75.75 0 0 0 1.5 0v-9Z" clip-rule="evenodd" />
        </svg>
      </button>
      
      <!-- Stress Test Tab (🔥) -->
      <button 
        type="button"
        (click)="setPage('stress')"
        [class.active]="activePage === 'stress'"
        class="nav-btn flex items-center justify-center w-[32px] h-[32px] rounded-[6px] transition-all duration-150 group"
        title="Stress Test Config"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 text-[#555] group-hover:text-accent-blue transition-colors">
          <path fill-rule="evenodd" d="M12.963 2.285a.75.75 0 0 0-1.071-.105 9.715 9.715 0 0 1-3.662 1.777C7.03 4.3 6 5.376 6 6.75c0 1.258.625 2.186 1.488 2.76.818.544 1.83.746 2.512.746a.75.75 0 0 0 .736-.834 5.25 5.25 0 0 1 .425-3.32.75.75 0 0 1 1.157-.117 9.716 9.716 0 0 1 2.424 5.12 3.75 3.75 0 0 0 2.222-2.12.75.75 0 0 0-.613-.984 6.75 6.75 0 0 1-3.42-8.794ZM4.002 18.003A8.966 8.966 0 0 0 12 22.002a8.966 8.966 0 0 0 7.998-3.999A9.957 9.957 0 0 1 12 16.002a9.956 9.956 0 0 1-7.998 2.001Z" clip-rule="evenodd" />
          <path fill-rule="evenodd" d="M19.1 11.603a.75.75 0 0 0-1.071-.105c-.131.11-.268.214-.412.311a3.75 3.75 0 0 0-5.714 3.753c.014.248-.19.46-.439.424A7.25 7.25 0 0 1 6 8.752c0-.528.095-1.033.268-1.5a.75.75 0 0 0-1.03-.918A8.75 8.75 0 0 0 12 20.252a8.75 8.75 0 0 0 7.1-8.649Z" clip-rule="evenodd" />
        </svg>
      </button>
      
    </div>
  `,
  styles: [`
    .nav-btn {
      background-color: transparent;
    }
    .nav-btn:hover:not(.active) {
      background-color: #161616;
    }
    .nav-btn:hover:not(.active) svg {
      color: #ccc;
    }
    .nav-btn.active {
      background-color: #1a2a3a;
    }
    .nav-btn.active svg {
      color: #3b82f6;
    }
  `]
})
export class NavRailComponent {
  @Input() activePage: 'quick' | 'diagnostics' | 'stress' = 'quick';
  @Output() pageChange = new EventEmitter<'quick' | 'diagnostics' | 'stress'>();

  setPage(page: 'quick' | 'diagnostics' | 'stress') {
    this.activePage = page;
    this.pageChange.emit(page);
  }
}
