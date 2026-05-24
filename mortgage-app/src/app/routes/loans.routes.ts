import { Routes } from '@angular/router';

export const LOANS_ROUTES: Routes = [
  {
    path: 'mortgage',
    loadComponent: () =>
      import('../components/mortgage-calculator/mortgage-calculator.component').then(
        (m) => m.MortgageCalculatorComponent,
      ),
  },
  {
    path: 'consumer-loan',
    loadComponent: () =>
      import('../components/consumer-loan-calculator/consumer-loan-calculator.component').then(
        (m) => m.ConsumerLoanCalculatorComponent,
      ),
  },
];
