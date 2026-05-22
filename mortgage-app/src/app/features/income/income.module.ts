import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { SalaryCalculatorComponent } from '../../components/salary-calculator/salary-calculator.component';
import { AnnualBonusCalculatorComponent } from '../../components/annual-bonus-calculator/annual-bonus-calculator.component';
import { HolidayBonusCalculatorComponent } from '../../components/holiday-bonus-calculator/holiday-bonus-calculator.component';
import { FreelancerCalculatorComponent } from '../../components/freelancer-calculator/freelancer-calculator.component';
import { UnusedLeaveCalculatorComponent } from '../../components/unused-leave-calculator/unused-leave-calculator.component';
import { SeveranceCalculatorComponent } from '../../components/severance-calculator/severance-calculator.component';
import { SalaryPayslipPanelComponent } from '../../components/salary-payslip-panel/salary-payslip-panel.component';
import { SalaryTaxBreakdownComponent } from '../../components/salary-tax-breakdown/salary-tax-breakdown.component';
import { SalaryChangeBlockComponent } from '../../components/salary-change-block/salary-change-block.component';
import { UnusedLeaveCompensationComponent } from '../../components/unused-leave-compensation/unused-leave-compensation.component';
import { UnusedLeaveTaxBreakdownComponent } from '../../components/unused-leave-tax-breakdown/unused-leave-tax-breakdown.component';

const routes: Routes = [
  { path: 'salary', component: SalaryCalculatorComponent },
  { path: 'annual-bonus', component: AnnualBonusCalculatorComponent },
  { path: 'holiday-bonus', component: HolidayBonusCalculatorComponent },
  { path: 'freelancer', component: FreelancerCalculatorComponent },
  { path: 'unused-leave', component: UnusedLeaveCalculatorComponent },
  { path: 'severance', component: SeveranceCalculatorComponent },
];

@NgModule({
  declarations: [
    SalaryCalculatorComponent,
    AnnualBonusCalculatorComponent,
    HolidayBonusCalculatorComponent,
    FreelancerCalculatorComponent,
    UnusedLeaveCalculatorComponent,
    SeveranceCalculatorComponent,
    SalaryPayslipPanelComponent,
    SalaryTaxBreakdownComponent,
    SalaryChangeBlockComponent,
    UnusedLeaveCompensationComponent,
    UnusedLeaveTaxBreakdownComponent,
  ],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class IncomeModule {}
