import { NgModule, provideBrowserGlobalErrorListeners, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { ServiceWorkerModule } from '@angular/service-worker';

import { App } from './app';
import { NavComponent } from './components/nav/nav.component';
import { HomeComponent } from './components/home/home.component';
import { MortgageCalculatorComponent } from './components/mortgage-calculator/mortgage-calculator.component';
import { SalaryCalculatorComponent } from './components/salary-calculator/salary-calculator.component';
import { InterestCalculatorComponent } from './components/interest-calculator/interest-calculator.component';
import { ConsumerLoanCalculatorComponent } from './components/consumer-loan-calculator/consumer-loan-calculator.component';
import { RentVsBuyCalculatorComponent } from './components/rent-vs-buy-calculator/rent-vs-buy-calculator.component';
import { RentalTaxCalculatorComponent } from './components/rental-tax-calculator/rental-tax-calculator.component';
import { FreelancerCalculatorComponent } from './components/freelancer-calculator/freelancer-calculator.component';
import { SavingsCalculatorComponent } from './components/savings-calculator/savings-calculator.component';
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
  { path: 'interest', component: InterestCalculatorComponent },
  { path: 'consumer-loan', component: ConsumerLoanCalculatorComponent },
  { path: 'rent-vs-buy', component: RentVsBuyCalculatorComponent },
  { path: 'rental-tax', component: RentalTaxCalculatorComponent },
  { path: 'freelancer', component: FreelancerCalculatorComponent },
  { path: 'savings', component: SavingsCalculatorComponent },
  { path: '**', redirectTo: '' },
];

@NgModule({
  declarations: [
    App,
    NavComponent,
    HomeComponent,
    MortgageCalculatorComponent,
    SalaryCalculatorComponent,
    InterestCalculatorComponent,
    ConsumerLoanCalculatorComponent,
    RentVsBuyCalculatorComponent,
    RentalTaxCalculatorComponent,
    FreelancerCalculatorComponent,
    SavingsCalculatorComponent,
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
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forRoot(routes, { useHash: true }),
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
  ],
  bootstrap: [App],
})
export class AppModule {}
