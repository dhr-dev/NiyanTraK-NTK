import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- TOP BAR -->
    <header class="topbar">
      <div class="brand">
        <img class="brand-logo" src="assets/icons/Workmark-transparent-2.png" alt="NiyanTraK">
        <span class="brand-sep" *ngIf="cpuName">|</span>
        <span class="brand-sub" *ngIf="cpuName">{{ cpuName }}</span>
      </div>

      <!-- DYNAMIC ISLAND CAPSULE -->
      <div class="dynamic-island-container">
        <!-- Main Status Island -->
        <div class="dynamic-island" [class.dynamic-island--active]="activeToast" [class.dynamic-island--success]="activeToast?.type === 'success'" [class.dynamic-island--error]="activeToast?.type === 'error'" [class.dynamic-island--info]="activeToast?.type === 'info'">
          <ng-container *ngIf="!activeToast; else toastTemplate">
            <!-- Idle state: displays active profile -->
            <span class="island-icon">⚡</span>
            <span class="island-label">{{ activeProfileLabel ? activeProfileLabel.toUpperCase() : 'MANUAL' }}</span>
          </ng-container>
          <ng-template #toastTemplate>
            <!-- Toast morph state -->
            <span class="island-icon-toast">
              <ng-container *ngIf="activeToast.type === 'success'">✓</ng-container>
              <ng-container *ngIf="activeToast.type === 'error'">⚠</ng-container>
              <ng-container *ngIf="activeToast.type === 'info'">
                <svg class="island-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="10" height="10" style="display: block;">
                  <circle cx="12" cy="12" r="10" stroke="rgba(59, 130, 246, 0.2)"></circle>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="#3b82f6" stroke-linecap="round"></path>
                </svg>
              </ng-container>
            </span>
            <span class="island-message-toast">{{ activeToast.message }}</span>
          </ng-template>
        </div>

        <!-- Twin Warning Island -->
        <div class="dynamic-island dynamic-island--warning" *ngIf="unsavedChanges">
          <span class="island-icon warning-pulse">⚠️</span>
          <span class="island-label warning-text">UNSAVED CHANGES</span>
        </div>
      </div>

      <div class="status-pill">{{ statusText }}</div>
    </header>
  `,
  styles: [`
    /* ─── TOPBAR ─── */
    .topbar {
      height: 62px;
      min-height: 62px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 16px 0px 16px;
      background: #0d0d0d;
      border-bottom: none;
      flex-shrink: 0;
      user-select: none;
      position: relative;
    }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand-logo { height: 102px; object-fit: contain; display: block; margin-left: -16px; }
    .brand-sep { color: #333; font-size: 14px; font-weight: 300; margin: 0 -4px; }
    .brand-sub { font-size: 11px; color: #777; font-weight: 600; font-family: inherit; letter-spacing: 0.02em; }
    .status-pill {
      padding: 4px 12px;
      border-radius: 8px;
      background: #1e1e1e;
      border: 1px solid #2a2a2a;
      font-size: 11px;
      color: #888;
    }

    /* ─── DYNAMIC ISLAND ─── */
    .dynamic-island-container {
      position: absolute;
      left: 50%;
      top: 15px;
      transform: translateX(-50%);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      pointer-events: none;
      gap: 12px;
    }
    .dynamic-island {
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(20, 20, 22, 0.85);
      border: 1.5px solid rgba(59, 130, 246, 0.25);
      backdrop-filter: blur(12px);
      padding: 6px 14px;
      border-radius: 9999px;
      min-width: 140px;
      justify-content: center;
      transition: all 400ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
      box-shadow: 0 4px 12px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.03), 0 0 10px rgba(59, 130, 246, 0.08);
      color: #999;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.05em;
    }
    .dynamic-island .island-icon {
      font-size: 12px;
      color: #3b82f6;
      transition: transform 300ms ease;
    }
    .dynamic-island:hover .island-icon {
      transform: scale(1.15) rotate(15deg);
    }
    
    /* Active toast state: spring morph expansion */
    .dynamic-island--active {
      min-width: 280px;
      max-width: 450px;
      padding: 8px 20px;
      background: rgba(15, 15, 17, 0.95);
      color: #e0e0e0;
      animation: island-spring 350ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    
    .dynamic-island--warning {
      border-color: rgba(245, 158, 11, 0.4);
      box-shadow: 0 4px 12px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.03), 0 0 12px rgba(245, 158, 11, 0.15);
      animation: island-entry 350ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    
    .warning-pulse {
      color: #f59e0b;
      animation: warning-blink 1.5s infinite ease-in-out;
      display: inline-block;
    }
    
    .warning-text {
      color: #f59e0b;
      font-weight: 700;
    }
    
    @keyframes island-entry {
      0% {
        opacity: 0;
        transform: scale(0.8) translateY(-10px);
      }
      100% {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }
    
    @keyframes warning-blink {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.6; transform: scale(1.1); }
    }
    
    .dynamic-island--success {
      border-color: #22c55e;
      box-shadow: 0 0 15px rgba(34, 197, 94, 0.25), 0 8px 32px rgba(0,0,0,0.7);
    }
    .dynamic-island--error {
      border-color: #ef4444;
      box-shadow: 0 0 15px rgba(239, 68, 68, 0.25), 0 8px 32px rgba(0,0,0,0.7);
    }
    .dynamic-island--info {
      border-color: #3b82f6;
      box-shadow: 0 0 15px rgba(59, 130, 246, 0.25), 0 8px 32px rgba(0,0,0,0.7);
    }
    
    .island-icon-toast {
      font-size: 11px;
      font-weight: 700;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    
    .dynamic-island--success .island-icon-toast { background: rgba(34,197,94,0.15); color: #22c55e; }
    .dynamic-island--error .island-icon-toast { background: rgba(239,68,68,0.15); color: #ef4444; }
    .dynamic-island--info .island-icon-toast { background: rgba(59,130,246,0.15); color: #3b82f6; }
    
    .island-spinner {
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .island-message-toast {
      font-size: 12px;
      font-weight: 500;
      letter-spacing: normal;
      text-transform: none;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    @keyframes island-spring {
      0% { transform: scale(0.9); }
      70% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
  `]
})
export class TopBarComponent {
  @Input() statusText: string = '';
  @Input() activeProfileLabel: string = '';
  @Input() activeToast: any = null;
  @Input() cpuName: string = '';
  @Input() unsavedChanges: boolean = false;
}
