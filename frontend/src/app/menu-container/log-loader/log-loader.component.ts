import { Component, EventEmitter, Output, inject } from '@angular/core';
import { DataService } from 'src/app/data.service';

@Component({
  selector: 'app-log-loader',
  templateUrl: './log-loader.component.html',
})
export class LogLoaderComponent {
  @Output() logChange = new EventEmitter<void>();

  loading = false;

  log = '';

  private dataService = inject(DataService);

  onFileInput(e: any): void {
    this.loading = true;

    const [log] = e.target?.files as File[];

    this.dataService.uploadLog(log).subscribe(() => {
      this.loading = false;

      this.log = log.name;

      this.logChange.emit();
    });
  }
}
