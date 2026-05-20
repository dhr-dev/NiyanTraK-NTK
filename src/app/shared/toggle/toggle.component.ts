import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      type="button"
      (click)="toggle()"
      class="toggle-container relative inline-flex h-[14px] w-[28px] shrink-0 cursor-pointer rounded-full border-transparent transition-colors duration-150 ease-in-out focus:outline-none"
      [ngClass]="on ? 'bg-accent-blue' : 'bg-[#2a2a2a]'"
    >
      <span
        class="pointer-events-none inline-block h-[10px] w-[10px] transform rounded-full bg-white transition duration-150 ease-in-out"
        [ngClass]="on ? 'translate-x-[16px]' : 'translate-x-[2px]'"
        style="margin-top: 2px;"
      ></span>
    </button>
  `,
  styles: [`
    .toggle-container {
      transition: background-color 150ms ease;
    }
    span {
      transition: transform 150ms ease;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
    }
  `]
})
export class ToggleComponent {
  @Input() on: boolean = false;
  @Output() onChange = new EventEmitter<boolean>();

  toggle() {
    this.onChange.emit(!this.on);
  }
}
