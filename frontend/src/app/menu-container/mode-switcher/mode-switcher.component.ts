import { Component, EventEmitter, Input, Output } from '@angular/core';

export enum Mode {
  Multi = 'Multi',
  Single = 'Single',
  Swimlane = 'Swimlane',
  Timesheet = 'Timesheet',
}

@Component({
  selector: 'app-mode-switcher',
  templateUrl: './mode-switcher.component.html',
})
export class ModeSwitcherComponent {
  @Input() mode: Mode = Mode.Timesheet;

  @Input() types: [string, boolean][] = [];

  @Input() swimlaneType = '';

  @Output() modeChange = new EventEmitter<Mode>();

  @Output() swimlaneTypeChange = new EventEmitter<string>();

  readonly Mode = Mode;

  onModeChange(): void {
    switch (this.mode) {
      case Mode.Single:
        this.modeChange.emit(Mode.Multi);
        break;
      case Mode.Multi:
        this.modeChange.emit(Mode.Swimlane);
        break;
      case Mode.Swimlane:
        this.modeChange.emit(Mode.Timesheet);
        break;
      case Mode.Timesheet:
        this.modeChange.emit(Mode.Single);
      // this.swimlaneTypeChange.emit('');
    }
  }

  onSwimlaneTypeChange(e: any): void {
    e.preventDefault();
    e.stopPropagation();
    this.swimlaneTypeChange.emit(e.target.value);
  }
}
