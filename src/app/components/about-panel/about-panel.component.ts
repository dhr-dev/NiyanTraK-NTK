import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { openUrl } from '@tauri-apps/plugin-opener';

@Component({
  selector: 'app-about-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="about-container">
      <!-- HERO HEADER (Blended Style, No Logo image) -->
      <div class="about-hero-section">
        <div class="app-title-section">
          <h2 class="about-title">About NiyanTraK</h2>
          <span class="app-version">v4.0.0-beta.1</span>
        </div>
        <p class="about-subtitle">Premium Hardware Control Suite for HP Laptops</p>
        <p class="hero-desc">
          An advanced system utility built specifically for HP Victus, Pavilion, and Omen series laptops. 
          It provides seamless, low-latency control over CPU power envelopes and cooling fan duty cycles.
        </p>
      </div>

      <div class="about-grid">

        <!-- PROJECT & DEVELOPER INFO -->
        <section class="about-card">
          <h3 class="card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="card-icon" style="stroke-linecap: round; stroke-linejoin: round;">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            Project & Developer Info
          </h3>
          <div class="developer-info">
            <p class="developer-desc">
              NiyanTraK is designed, developed, and maintained by <strong>Dhruvil Gajjar</strong>. 
              Dedicated to building lightweight, low-level hardware customizers and premium desktop workspace utilities.
            </p>
            <div class="developer-actions">
              <!-- Repository Link Button -->
              <div (click)="openLink('https://github.com/dhr-dev/niyantrak-ntk')" class="github-link-box">
                <div class="link-left-content">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="github-icon" width="16" height="16">
                    <polyline points="16 18 22 12 16 6"></polyline>
                    <polyline points="8 6 2 12 8 18"></polyline>
                  </svg>
                  <span>NiyanTraK Repository</span>
                </div>
                <span class="external-arrow">↗</span>
              </div>

              <!-- Follow Developer Button -->
              <div (click)="openLink('https://github.com/dhr-dev')" class="github-link-box">
                <div class="link-left-content">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="github-icon" width="16" height="16">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <span>Follow @dhr-dev</span>
                </div>
                <span class="external-arrow">↗</span>
              </div>
            </div>
          </div>
        </section>

        <!-- OPEN SOURCE CREDITS -->
        <section class="about-card">
          <h3 class="card-title">
            <svg viewBox="0 0 24 24" fill="currentColor" class="card-icon">
              <path fill-rule="evenodd" d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z" clip-rule="evenodd"/>
            </svg>
            Credits & Open Source
          </h3>
          <p class="credits-intro">NiyanTraK relies on and is inspired by the following open-source projects:</p>
          <div class="credits-list">
            <div class="credit-item" (click)="openLink('https://github.com/FlyGoat/RyzenAdj')">
              <div class="credit-info">
                <span class="credit-project">RyzenAdj</span>
                <span class="credit-desc">Low-level AMD Ryzen APU/CPU power limit registers controller.</span>
              </div>
              <div class="credit-link-btn">
                <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                </svg>
                <span class="credit-arrow">↗</span>
              </div>
            </div>
            <div class="credit-item" (click)="openLink('https://github.com/GeographicCone/OmenHwCtl')">
              <div class="credit-info">
                <span class="credit-project">OmenHwCtl</span>
                <span class="credit-desc">HP WMI command controller scripts for Embedded Controller interactions.</span>
              </div>
              <div class="credit-link-btn">
                <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                </svg>
                <span class="credit-arrow">↗</span>
              </div>
            </div>
            <div class="credit-item" (click)="openLink('https://github.com/Giacomix02/fanControl')">
              <div class="credit-info">
                <span class="credit-project">fanControl</span>
                <span class="credit-desc">Initial UI layouts and fan curve mapping reference models.</span>
              </div>
              <div class="credit-link-btn">
                <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                </svg>
                <span class="credit-arrow">↗</span>
              </div>
            </div>
          </div>
        </section>

        <!-- SAFETY WARNING -->
        <section class="about-card warning-card">
          <h3 class="card-title warning-title">
            <span class="warning-icon-inline">⚠️</span>
            Safety Disclaimer
          </h3>
          <p class="warning-text">
            This utility can override default BIOS fan limits and CPU thermal states. Setting values incorrectly 
            may lead to thermal throttling or system instability. Use this utility responsibly. The developer assumes no 
            liability for hardware damage or data loss.
          </p>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .about-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
      color: #e0e0e0;
      animation: fade-in 250ms ease-out;
    }
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .about-hero-section {
      // border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      padding-bottom: 2px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .about-grid {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 0px;
    }
    .about-card {
      background: rgba(30, 30, 32, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 16px;
      backdrop-filter: blur(16px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }
    .app-title-section {
      display: flex;
      align-items: baseline;
      gap: 10px;
    }
    .about-title {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #ffffff;
      margin: 0;
    }
    .about-subtitle {
      font-size: 12px;
      color: #3b82f6;
      font-weight: 600;
      margin: 0;
    }
    .app-version {
      font-size: 11.5px;
      color: #888;
      font-weight: 600;
    }
    .hero-desc {
      font-size: 12px;
      line-height: 1.5;
      color: #ccc;
      margin: 0;
    }
    .card-title {
      font-size: 14px;
      font-weight: 600;
      color: #ffffff;
      margin-top: 0;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .card-icon {
      width: 16px;
      height: 16px;
      color: #3b82f6;
    }
    .developer-desc {
      font-size: 12px;
      color: #aaa;
      margin-bottom: 12px;
      line-height: 1.5;
    }
    .developer-actions {
      display: flex;
      gap: 12px;
    }
    .github-link-box {
      flex: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #18181a;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      padding: 10px 14px;
      cursor: pointer;
      text-decoration: none;
      transition: all 150ms ease;
      color: #fff;
      font-size: 12px;
      font-weight: 500;
    }
    .github-link-box:hover {
      border-color: rgba(59, 130, 246, 0.4);
      background: #1e1e22;
      box-shadow: 0 0 10px rgba(59, 130, 246, 0.1);
    }
    .link-left-content {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .github-icon {
      color: #3b82f6;
    }
    .external-arrow {
      font-size: 11px;
      color: #888;
      transition: transform 150ms ease;
    }
    .github-link-box:hover .external-arrow {
      transform: translate(2px, -2px);
      color: #3b82f6;
    }
    .credits-intro {
      font-size: 12px;
      color: #bbb;
      margin-bottom: 10px;
    }
    .credits-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .credit-item {
      background: rgba(0, 0, 0, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.02);
      border-radius: 6px;
      padding: 8px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      transition: all 150ms ease;
    }
    .credit-item:hover {
      border-color: rgba(59, 130, 246, 0.25);
      background: rgba(59, 130, 246, 0.02);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }
    .credit-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
    }
    .credit-project {
      font-size: 12px;
      font-weight: 600;
      color: #fff;
    }
    .credit-desc {
      font-size: 11px;
      color: #888;
      line-height: 1.4;
    }
    .credit-link-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 4px;
      padding: 6px 10px;
      color: #888;
      transition: all 150ms ease;
    }
    .credit-item:hover .credit-link-btn {
      background: rgba(59, 130, 246, 0.12);
      border-color: rgba(59, 130, 246, 0.3);
      color: #3b82f6;
    }
    .credit-arrow {
      font-size: 10px;
      transition: transform 150ms ease;
      display: inline-block;
    }
    .credit-item:hover .credit-arrow {
      transform: translate(1.5px, -1.5px);
    }
    .warning-card {
      border-color: rgba(239, 68, 68, 0.2);
      background: rgba(239, 68, 68, 0.02);
    }
    .warning-title {
      color: #ef4444;
    }
    .warning-icon-inline {
      font-size: 14px;
    }
    .warning-text {
      font-size: 11.5px;
      line-height: 1.5;
      color: #bcaaa4;
    }
  `]
})
export class AboutPanelComponent {
  @Output() showToast = new EventEmitter<{ message: string; type: 'success' | 'error' | 'info' }>();

  async openLink(url: string) {
    try {
      await openUrl(url);
    } catch (e) {
      console.error('[About] Failed to open external URL:', e);
      this.showToast.emit({ message: 'Failed to open link: ' + e, type: 'error' });
    }
  }
}
