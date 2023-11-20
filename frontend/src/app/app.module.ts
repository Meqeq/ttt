import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MenuComponent } from './menu/menu.component';
import { SingleGraphComponent } from './single-graph/single-graph.component';
import { GraphComponent } from './graph/graph.component';
import { ValueFromMapPipe } from './key-from-map.pipe';
import { MenuContainerComponent } from './menu-container/menu-container.component';
import { LogLoaderComponent } from './menu-container/log-loader/log-loader.component';
import { TypesSelectorComponent } from './menu-container/types-selector/types-selector.component';
import { ObjectsSelectorComponent } from './menu-container/objects-selector/objects-selector.component';
import { ModeSwitcherComponent } from './menu-container/mode-switcher/mode-switcher.component';
import { LabelsSelectorComponent } from './menu-container/labels-selector/labels-selector.component';
import { TimesheetCanvasComponent } from './timesheet-canvas/timesheet-canvas.component';
import { DatePipe } from '@angular/common';
import { LimiterComponent } from './menu-container/limiter/limiter.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSliderModule } from '@angular/material/slider';
import { EdgeFilterComponent } from './menu-container/edge-filter/edge-filter.component';
import { NodeFilterComponent } from './menu-container/node-filter/node-filter.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { LayoutSwitcherComponent } from './menu-container/layout-switcher/layout-switcher.component';
import { TimelineSwitcherComponent } from './menu-container/timeline-switcher/timeline-switcher.component';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';

@NgModule({
  declarations: [
    AppComponent,
    MenuComponent,
    SingleGraphComponent,
    GraphComponent,
    ValueFromMapPipe,
    MenuContainerComponent,
    LogLoaderComponent,
    TypesSelectorComponent,
    ObjectsSelectorComponent,
    ModeSwitcherComponent,
    LabelsSelectorComponent,
    TimesheetCanvasComponent,
    LimiterComponent,
    EdgeFilterComponent,
    NodeFilterComponent,
    LayoutSwitcherComponent,
    TimelineSwitcherComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    MatSliderModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    MatChipsModule,
    MatCheckboxModule,
  ],
  providers: [DatePipe],
  bootstrap: [AppComponent],
})
export class AppModule {}
