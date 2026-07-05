import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer-strip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- FOOTER -->
    <footer class="footer-strip">
      <span class="v-letter">v</span><span class="version-num">{{ version }}</span> &nbsp;·&nbsp; Made with <span class="heart-icon">❤️</span> by&nbsp;<span class="author-name">Dhruvil Gajjar</span>
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
    .heart-icon {
      display: inline-block;
    }
  `]
})
export class FooterStripComponent {
  version = '4.0.0-beta.1';
}
