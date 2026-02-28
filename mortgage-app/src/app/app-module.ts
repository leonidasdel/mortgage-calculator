import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { App } from './app';
import { NavComponent } from './components/nav/nav.component';
import { HomeComponent } from './components/home/home.component';
import { MortgageCalculatorComponent } from './components/mortgage-calculator/mortgage-calculator.component';
import { SalaryCalculatorComponent } from './components/salary-calculator/salary-calculator.component';
import { LoanFormComponent } from './components/loan-form/loan-form.component';
import { EarlyRepaymentsComponent } from './components/early-repayments/early-repayments.component';
import { BulkErFormComponent } from './components/bulk-er-form/bulk-er-form.component';
import { SummaryPanelComponent } from './components/summary-panel/summary-panel.component';
import { AmortizationChartComponent } from './components/amortization-chart/amortization-chart.component';
import { AmortizationTableComponent } from './components/amortization-table/amortization-table.component';
import { EuroPipe } from './pipes/euro.pipe';
import { DateDDMMYYYYPipe } from './pipes/date-ddmmyyyy.pipe';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'mortgage', component: MortgageCalculatorComponent },
  { path: 'salary', component: SalaryCalculatorComponent },
  { path: '**', redirectTo: '' },
];

@NgModule({
  declarations: [
    App,
    NavComponent,
    HomeComponent,
    MortgageCalculatorComponent,
    SalaryCalculatorComponent,
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
    RouterModule.forRoot(routes, { useHash: true }),
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
  ],
  bootstrap: [App],
})
export class AppModule {}
