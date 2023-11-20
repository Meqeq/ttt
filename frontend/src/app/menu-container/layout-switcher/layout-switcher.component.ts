import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-layout-switcher',
  templateUrl: './layout-switcher.component.html',
})
export class LayoutSwitcherComponent {
  @Input() layout: 'elk' | 'dagre' = 'dagre';

  @Output() layoutChange = new EventEmitter<'elk' | 'dagre'>();
}
