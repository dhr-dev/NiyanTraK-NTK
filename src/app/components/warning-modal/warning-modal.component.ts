import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';

@Component({
  selector: 'app-warning-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay">
      <div class="modal-card" [class.modal-card--compat]="!systemInfo?.isHp">
        
        <!-- Header -->
        <div class="modal-header">
          <svg class="warning-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2>{{ !systemInfo?.isHp ? 'CRITICAL COMPATIBILITY WARNING' : 'SAFETY & LIABILITY DISCLAIMER' }}</h2>
        </div>

        <!-- Body -->
        <div class="modal-body">
          <ng-container *ngIf="!systemInfo?.isHp; else standardDisclaimer">
            <p class="warning-highlight">Compatibility Warning: Non-HP machine detected.</p>
            <p>This utility uses custom hardware control systems designed specifically for HP Omen, Victus, and Pavilion laptops.</p>
            <p class="danger-text">Running this on other systems can cause severe instability, system crashes, or hardware damage.</p>
          </ng-container>
          <ng-template #standardDisclaimer>
            <p class="warning-highlight">Caution: Modifying low-level hardware settings carries risks.</p>
            <p>This utility overrides default fan speeds and CPU limits. Incorrect configurations can cause overheating or instability.</p>
            <p class="danger-text">By proceeding, you assume all liability. The developer provides this software "as-is" and is NOT responsible for any hardware damage or data loss.</p>
          </ng-template>
        </div>

        <!-- Consent Box -->
        <div class="modal-consent">
          <label class="consent-checkbox-label">
            <input type="checkbox" [(ngModel)]="checkboxChecked" class="consent-checkbox" />
            <span class="checkbox-custom"></span>
            <span class="consent-text">
              {{ !systemInfo?.isHp ? 'I understand this is an unsupported machine and I wish to bypass at my own risk.' : 'I accept these terms and agree that the developer is not responsible for any issues.' }}
            </span>
          </label>
        </div>

        <!-- Footer / Action Buttons -->
        <div class="modal-footer">
          <button class="btn btn-exit" (click)="onExit()">
            Exit Application
          </button>
          <button class="btn btn-proceed" 
                  [disabled]="!checkboxChecked || countdown > 0" 
                  (click)="onProceed()">
            {{ countdown > 0 ? 'Proceed (' + countdown + 's)' : 'Proceed Anyway' }}
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(4, 4, 6, 0.88);
      backdrop-filter: blur(14px);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      animation: fade-in 200ms ease-out;
    }
    
    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .modal-card {
      background: rgba(22, 22, 26, 0.85);
      border: 1px solid rgba(245, 158, 11, 0.25);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7), 0 0 40px rgba(245, 158, 11, 0.05);
      border-radius: 16px;
      max-width: 520px;
      width: 100%;
      padding: 28px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      color: #e2e8f0;
      font-family: inherit;
      animation: slide-up 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    
    .modal-card--compat {
      border-color: rgba(239, 68, 68, 0.3);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7), 0 0 40px rgba(239, 68, 68, 0.05);
    }

    @keyframes slide-up {
      from { transform: translateY(20px) scale(0.96); opacity: 0; }
      to { transform: translateY(0) scale(1); opacity: 1; }
    }

    .modal-header {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .warning-icon {
      width: 28px;
      height: 28px;
      flex-shrink: 0;
    }
    
    .modal-card--compat .warning-icon {
      stroke: #ef4444;
      color: #ef4444;
    }
    
    .modal-card:not(.modal-card--compat) .warning-icon {
      stroke: #f59e0b;
      color: #f59e0b;
    }

    .modal-header h2 {
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 0.03em;
      margin: 0;
    }
    
    .modal-card--compat .modal-header h2 {
      color: #ef4444;
    }

    .modal-card:not(.modal-card--compat) .modal-header h2 {
      color: #f59e0b;
    }

    .modal-body {
      font-size: 12.5px;
      line-height: 1.6;
      color: #94a3b8;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .warning-highlight {
      font-size: 13.5px;
      font-weight: 600;
      color: #f8fafc;
    }

    .danger-text {
      color: #f87171;
      font-weight: 500;
    }

    .modal-body ul {
      margin-left: 18px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .modal-consent {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      padding: 14px 16px;
    }

    .consent-checkbox-label {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      cursor: pointer;
      user-select: none;
    }

    .consent-checkbox {
      position: absolute;
      opacity: 0;
      cursor: pointer;
      height: 0; width: 0;
    }

    .checkbox-custom {
      width: 18px;
      height: 18px;
      background: rgba(255, 255, 255, 0.04);
      border: 1.5px solid rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      flex-shrink: 0;
      position: relative;
      transition: all 150ms ease;
    }

    .consent-checkbox-label:hover .checkbox-custom {
      border-color: rgba(255, 255, 255, 0.4);
      background: rgba(255, 255, 255, 0.08);
    }

    .consent-checkbox:checked ~ .checkbox-custom {
      background: #3b82f6;
      border-color: #3b82f6;
    }

    .checkbox-custom::after {
      content: "";
      position: absolute;
      display: none;
      left: 5px;
      top: 2px;
      width: 5px;
      height: 9px;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }

    .consent-checkbox:checked ~ .checkbox-custom::after {
      display: block;
    }

    .consent-text {
      font-size: 11.5px;
      line-height: 1.5;
      color: #cbd5e1;
      margin-top: 1px;
    }

    .modal-footer {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 8px;
    }

    .btn {
      padding: 8px 18px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 200ms ease;
      font-family: inherit;
    }

    .btn-exit {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #94a3b8;
    }

    .btn-exit:hover {
      background: rgba(255, 255, 255, 0.05);
      color: #f1f5f9;
      border-color: rgba(255, 255, 255, 0.3);
    }

    .btn-proceed {
      background: #f59e0b;
      border: 1px solid #f59e0b;
      color: #0f0f13;
    }

    .modal-card--compat .btn-proceed {
      background: #ef4444;
      border-color: #ef4444;
      color: #ffffff;
    }

    .btn-proceed:hover:not(:disabled) {
      filter: brightness(1.15);
      box-shadow: 0 0 12px rgba(245, 158, 11, 0.2);
    }

    .modal-card--compat .btn-proceed:hover:not(:disabled) {
      box-shadow: 0 0 12px rgba(239, 68, 68, 0.2);
    }

    .btn-proceed:disabled {
      opacity: 0.45;
      cursor: not-allowed;
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.08);
      color: #64748b;
      box-shadow: none;
    }
  `]
})
export class WarningModalComponent implements OnInit, OnDestroy {
  @Input() systemInfo: { manufacturer: string; model: string; isHp: boolean } | null = null;
  @Output() accepted = new EventEmitter<void>();
  @Output() exit = new EventEmitter<void>();

  checkboxChecked = false;
  countdown = 5;
  private timer: any = null;

  ngOnInit() {
    this.startTimer();
  }

  startTimer() {
    this.countdown = 5;
    this.timer = setInterval(() => {
      if (this.countdown > 0) {
        this.countdown--;
      } else {
        this.clearTimer();
      }
    }, 1000);
  }

  clearTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  ngOnDestroy() {
    this.clearTimer();
  }

  onExit() {
    this.exit.emit();
    try {
      getCurrentWebviewWindow().close();
    } catch (e) {
      console.error('Failed to close window via webview api:', e);
    }
  }

  onProceed() {
    if (this.checkboxChecked && this.countdown === 0) {
      this.accepted.emit();
    }
  }
}
