import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer-strip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="footer-strip flex items-center justify-center h-[24px] bg-deep-chrome border-t border-[#1a1a1a] select-none text-[10px] text-[#333] tracking-[0.05em]">
      v0.1  ·  Made with passion by DhruvilGajjar
    </div>
  `,
  styles: [`
    .footer-strip {
      /* Pinned bottom helper */
    }
  `]
})
export class FooterStripComponent {}
