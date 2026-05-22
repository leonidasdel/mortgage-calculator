import { Routes } from '@angular/router';

export const PROPERTY_ROUTES: Routes = [
  {
    path: 'rent-vs-buy',
    loadComponent: () =>
      import('../components/rent-vs-buy-calculator/rent-vs-buy-calculator.component').then(
        m => m.RentVsBuyCalculatorComponent,
      ),
  },
  {
    path: 'rental-tax',
    loadComponent: () =>
      import('../components/rental-tax-calculator/rental-tax-calculator.component').then(
        m => m.RentalTaxCalculatorComponent,
      ),
  },
  {
    path: 'property-purchase',
    loadComponent: () =>
      import('../components/property-purchase-calculator/property-purchase-calculator.component').then(
        m => m.PropertyPurchaseCalculatorComponent,
      ),
  },
];
