import { NgModule, provideBrowserGlobalErrorListeners, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule, Routes } from '@angular/router';
import { ServiceWorkerModule } from '@angular/service-worker';

import { App } from './app';
import { NavComponent } from './components/nav/nav.component';
import { HomeComponent } from './components/home/home.component';
import { SharedModule } from './shared/shared.module';

const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: '',
    loadChildren: () => import('./features/loans/loans.module').then(m => m.LoansModule),
  },
  {
    path: '',
    loadChildren: () => import('./features/income/income.module').then(m => m.IncomeModule),
  },
  {
    path: '',
    loadChildren: () => import('./features/property/property.module').then(m => m.PropertyModule),
  },
  {
    path: '',
    loadChildren: () => import('./features/savings-tax/savings-tax.module').then(m => m.SavingsTaxModule),
  },
  { path: '**', redirectTo: '' },
];

@NgModule({
  declarations: [
    App,
    NavComponent,
    HomeComponent,
  ],
  imports: [
    BrowserModule,
    SharedModule,
    RouterModule.forRoot(routes),
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
