import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { InterestCalculatorComponent } from '../../components/interest-calculator/interest-calculator.component';
import { SavingsCalculatorComponent } from '../../components/savings-calculator/savings-calculator.component';
import { InheritanceGiftCalculatorComponent } from '../../components/inheritance-gift-calculator/inheritance-gift-calculator.component';
import { CryptoTaxCalculatorComponent } from '../../components/crypto-tax-calculator/crypto-tax-calculator.component';
import { CarCostCalculatorComponent } from '../../components/car-cost-calculator/car-cost-calculator.component';

const routes: Routes = [
  { path: 'interest', component: InterestCalculatorComponent },
  { path: 'savings', component: SavingsCalculatorComponent },
  { path: 'inheritance-gift', component: InheritanceGiftCalculatorComponent },
  { path: 'crypto-tax', component: CryptoTaxCalculatorComponent },
  { path: 'car-cost', component: CarCostCalculatorComponent },
];

@NgModule({
  declarations: [
    InterestCalculatorComponent,
    SavingsCalculatorComponent,
    InheritanceGiftCalculatorComponent,
    CryptoTaxCalculatorComponent,
    CarCostCalculatorComponent,
  ],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class SavingsTaxModule {}
