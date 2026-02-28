import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';

import { App } from './app';
import { NavComponent } from './components/nav/nav.component';
import { LoanFormComponent } from './components/loan-form/loan-form.component';
import { EarlyRepaymentsComponent } from './components/early-repayments/early-repayments.component';
import { BulkErFormComponent } from './components/bulk-er-form/bulk-er-form.component';
import { SummaryPanelComponent } from './components/summary-panel/summary-panel.component';
import { AmortizationChartComponent } from './components/amortization-chart/amortization-chart.component';
import { AmortizationTableComponent } from './components/amortization-table/amortization-table.component';
import { EuroPipe } from './pipes/euro.pipe';
import { DateDDMMYYYYPipe } from './pipes/date-ddmmyyyy.pipe';

@NgModule({
  declarations: [
    App,
    NavComponent,
    LoanFormComponent,
    EarlyRepaymentsComponent,
    BulkErFormComponent,
    SummaryPanelComponent,
    AmortizationChartComponent,
    AmortizationTableComponent,
    EuroPipe,
    DateDDMMYYYYPipe,
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
  ],
  bootstrap: [App],
})
export class AppModule {}
