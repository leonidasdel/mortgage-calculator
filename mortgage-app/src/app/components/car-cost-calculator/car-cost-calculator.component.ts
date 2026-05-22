import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import {
  getRegistrationEra,
  normalizeRegistrationDate,
  RegistrationEra,
} from '../../constants/circulation-fee.constants';
import {
  CarCostCalculatorService,
  CarCostParams,
} from '../../services/car-cost-calculator.service';
import { CalculatorPersistenceService } from '../../services/calculator-persistence.service';

const STORAGE_KEY = 'carCostCalcState';

interface CarCostModel {
  firstRegistration: string;
  isEv: boolean;
  engineCc: number;
  co2Grams: number;
  insuranceYear: number;
  fuelMode: string;
  fuelCostYear: number;
  kmPerYear: number;
  litersPer100km: number;
  pricePerLiter: number;
  maintenanceYear: number;
}

import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EuroPipe } from '../../pipes/euro.pipe';
import { CalcExplanationComponent } from '../calc-explanation/calc-explanation.component';
import { DateSelectComponent } from '../date-select/date-select.component';
import { ExportRowComponent } from '../export-row/export-row.component';
import { LawFooterComponent } from '../law-footer/law-footer.component';
@Component({
  selector: 'app-car-cost-calculator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, FormsModule, FormField, EuroPipe, CalcExplanationComponent, DateSelectComponent, ExportRowComponent, LawFooterComponent],
  templateUrl: './car-cost-calculator.component.html',
  styleUrl: './car-cost-calculator.component.scss',
})
export class CarCostCalculatorComponent {
  formModel = signal<CarCostModel>({
    firstRegistration: '2015-06-01',
    isEv: false,
    engineCc: 1400,
    co2Grams: 120,
    insuranceYear: 450,
    fuelMode: 'calc',
    fuelCostYear: 1800,
    kmPerYear: 15000,
    litersPer100km: 6.5,
    pricePerLiter: 1.85,
    maintenanceYear: 600,
  });
  formFields = form(this.formModel);

  private readonly destroyRef = inject(DestroyRef);
  private readonly calc = inject(CarCostCalculatorService);
  private readonly persistence = inject(CalculatorPersistenceService);

  readonly explanationSteps = [
    'Τα τέλη κυκλοφορίας υπολογίζονται από cc (πριν 2010) ή CO₂ (μετά).',
    'Τα καύσιμα: (χλμ/έτος ÷ 100) × λίτρα/100χλμ × τιμή/λίτρο.',
    'Τα ηλεκτρικά οχήματα έχουν μηδενικά τέλη κυκλοφορίας.',
    'Το μηνιαίο κόστος = ετήσιο σύνολο ÷ 12.',
  ];

  readonly explanationFormula =
    'Καύσιμα = (χλμ/έτος ÷ 100) × λίτρα/100χλμ × €/λίτρο · TCO = τέλη + ασφάλεια + καύσιμα + συντήρηση';

  constructor() {
    this.persistence.initSignalForm(this.formModel, STORAGE_KEY, this.destroyRef, {
      onApplyShareState: (state, model) => {
        if (state['firstRegistration']) {
          state['firstRegistration'] = normalizeRegistrationDate(String(state['firstRegistration']));
        }
        model.set({ ...model(), ...state } as CarCostModel);
      },
    });
  }

  result = computed(() => this.calc.calculate(this.buildParams()));

  registrationEra = computed((): RegistrationEra => {
    const fv = this.formModel();
    return getRegistrationEra(fv.firstRegistration || '', !!fv.isEv);
  });

  eraHint = computed(() => {
    switch (this.registrationEra()) {
      case 'cc': return 'Τέλη υπολογίζονται με βάση τον κυβισμό (1η άδεια έως 31/10/2010).';
      case 'co2_a': return 'Τέλη υπολογίζονται με βάση τις εκπομπές CO₂ (1η άδεια 1/11/2010 – 31/12/2020).';
      case 'co2_b': return 'Τέλη υπολογίζονται με βάση τις εκπομπές CO₂ (1η άδεια από 1/1/2021).';
      case 'ev': return 'Ηλεκτρικό όχημα: μηδενικά τέλη κυκλοφορίας.';
    }
  });

  shareSummary = computed(() => {
    const r = this.result();
    return `Κόστος αυτοκινήτου Salaries.gr: ${r.totalAnnual.toFixed(0)}€/έτος (${r.monthlyCost.toFixed(0)}€/μήνα)`;
  });

  setFuelMode(mode: 'calc' | 'manual'): void {
    this.formModel.update(m => ({ ...m, fuelMode: mode }));
  }

  onFirstRegistrationChange(value: string): void {
    this.formModel.update(m => ({
      ...m,
      firstRegistration: normalizeRegistrationDate(value),
    }));
  }

  private buildParams(): CarCostParams {
    const fv = this.formModel();
    const fuelMode = fv.fuelMode === 'manual' ? 'manual' : 'calc';
    return {
      firstRegistration: normalizeRegistrationDate(fv.firstRegistration || '2015-06-01'),
      isEv: !!fv.isEv,
      engineCc: this.toAmount(fv.engineCc),
      co2Grams: this.toAmount(fv.co2Grams),
      insuranceYear: this.toAmount(fv.insuranceYear),
      maintenanceYear: this.toAmount(fv.maintenanceYear),
      fuelMode,
      fuelCostYear: this.toAmount(fv.fuelCostYear),
      kmPerYear: this.toAmount(fv.kmPerYear),
      litersPer100km: this.toAmount(fv.litersPer100km),
      pricePerLiter: this.toAmount(fv.pricePerLiter),
    };
  }

  private toAmount(value: unknown): number {
    return Math.max(0, Number(value) || 0);
  }
}
