import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer-strip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- FOOTER -->
    <footer class="footer-strip">
      v0.1 &nbsp;·&nbsp; Made with passion by DhruvilGajjar
    </footer>
  `,
  styles: [`
    /* ─── FOOTER ─── */
    .footer-strip {
      height: 24px; min-height: 24px;
      background: #0a0a0a; border-top: 1px solid #1a1a1a;
      display: flex; align-items: center; justify-content: center;
      font-size: 10px; color: #333; letter-spacing: 0.05em;
      flex-shrink: 0; user-select: none;
    }
  `]
})
export class FooterStripComponent {}
