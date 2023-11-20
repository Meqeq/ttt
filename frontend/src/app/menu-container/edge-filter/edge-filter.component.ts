import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-edge-filter',
  templateUrl: './edge-filter.component.html',
})
export class EdgeFilterComponent {
  @Input() form!: FormGroup<any>;

  @Input() max = 10;
}
