import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stress-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stress-banner" [class.stress-banner--active]="active">
      <svg viewBox="0 0 24 24" fill="#ef4444" width="13" height="13" style="flex-shrink:0">
        <path d="M12.963 2.285a.75.75 0 0 0-1.071-.105 9.715 9.715 0 0 1-3.662 1.777C7.03 4.3 6 5.376 6 6.75c0 1.258.625 2.186 1.488 2.76.818.544 1.83.746 2.512.746a.75.75 0 0 0 .736-.834 5.25 5.25 0 0 1 .425-3.32.75.75 0 0 1 1.157-.117 9.716 9.716 0 0 1 2.424 5.12 3.75 3.75 0 0 0 2.222-2.12.75.75 0 0 0-.613-.984 6.75 6.75 0 0 1-3.42-8.794ZM4.002 18.003A8.966 8.966 0 0 0 12 22.002a8.966 8.966 0 0 0 7.998-3.999A9.957 9.957 0 0 1 12 16.002a9.956 9.956 0 0 1-7.998 2.001Z"/>
      </svg>
      <div class="stress-bar-track">
        <div class="stress-bar-fill" [style.width]="percent + '%'"></div>
      </div>
      <span class="stress-timer">{{ remaining }}</span>
      <button class="stress-stop-btn" (click)="stop.emit()">Stop</button>
    </div>
  `,
  styles: [`
    /* ─── STRESS BANNER ─── */
    .stress-banner {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0 110px 0 16px;
      background: #171717;
      border: 1px solid #242424;
      border-radius: 10px;
      margin: 0 59px 0 16px;
      flex-shrink: 0;
      height: 0;
      overflow: hidden;
      opacity: 0;
      transition: height 280ms cubic-bezier(0.4,0,0.2,1), opacity 200ms ease, margin 280ms cubic-bezier(0.4,0,0.2,1);
    }
    .stress-banner--active { height: 38px; opacity: 1; margin: 16px 59px 8px 16px; }
    .stress-bar-track { flex: 1; height: 4px; background: #1e1e1e; border-radius: 9999px; overflow: hidden; }
    .stress-bar-fill { height: 100%; background: #3b82f6; border-radius: 9999px; transition: width 1s linear; }
    .stress-timer { font-size: 10px; color: #666; font-variant-numeric: tabular-nums; }
    .stress-stop-btn {
      padding: 3px 10px; background: #2a1a1a; border: 1px solid #3a1a1a;
      border-radius: 6px; color: #ef4444; font-size: 10px;
      transition: background 150ms;
    }
    .stress-stop-btn:hover { background: #3b1e1e; }
  `]
})
export class StressBannerComponent {
  @Input() active: boolean = false;
  @Input() percent: number = 0;
  @Input() remaining: string = '0s';
  @Output() stop = new EventEmitter<void>();
}
