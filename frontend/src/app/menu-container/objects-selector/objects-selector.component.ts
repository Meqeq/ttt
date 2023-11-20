import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-objects-selector',
  templateUrl: './objects-selector.component.html',
})
export class ObjectsSelectorComponent {
  @Input() objects: [string, string, boolean][] = [];

  @Input() colorsMap!: Map<string, string>;

  @Output() objectChange = new EventEmitter<number>();

  onObjectChange(index: number): void {
    this.objectChange.emit(index);
  }
}
