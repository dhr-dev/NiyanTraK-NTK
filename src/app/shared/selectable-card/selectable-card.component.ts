import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-selectable-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      (click)="select()"
      class="selectable-card cursor-pointer transition-all duration-150 ease-in-out border border-[#222] select-none text-left"
      [ngClass]="active ? 'bg-[#141e2a] border-l-2 border-l-accent-blue rounded-r-[4px] rounded-l-none' : 'bg-[#1a1a1a] rounded-[4px]'"
    >
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .selectable-card {
      transition: background-color 150ms ease, border-color 150ms ease;
    }
    .selectable-card:hover:not(.bg-\\[\\#141e2a\\]) {
      background-color: #1c1c1c;
      border-color: #2b2b2b;
    }
  `]
})
export class SelectableCardComponent {
  @Input() active: boolean = false;
  @Output() cardClick = new EventEmitter<void>();

  select() {
    this.cardClick.emit();
  }
}
