import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-range-slider',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="slider-container relative w-full h-[28px] flex items-center">
      <!-- Background Track -->
      <div class="absolute left-0 right-0 h-[3px] bg-[#2a2a2a] rounded-[2px] pointer-events-none"></div>
      
      <!-- Blue Fill Left of Thumb -->
      <div 
        class="absolute left-0 h-[3px] bg-accent-blue rounded-[2px] pointer-events-none" 
        [style.width.%]="percent"
      ></div>
      
      <!-- Hidden Range Input for Native Dragging/Events -->
      <input
        type="range"
        [min]="min"
        [max]="max"
        [step]="step"
        [value]="value"
        [disabled]="disabled"
        (input)="onInput($event)"
        class="native-slider absolute w-full h-full cursor-pointer z-20 opacity-0"
        [class.cursor-not-allowed]="disabled"
      />
      
      <!-- Visual Styled Thumb -->
      <div
        class="styled-thumb absolute pointer-events-none w-[12px] h-[12px] bg-accent-blue rounded-full z-10 transition-all duration-100 ease-out"
        [style.left.%]="percent"
        [class.opacity-40]="disabled"
      ></div>
    </div>
  `,
  styles: [`
    .slider-container {
      user-select: none;
    }
    .styled-thumb {
      top: 50%;
      transform: translate(-50%, -50%) scale(1);
    }
    .slider-container:hover .styled-thumb:not(.opacity-40) {
      transform: translate(-50%, -50%) scale(1.15);
    }
    .native-slider:active ~ .styled-thumb:not(.opacity-40) {
      transform: translate(-50%, -50%) scale(1.2);
    }
  `]
})
export class RangeSliderComponent implements OnChanges {
  @Input() min: number = 0;
  @Input() max: number = 100;
  @Input() step: number = 1;
  @Input() value: number = 0;
  @Input() disabled: boolean = false;
  
  @Output() valueChange = new EventEmitter<number>();

  percent: number = 0;

  ngOnChanges(changes: SimpleChanges) {
    this.calculatePercent();
  }

  onInput(event: any) {
    const val = Number(event.target.value);
    this.value = val;
    this.calculatePercent();
    this.valueChange.emit(val);
  }

  private calculatePercent() {
    if (this.max === this.min) {
      this.percent = 0;
      return;
    }
    const safeValue = Math.min(Math.max(this.value, this.min), this.max);
    this.percent = ((safeValue - this.min) / (this.max - this.min)) * 100;
  }
}
