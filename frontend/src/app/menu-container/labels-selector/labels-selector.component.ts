import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Mode } from '../mode-switcher/mode-switcher.component';

@Component({
  selector: 'app-labels-selector',
  templateUrl: './labels-selector.component.html',
})
export class LabelsSelectorComponent {
  @Input() showNodeLabels = false;

  @Input() showEdgeLabels = false;

  @Input() showDurationLabels = false;

  @Input() mode: Mode = Mode.Single;

  @Output() showNodeLabelsChange = new EventEmitter<boolean>();

  @Output() showEdgeLabelsChange = new EventEmitter<boolean>();

  @Output() showDurationLabelsChange = new EventEmitter<boolean>();

  readonly Mode = Mode;
}
