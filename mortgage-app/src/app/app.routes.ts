import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: '',
    loadChildren: () => import('./routes/loans.routes').then(m => m.LOANS_ROUTES),
  },
  {
    path: '',
    loadChildren: () => import('./routes/income.routes').then(m => m.INCOME_ROUTES),
  },
  {
    path: '',
    loadChildren: () => import('./routes/property.routes').then(m => m.PROPERTY_ROUTES),
  },
  {
    path: '',
    loadChildren: () => import('./routes/savings-tax.routes').then(m => m.SAVINGS_TAX_ROUTES),
  },
  { path: '**', redirectTo: '' },
];
