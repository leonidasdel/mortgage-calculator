import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { RentVsBuyCalculatorComponent } from '../../components/rent-vs-buy-calculator/rent-vs-buy-calculator.component';
import { RentalTaxCalculatorComponent } from '../../components/rental-tax-calculator/rental-tax-calculator.component';
import { PropertyPurchaseCalculatorComponent } from '../../components/property-purchase-calculator/property-purchase-calculator.component';

const routes: Routes = [
  { path: 'rent-vs-buy', component: RentVsBuyCalculatorComponent },
  { path: 'rental-tax', component: RentalTaxCalculatorComponent },
  { path: 'property-purchase', component: PropertyPurchaseCalculatorComponent },
];

@NgModule({
  declarations: [
    RentVsBuyCalculatorComponent,
    RentalTaxCalculatorComponent,
    PropertyPurchaseCalculatorComponent,
  ],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class PropertyModule {}
