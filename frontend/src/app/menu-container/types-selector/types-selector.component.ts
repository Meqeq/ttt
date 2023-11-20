import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-types-selector',
  templateUrl: 'types-selector.component.html',
})
export class TypesSelectorComponent {
  @Input() types: [string, boolean][] = [];

  @Input() colorsMap!: Map<string, string>;

  @Output() typeChange = new EventEmitter<number>();

  onTypeChange(index: number): void {
    this.typeChange.emit(index);
  }
}
