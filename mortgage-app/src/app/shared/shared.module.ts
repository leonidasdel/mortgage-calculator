import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { CalcExplanationComponent } from '../components/calc-explanation/calc-explanation.component';
import { ExportRowComponent } from '../components/export-row/export-row.component';
import { LawFooterComponent } from '../components/law-footer/law-footer.component';
import { ComparePanelComponent } from '../components/compare-panel/compare-panel.component';
import { DateSelectComponent } from '../components/date-select/date-select.component';
import { ChartResizeDirective } from '../directives/chart-resize.directive';
import { EuroPipe } from '../pipes/euro.pipe';
import { DateDDMMYYYYPipe } from '../pipes/date-ddmmyyyy.pipe';

@NgModule({
  declarations: [
    CalcExplanationComponent,
    ExportRowComponent,
    LawFooterComponent,
    ComparePanelComponent,
    DateSelectComponent,
    ChartResizeDirective,
    EuroPipe,
    DateDDMMYYYYPipe,
  ],
  imports: [CommonModule, ReactiveFormsModule],
  exports: [
    CommonModule,
    ReactiveFormsModule,
    CalcExplanationComponent,
    ExportRowComponent,
    LawFooterComponent,
    ComparePanelComponent,
    DateSelectComponent,
    ChartResizeDirective,
    EuroPipe,
    DateDDMMYYYYPipe,
  ],
})
export class SharedModule {}
