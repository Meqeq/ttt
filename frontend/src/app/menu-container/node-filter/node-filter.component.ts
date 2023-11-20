import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-node-filter',
  templateUrl: './node-filter.component.html',
})
export class NodeFilterComponent {
  @Input() form!: FormGroup<any>;

  @Input() max = 10;
}
