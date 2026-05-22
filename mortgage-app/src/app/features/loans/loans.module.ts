import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { MortgageCalculatorComponent } from '../../components/mortgage-calculator/mortgage-calculator.component';
import { ConsumerLoanCalculatorComponent } from '../../components/consumer-loan-calculator/consumer-loan-calculator.component';
import { LoanFormComponent } from '../../components/loan-form/loan-form.component';
import { EarlyRepaymentsComponent } from '../../components/early-repayments/early-repayments.component';
import { BulkErFormComponent } from '../../components/bulk-er-form/bulk-er-form.component';
import { SummaryPanelComponent } from '../../components/summary-panel/summary-panel.component';
import { AmortizationChartComponent } from '../../components/amortization-chart/amortization-chart.component';
import { AmortizationTableComponent } from '../../components/amortization-table/amortization-table.component';

const routes: Routes = [
  { path: 'mortgage', component: MortgageCalculatorComponent },
  { path: 'consumer-loan', component: ConsumerLoanCalculatorComponent },
];

@NgModule({
  declarations: [
    MortgageCalculatorComponent,
    ConsumerLoanCalculatorComponent,
    LoanFormComponent,
    EarlyRepaymentsComponent,
    BulkErFormComponent,
    SummaryPanelComponent,
    AmortizationChartComponent,
    AmortizationTableComponent,
  ],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class LoansModule {}
