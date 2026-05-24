import { Routes } from '@angular/router';

export const SAVINGS_TAX_ROUTES: Routes = [
  {
    path: 'interest',
    loadComponent: () =>
      import('../components/interest-calculator/interest-calculator.component').then(
        (m) => m.InterestCalculatorComponent,
      ),
  },
  {
    path: 'savings',
    loadComponent: () =>
      import('../components/savings-calculator/savings-calculator.component').then(
        (m) => m.SavingsCalculatorComponent,
      ),
  },
  {
    path: 'inheritance-gift',
    loadComponent: () =>
      import('../components/inheritance-gift-calculator/inheritance-gift-calculator.component').then(
        (m) => m.InheritanceGiftCalculatorComponent,
      ),
  },
  {
    path: 'crypto-tax',
    loadComponent: () =>
      import('../components/crypto-tax-calculator/crypto-tax-calculator.component').then(
        (m) => m.CryptoTaxCalculatorComponent,
      ),
  },
  {
    path: 'car-cost',
    loadComponent: () =>
      import('../components/car-cost-calculator/car-cost-calculator.component').then(
        (m) => m.CarCostCalculatorComponent,
      ),
  },
];
