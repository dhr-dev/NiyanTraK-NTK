import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bezel-strips',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- BEZEL RIBBONS: Stress on right edge -->
    <div class="bezel-wrap">
      <!-- Stress ribbon: always visible, toggles stress test -->
      <div class="ribbon ribbon--stress"
        [class.ribbon--stress-on]="stressActive"
        (click)="toggleStress.emit()"
        title="{{ stressActive ? 'Stop Stress Test' : 'Start Stress Test' }}"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
          <path fill-rule="evenodd" d="M12.963 2.285a.75.75 0 0 0-1.071-.105 9.715 9.715 0 0 1-3.662 1.777C7.03 4.3 6 5.376 6 6.75c0 1.258.625 2.186 1.488 2.76.818.544 1.83.746 2.512.746a.75.75 0 0 0 .736-.834 5.25 5.25 0 0 1 .425-3.32.75.75 0 0 1 1.157-.117 9.716 9.716 0 0 1 2.424 5.12 3.75 3.75 0 0 0 2.222-2.12.75.75 0 0 0-.613-.984 6.75 6.75 0 0 1-3.42-8.794ZM4.002 18.003A8.966 8.966 0 0 0 12 22.002a8.966 8.966 0 0 0 7.998-3.999A9.957 9.957 0 0 1 12 16.002a9.956 9.956 0 0 1-7.998 2.001Z" clip-rule="evenodd"/>
        </svg>
        <span class="ribbon-text">{{ stressActive ? '■ STOP' : 'STRESS' }}</span>
      </div>
    </div>
  `,
  styles: [`
    /* ─── BEZEL RIBBONS ─── */
    .bezel-wrap {
      position: absolute;
      right: 0;
      top: 44px;
      z-index: 40;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    /* Shared ribbon base: narrowed to 58px for a cleaner bezel profile */
    .ribbon {
      width: 58px;
      height: 52px;
      background: #111827;
      border: 1px solid #1e3a5f;
      border-right: none;
      border-left: 3px solid #2563eb;
      border-radius: 12px 0 0 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      cursor: pointer;
      pointer-events: auto;
      color: #4d90d6;
      transition: transform 200ms ease, background 150ms, border-color 150ms, color 150ms;
      user-select: none;
    }
    .ribbon:hover {
      transform: translateX(-5px);
      background: #152035;
      border-color: #3b82f6;
      border-left-color: #3b82f6;
      color: #7ab8f5;
    }
    /* Stress ribbon: same shape, red accent */
    .ribbon--stress {
      border-color: #3a1220;
      border-left-color: #7f1d1d;
      color: #b45555;
    }
    .ribbon--stress:hover {
      background: #1a0a0a;
      border-color: #ef4444;
      border-left-color: #ef4444;
      color: #fca5a5;
      transform: translateX(-5px);
    }
    /* Stress active: pulsing red glow */
    .ribbon--stress-on {
      background: #1a0a0a;
      border-color: #ef4444;
      border-left-color: #ef4444;
      color: #fca5a5;
      transform: translateX(-5px);
      animation: stress-glow 1.6s infinite alternate;
    }
    @keyframes stress-glow {
      from { box-shadow: -3px 0 6px rgba(239,68,68,0.25); }
      to   { box-shadow: -3px 0 14px rgba(239,68,68,0.6); }
    }
    .ribbon-text { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; }
  `]
})
export class BezelStripsComponent {
  @Input() stressActive: boolean = false;
  @Output() toggleStress = new EventEmitter<void>();
}
