import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stress-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-stress">
      <div class="page-title-row">
        <h2 class="section-title">Synthetic CPU Stress</h2>
        <span class="page-sub">FPU workload on all logical cores</span>
      </div>

      <div class="card stress-config-card">
        <div class="stress-row">
          <span class="field-label">Duration</span>
          <div class="seg-control">
            <button *ngFor="let d of durationPresets" class="seg-btn"
              [class.seg-btn--active]="stressSelectedDuration === d.value"
              (click)="selectDuration.emit(d.value)">
              {{ d.label }}
            </button>
          </div>
        </div>
        <div class="stress-row">
          <span class="field-label">Intensity</span>
          <div class="seg-control">
            <button *ngFor="let i of intensityPresets" class="seg-btn"
              [class.seg-btn--active]="stressSelectedIntensity === i"
              (click)="selectIntensity.emit(i)">
              {{ i }}
            </button>
          </div>
        </div>
        <button class="apply-btn" [class.apply-btn--stop]="stressActive" (click)="toggleStress.emit()">
          {{ stressActive ? 'Stop Stress Test' : 'Start Stress Test' }}
        </button>
      </div>

      <div class="card thread-grid-card">
        <div class="thread-header">
          <span class="field-label">Core Burn Allocator</span>
          <span *ngIf="stressActive" class="thread-badge">● ACTIVE ({{ stressDuration }}s)</span>
        </div>
        <div class="thread-grid">
          <div *ngFor="let c of threadCores" class="thread-cell" [class.thread-cell--active]="stressActive">
            <span class="thread-id">T{{ c }}</span>
            <span class="thread-pct" [class.thread-pct--on]="stressActive">{{ stressActive ? '100%' : '0%' }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ─── STRESS PAGE ─── */
    .page-stress { display: flex; flex-direction: column; gap: 14px; }
    .page-title-row { display: flex; flex-direction: column; gap: 3px; }
    .page-sub { font-size: 10px; color: #555; }
    .stress-config-card { gap: 14px; }
    .stress-row { display: flex; flex-direction: column; gap: 6px; }
    .field-label { font-size: 10px; font-weight: 500; color: #666; text-transform: uppercase; letter-spacing: 0.06em; }
    .seg-control { display: flex; gap: 3px; background: #111; border: 1px solid #222; border-radius: 8px; padding: 2px; }
    .seg-btn {
      flex: 1; padding: 5px 0;
      background: transparent; border: 1px solid transparent;
      border-radius: 6px; color: #555; font-size: 11px; font-weight: 500;
      text-align: center; transition: background 150ms, color 150ms, border-color 150ms;
    }
    .seg-btn:hover { color: #999; }
    .seg-btn--active { background: #1a2a3a; border-color: #2a4a6a; color: #3b82f6; }

    /* ─── CARD ─── */
    .card {
      background: #171717;
      border: 1px solid #242424;
      border-radius: 14px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .section-title { font-size: 13px; font-weight: 500; color: #bbb; }

    /* ─── APPLY BUTTON ─── */
    .apply-btn {
      width: 100%; height: 34px;
      background: #1a2a3a; border: 1px solid #2a4a6a;
      border-radius: 8px; color: #3b82f6;
      font-size: 12px; font-weight: 500;
      transition: background 150ms;
      display: flex; align-items: center; justify-content: center;
      margin-top: auto;
    }
    .apply-btn:hover:not(:disabled) { background: #1e3040; }
    .apply-btn:disabled { opacity: 0.35; cursor: not-allowed; }
    .apply-btn--stop { background: #2a1a1a; border-color: #3a1a1a; color: #ef4444; }
    .apply-btn--stop:hover:not(:disabled) { background: #3b1e1e; }

    /* Thread grid card */
    .thread-grid-card { gap: 10px; }
    .thread-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #222; padding-bottom: 8px; }
    .thread-badge { font-size: 10px; color: #ef4444; font-weight: 500; }
    .thread-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
    .thread-cell {
      background: #1a1a1a; border: 1px solid #222; border-radius: 8px;
      padding: 8px; display: flex; flex-direction: column; align-items: center; gap: 3px;
      transition: background 300ms, border-color 300ms;
    }
    .thread-cell--active { background: #1a0f0f; border-color: #3a1a1a; }
    .thread-id { font-size: 9px; color: #444; font-weight: 600; }
    .thread-pct { font-size: 10px; color: #444; }
    .thread-pct--on { color: #ef4444; font-weight: 600; }
  `]
})
export class StressPanelComponent {
  @Input() stressActive: boolean = false;
  @Input() stressDuration: number = 0;
  @Input() stressTotal: number = 60;
  @Input() stressSelectedDuration: number = 60;
  @Input() stressSelectedIntensity: string = 'Heavy';

  @Output() selectDuration = new EventEmitter<number>();
  @Output() selectIntensity = new EventEmitter<string>();
  @Output() toggleStress = new EventEmitter<void>();

  readonly durationPresets = [
    { label: '30s',    value: 30   },
    { label: '1 min',  value: 60   },
    { label: '5 min',  value: 300  },
    { label: '10 min', value: 600  },
    { label: '30 min', value: 1800 }
  ];
  readonly intensityPresets = ['Light', 'Medium', 'Heavy', 'Maximum'];
  readonly threadCores = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16];
}
