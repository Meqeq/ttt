import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { DataService } from '../data.service';

export enum Mode {
  Multi = 'Multi',
  Single = 'Single',
  Swimlane = 'Swimlane',
  Timesheet = 'Timesheet',
}

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
})
export class MenuComponent {
  @Input() mode: Mode = Mode.Timesheet;

  @Input() objects: [string, string, boolean][] = [];

  @Input() types: [string, boolean][] = [];

  @Input() colorsMap!: Map<string, string>;

  @Input() swimlaneType = '';

  @Input() showNodeLabels = false;

  @Input() showEdgeLabels = false;

  @Input() showDurationLabels = false;

  @Output() modeChange = new EventEmitter<Mode>();

  @Output() objectChange = new EventEmitter<number>();

  @Output() typeChange = new EventEmitter<number>();

  @Output() swimlaneTypeChange = new EventEmitter<string>();

  @Output() showNodeLabelsChange = new EventEmitter<boolean>();

  @Output() showEdgeLabelsChange = new EventEmitter<boolean>();

  @Output() showDurationLabelsChange = new EventEmitter<boolean>();

  readonly Mode = Mode;

  loading = false;

  log = '';

  private dataService = inject(DataService);

  kek(k: any): void {
    console.log(k);
  }

  onFileInput(e: any): void {
    this.loading = true;

    const [log] = e.target?.files as File[];

    this.dataService.uploadLog(log).subscribe(() => {
      this.loading = false;

      this.log = log.name;
    });
  }

  onModeChange(): void {
    switch (this.mode) {
      case Mode.Single:
        this.modeChange.emit(Mode.Multi);
        break;
      case Mode.Multi:
        this.modeChange.emit(Mode.Swimlane);
        break;
      case Mode.Swimlane:
        this.modeChange.emit(Mode.Single);
        this.swimlaneTypeChange.emit('');
    }
  }

  onObjectChange(index: number): void {
    this.objectChange.emit(index);
  }

  onTypeChange(index: number): void {
    this.typeChange.emit(index);
  }

  onSwimlaneTypeChange(e: any): void {
    this.swimlaneTypeChange.emit(e.target.value);
  }
}
