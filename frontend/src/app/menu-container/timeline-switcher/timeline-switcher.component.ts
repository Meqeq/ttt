import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-timeline-switcher',
  templateUrl: './timeline-switcher.component.html',
})
export class TimelineSwitcherComponent {
  @Input() timelineMode: 'single' | 'multi' = 'single';

  @Output() timelineModeChange = new EventEmitter<'single' | 'multi'>();
}
