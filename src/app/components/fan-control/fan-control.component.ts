import { Component, Input, Output, EventEmitter, inject, OnDestroy, OnInit, DoCheck } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FanCurveService } from '../../fan-curve.service';

@Component({
  selector: 'app-fan-control',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="card fan-card">
      <div class="card-header">
        <h2 class="section-title">Fan Control</h2>
        <div class="mode-segments">
          <button class="segment-btn" [class.segment-btn--active]="mode === 'hp-auto'" (click)="setMode('hp-auto')">HP Auto</button>
          <button class="segment-btn" [class.segment-btn--active]="mode === 'smart-auto'" (click)="setMode('smart-auto')">Smart Auto</button>
          <button class="segment-btn" [class.segment-btn--active]="mode === 'manual'" (click)="setMode('manual')">Manual</button>
        </div>
      </div>



      <div class="slider-block" [class.slider-block--disabled]="mode !== 'manual' && mode !== 'smart-auto'">
        <div class="slider-labels">
          <span class="slider-edge">Silent</span>
          <span class="slider-edge">Max</span>
        </div>
        <input type="range" class="range-slider" id="fan-slider"
          [min]="advanced ? 0 : 8" max="39" step="1"
          [(ngModel)]="level"
          (ngModelChange)="levelChange.emit($event)"
          [disabled]="mode !== 'manual'"
          [ngStyle]="{'--fill-pct': fanSliderFill}"/>
        <div class="fan-readout-row">
          <div class="fan-readout">
            <span class="readout-big">{{ mode === 'hp-auto' ? 'Auto (HP)' : getRpm(level) + ' RPM' }}</span>
            <span class="readout-sub">{{ mode === 'hp-auto' ? 'Thermal policy' : (mode === 'smart-auto' ? 'Smart Auto · L' + level : 'Manual · L' + level) }}</span>
          </div>
          <button class="config-gear-btn"
            [style.visibility]="mode === 'smart-auto' ? 'visible' : 'hidden'"
            [style.opacity]="mode === 'smart-auto' ? '1' : '0'"
            [style.pointer-events]="mode === 'smart-auto' ? 'auto' : 'none'"
            (click)="configureCurve.emit()" title="Configure Curve">
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
              <path fill-rule="evenodd" d="M11.078 2.25c-.77 0-1.365.628-1.395 1.398-.031.786-.05 1.573-.058 2.36l-.001.077c-.504.053-1.002.138-1.492.256-.474-.474-.954-.94-1.427-1.408-.56-.554-1.464-.537-1.996.064l-.999 1.13c-.504.57-.468 1.455.074 1.993.473.468.952.94 1.43 1.408a8.318 8.318 0 0 0-.256 1.493l-.077.001c-.787.008-1.574.027-2.36.058a1.4 1.4 0 0 0-1.399 1.395l-.001 1.503c0 .77.628 1.366 1.398 1.396.786.03 1.573.05 2.36.058l.077.001c.053.504.138 1.002.256 1.492-.474.474-.94.954-1.408 1.427a1.402 1.402 0 0 0 .064 1.996l1.13.999c.57.504 1.455.468 1.993-.074.468-.473.94-.952 1.408-1.43.49.118.988.203 1.492.256l.001.077c.008.787.027 1.574.058 2.36a1.4 1.4 0 0 0 1.395 1.399l1.503.001c.77 0 1.366-.628 1.396-1.398.03-.786.05-1.573.058-2.36l.001-.077c.504-.053 1.002-.138 1.492-.256.474.474.954.94 1.427 1.408.56.554 1.464.537 1.996-.064l.999-1.13c.504-.57.468-1.455-.074-1.993-.473-.468-.952-.94-1.43-1.408.118-.49.203-.988.256-1.492l.077-.001c.787-.008 1.574-.027 2.36-.058a1.4 1.4 0 0 0 1.399-1.395l.001-1.503c0-.77-.628-1.366-1.398-1.396-.786-.03-1.573-.05-2.36-.058l-.077-.001a8.318 8.318 0 0 0-.256-1.492c.474-.474.94-.954 1.408-1.427a1.402 1.402 0 0 0-.064-1.996l-1.13-.999c-.57-.504-1.455-.468-1.993.074-.468.473-.94.952-1.408 1.43a8.306 8.306 0 0 0-1.492-.256l-.001-.077c-.008-.787-.027-1.574-.058-2.36a1.4 1.4 0 0 0-1.425-.001l-1.505-.001Zm-1.578 9.75a2.5 2.5 0 1 1 5 0 2.5 2.5 0 0 1-5 0Z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Safety Limits Checkbox Footer -->
      <div class="safety-limits-row">
        <label class="advanced-checkbox-label">
          <input type="checkbox" [ngModel]="advanced" (ngModelChange)="onAdvancedChange($event)" class="adv-checkbox" />
          <span class="adv-text adv-text--danger">Disable Safety Limits (Unlock 0 RPM)</span>
          <span *ngIf="advanced" class="danger-icon">⚠️</span>
        </label>
      </div>

      <!-- Footer Action & Status Slot -->
      <div style="position: relative; height: 34px; width: 100%;">
        <button class="apply-btn" 
          [style.display]="mode === 'manual' ? 'flex' : 'none'" 
          (click)="apply.emit()">
          Apply Fan
        </button>
        <div class="active-badge" 
          [style.display]="mode === 'smart-auto' ? 'flex' : 'none'">
          Smart Fan Active
        </div>
        <div class="active-badge inactive" 
          [style.display]="mode === 'hp-auto' ? 'flex' : 'none'">
          System Managed
        </div>
      </div>
    </section>

    <!-- Fullscreen Warning Overlay -->
    <div class="warning-overlay" *ngIf="showAdvancedWarning" (click)="cancelAdvanced()">
      <div class="warning-modal" (click)="$event.stopPropagation()">
        <span class="warning-icon-large">⚠️</span>
        <h3 class="warning-modal-title">WARNING</h3>
        <p class="warning-modal-text">Fan turn-off at 0 RPM unlocked. Proceed with caution.</p>
        <div style="display: flex; gap: 12px; justify-content: center; width: 100%;">
          <button class="warning-modal-btn" style="background: transparent; border: 1px solid rgba(255, 255, 255, 0.15); color: #cbd5e1;" (click)="cancelAdvanced()">Cancel</button>
          <button class="warning-modal-btn" [disabled]="countdown > 0" (click)="acceptAdvanced()">
            {{ countdown > 0 ? 'I Understand (' + countdown + 's)' : 'I Understand' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card {
      position: relative;
      z-index: 1;
      background: rgba(255, 255, 255, 0.04);
      backdrop-filter: blur(28px) brightness(1.08) saturate(160%);
      -webkit-backdrop-filter: blur(28px) brightness(1.08) saturate(160%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 14px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      height: 100%;
      box-shadow:
        0 8px 32px 0 rgba(0, 0, 0, 0.5),
        inset 0 1px 0 rgba(255, 255, 255, 0.12),
        inset 0 -1px 0 rgba(0, 0, 0, 0.2);
      overflow: hidden;
    }
    .card::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.07) 0%,
        rgba(255, 255, 255, 0.01) 40%,
        rgba(255, 255, 255, 0.00) 60%
      );
      pointer-events: none;
      z-index: 0;
    }
    .card > * { position: relative; z-index: 1; }
    .fan-card { flex: 1; }
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .section-title { font-size: 13px; font-weight: 600; color: #fff; letter-spacing: 0.02em; }

    /* ─── SEGMENT CONTROL ─── */
    .mode-segments {
      display: flex;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      padding: 2px;
    }
    .segment-btn {
      background: none;
      border: 1px solid transparent;
      color: #888;
      font-size: 10px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 150ms ease;
    }
    .segment-btn:hover {
      color: #ccc;
      background: rgba(255, 255, 255, 0.03);
    }
    .segment-btn--active {
      color: #3b82f6;
      background: rgba(59, 130, 246, 0.15);
      border-color: rgba(59, 130, 246, 0.1);
    }

    /* ─── SLIDER ─── */
    .slider-block { display: flex; flex-direction: column; gap: 6px; }
    .slider-block--disabled { opacity: 0.35; pointer-events: none; }
    .slider-labels { display: flex; justify-content: space-between; }
    .slider-edge { font-size: 12.5px; color: #bbb; }

    .range-slider {
      -webkit-appearance: none;
      appearance: none;
      width: 100%;
      height: 5px;
      border-radius: 9999px;
      background: linear-gradient(
        to right,
        #3b82f6 var(--fill-pct, 0%),
        rgba(255, 255, 255, 0.08) var(--fill-pct, 0%)
      );
      box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.4);
      outline: none;
      cursor: pointer;
      display: block;
    }
    .range-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 18px; height: 18px;
      border-radius: 50%;
      background: #fff;
      border: 2px solid #3b82f6;
      cursor: pointer;
      transition: transform 150ms ease, box-shadow 150ms ease;
      position: relative;
      z-index: 1;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5), 0 0 0 0 rgba(59, 130, 246, 0.35);
    }
    .range-slider::-webkit-slider-thumb:hover {
      transform: scale(1.15);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5), 0 0 0 4px rgba(59, 130, 246, 0.2);
    }
    .range-slider::-moz-range-thumb {
      width: 18px; height: 18px;
      border-radius: 50%;
      background: #fff;
      border: 2px solid #3b82f6;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
    }
    .range-slider:disabled { opacity: 0.4; cursor: not-allowed; }

    .fan-readout-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .fan-readout { display: flex; flex-direction: column; gap: 1px; }
    .readout-big { font-size: 22px; font-weight: 600; color: #fff; line-height: 1.1; text-shadow: 0 0 12px rgba(59, 130, 246, 0.25); }
    .readout-sub { font-size: 12.5px; color: #aaa; }

    .config-gear-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 50%;
      color: #888;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 200ms ease;
    }
    .config-gear-btn:hover {
      color: #3b82f6;
      background: rgba(59, 130, 246, 0.12);
      border-color: rgba(59, 130, 246, 0.3);
      transform: rotate(45deg);
    }

    /* ─── APPLY BUTTON & BADGES ─── */
    .apply-btn {
      width: 100%; height: 34px;
      background: rgba(59, 130, 246, 0.12);
      border: 1px solid rgba(59, 130, 246, 0.35);
      border-radius: 8px; color: #3b82f6;
      font-size: 12px; font-weight: 600;
      transition: all 200ms ease;
      display: flex; align-items: center; justify-content: center;
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
      cursor: pointer;
    }
    .apply-btn:hover {
      background: rgba(59, 130, 246, 0.22);
      border-color: rgba(59, 130, 246, 0.5);
      color: #60a5fa;
      box-shadow: 0 4px 16px rgba(59, 130, 246, 0.25);
    }
    .active-badge {
      width: 100%;
      height: 34px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px; font-weight: 700; color: #10b981;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.2);
      border-radius: 6px; text-align: center;
      text-transform: uppercase; letter-spacing: 0.05em;
    }
    .active-badge.inactive {
      color: #f59e0b;
      background: rgba(245, 158, 11, 0.1);
      border-color: rgba(245, 158, 11, 0.2);
    }
    @media (max-width: 750px) {
      .readout-big { font-size: 18px !important; }
      .readout-sub { font-size: 11px !important; }
      .section-title { font-size: 11px !important; }
      .segment-btn { font-size: 9px !important; padding: 3px 6px !important; }
    }

    /* ─── ADVANCED CHECKBOX ─── */
    .safety-limits-row {
      display: flex;
      justify-content: flex-start;
      margin-top: auto;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      padding-top: 10px;
      margin-bottom: 2px;
    }
    .advanced-checkbox-label {
      display: flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      user-select: none;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 6px;
      padding: 4px 8px;
      transition: all 150ms ease;
    }
    .advanced-checkbox-label:hover {
      background: rgba(255, 255, 255, 0.06);
      border-color: rgba(255, 255, 255, 0.15);
    }
    .adv-checkbox {
      accent-color: #ef4444;
      cursor: pointer;
      width: 12px;
      height: 12px;
    }
    .adv-text {
      font-size: 10px;
      font-weight: 600;
      color: #ccc;
    }
    .adv-text--danger {
      color: #ef4444 !important;
      font-weight: bold !important;
    }
    .danger-icon {
      font-size: 11px;
      margin-left: 2px;
      display: inline-block;
    }

    /* ─── WARNING OVERLAY ─── */
    .warning-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: fadeIn 200ms ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .warning-modal {
      background: #17171a;
      border: 1px solid rgba(239, 68, 68, 0.25);
      border-radius: 16px;
      padding: 30px;
      width: 320px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(239, 68, 68, 0.1);
      animation: scaleIn 250ms cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    @keyframes scaleIn {
      from { transform: scale(0.9); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    .warning-icon-large {
      font-size: 56px;
      margin-bottom: 16px;
      display: inline-block;
      filter: drop-shadow(0 0 10px rgba(239, 68, 68, 0.5));
      animation: modal-danger-blink 500ms ease-in-out 3;
    }
    @keyframes modal-danger-blink {
      0%, 100% { transform: scale(1); opacity: 1; filter: drop-shadow(0 0 10px rgba(239, 68, 68, 0.6)); }
      50% { transform: scale(1.15); opacity: 0.2; filter: drop-shadow(0 0 2px rgba(239, 68, 68, 0.1)); }
    }
    .warning-modal-title {
      font-size: 16px;
      font-weight: 700;
      color: #ef4444;
      margin-bottom: 8px;
      letter-spacing: 0.02em;
    }
    .warning-modal-text {
      font-size: 12.5px;
      color: #ccc;
      line-height: 1.5;
      margin-bottom: 20px;
    }
    .warning-modal-btn {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.4);
      color: #ef4444;
      border-radius: 8px;
      padding: 8px 24px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 150ms ease;
    }
    .warning-modal-btn:hover:not(:disabled) {
      background: rgba(239, 68, 68, 0.25);
      border-color: rgba(239, 68, 68, 0.6);
      box-shadow: 0 0 12px rgba(239, 68, 68, 0.2);
    }
    .warning-modal-btn:disabled {
      opacity: 0.45;
      cursor: not-allowed;
      background: rgba(255, 255, 255, 0.08) !important;
      border-color: rgba(255, 255, 255, 0.08) !important;
      color: #64748b !important;
      box-shadow: none !important;
    }
  `]
})
export class FanControlComponent implements OnInit, OnDestroy, DoCheck {
  @Input() mode: 'hp-auto' | 'smart-auto' | 'manual' = 'manual';
  @Input() level: number = 30;
  @Output() modeChange = new EventEmitter<'hp-auto' | 'smart-auto' | 'manual'>();
  @Output() levelChange = new EventEmitter<number>();
  @Output() apply = new EventEmitter<void>();
  @Output() configureCurve = new EventEmitter<void>();

  private fanCurveService = inject(FanCurveService);

  showAdvancedWarning = false;
  countdown = 3;
  timer: any = null;
  localAdvanced = false;

  get advanced(): boolean {
    return this.localAdvanced;
  }

  get fanSliderFill(): string {
    const minVal = this.advanced ? 0 : 8;
    const range = this.advanced ? 39 : 31;
    return `${((this.level - minVal) / range) * 100}%`;
  }

  ngOnInit() {
    this.localAdvanced = this.fanCurveService.config.advanced;
  }

  ngDoCheck() {
    if (this.localAdvanced !== this.fanCurveService.config.advanced && !this.showAdvancedWarning) {
      this.localAdvanced = this.fanCurveService.config.advanced;
    }
  }

  setMode(newMode: 'hp-auto' | 'smart-auto' | 'manual') {
    this.mode = newMode;
    this.modeChange.emit(newMode);
  }

  onAdvancedChange(checked: boolean) {
    if (checked) {
      this.localAdvanced = true;
      this.showAdvancedWarning = true;
      this.countdown = 3;
      if (this.timer) clearInterval(this.timer);
      this.timer = setInterval(() => {
        if (this.countdown > 0) {
          this.countdown--;
        } else {
          clearInterval(this.timer);
          this.timer = null;
        }
      }, 1000);
    } else {
      this.localAdvanced = false;
      const config = { ...this.fanCurveService.config, advanced: false };
      this.fanCurveService.saveConfig(config);
      
      if (this.level < 8) {
        this.level = 8;
        this.levelChange.emit(8);
      }
    }
  }

  acceptAdvanced() {
    const config = { ...this.fanCurveService.config, advanced: true };
    this.fanCurveService.saveConfig(config);
    this.localAdvanced = true;
    this.showAdvancedWarning = false;
  }

  cancelAdvanced() {
    this.localAdvanced = false;
    this.showAdvancedWarning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  getRpm(level: number): number {
    if (level === 0)                return 0;
    if (level === 8)                return 800;
    if (level === 9)                return 1200;
    if (level >= 10 && level <= 19) return 1600 + (level - 10) * 100;
    if (level === 29)               return 4200;
    if (level >= 20 && level <= 28) return 3200 + (level - 20) * 100;
    if (level >= 30)                return 4800 + (level - 30) * 100;
    return 800;
  }

  ngOnDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }
}
