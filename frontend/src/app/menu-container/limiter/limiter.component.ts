import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-limiter',
  templateUrl: './limiter.component.html',
})
export class LimiterComponent {
  @Input() limit!: FormControl<number>;
}
