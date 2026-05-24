import { Routes } from '@angular/router';

export const INCOME_ROUTES: Routes = [
  {
    path: 'salary',
    loadComponent: () =>
      import('../components/salary-calculator/salary-calculator.component').then(
        (m) => m.SalaryCalculatorComponent,
      ),
  },
  {
    path: 'annual-bonus',
    loadComponent: () =>
      import('../components/annual-bonus-calculator/annual-bonus-calculator.component').then(
        (m) => m.AnnualBonusCalculatorComponent,
      ),
  },
  {
    path: 'holiday-bonus',
    loadComponent: () =>
      import('../components/holiday-bonus-calculator/holiday-bonus-calculator.component').then(
        (m) => m.HolidayBonusCalculatorComponent,
      ),
  },
  {
    path: 'freelancer',
    loadComponent: () =>
      import('../components/freelancer-calculator/freelancer-calculator.component').then(
        (m) => m.FreelancerCalculatorComponent,
      ),
  },
  {
    path: 'unused-leave',
    loadComponent: () =>
      import('../components/unused-leave-calculator/unused-leave-calculator.component').then(
        (m) => m.UnusedLeaveCalculatorComponent,
      ),
  },
  {
    path: 'severance',
    loadComponent: () =>
      import('../components/severance-calculator/severance-calculator.component').then(
        (m) => m.SeveranceCalculatorComponent,
      ),
  },
];
