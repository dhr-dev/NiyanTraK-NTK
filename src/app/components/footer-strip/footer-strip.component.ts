import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { getVersion } from '@tauri-apps/api/app';
import { invoke } from '@tauri-apps/api/core';

@Component({
  selector: 'app-footer-strip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- FOOTER -->
    <footer class="footer-strip">
      <span class="v-letter">v</span><span class="version-num">{{ version }}</span> &nbsp;·&nbsp; Made with <span class="heart-clicker" (click)="onHeartClick()">❤️</span> by&nbsp;<span class="author-name">Dhruvil Gajjar</span>
    </footer>
  `,
  styles: [`
    /* ─── FOOTER ─── */
    .footer-strip {
      height: 24px; min-height: 24px;
      background: #0a0a0a; border-top: 1px solid #1a1a1a;
      display: flex; align-items: center; justify-content: center;
      font-size: 10px; color: #555; letter-spacing: 0.05em;
      flex-shrink: 0; user-select: none;
    }
    .v-letter {
      color: #3b82f6;
      font-weight: 600;
      font-size: 10px;
    }
    .version-num {
      color: #aaa;
      font-weight: 600;
      font-size: 11.5px;
    }
    .author-name {
      color: #888;
      font-weight: 500;
    }
    .heart-clicker {
      cursor: default;
      display: inline-block;
      transition: transform 150ms ease;
    }
    .heart-clicker:active {
      transform: scale(1.3);
    }
  `]
})
export class FooterStripComponent implements OnInit {
  version = '0.1.0';

  async ngOnInit() {
    try {
      this.version = await getVersion();
    } catch (e) {
      console.warn('[Footer] Failed to fetch tauri version, using fallback:', e);
    }
  }

  async onHeartClick() {
    try {
      const res = await invoke<string>('register_heart_click');
      console.log('[Heart clicker]', res);
    } catch (e) {
      console.error('[Heart clicker error]', e);
    }
  }
}
