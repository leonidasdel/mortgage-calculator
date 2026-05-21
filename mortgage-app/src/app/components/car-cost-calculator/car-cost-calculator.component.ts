import { Component, computed, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  CarCostCalculatorService,
  CarCostParams,
} from '../../services/car-cost-calculator.service';
import {
  getRegistrationEra,
  normalizeRegistrationDate,
  RegistrationEra,
} from '../../constants/circulation-fee.constants';
import { ShareStateService } from '../../services/share-state.service';

const STORAGE_KEY = 'carCostCalcState';

@Component({
  selector: 'app-car-cost-calculator',
  standalone: false,
  templateUrl: './car-cost-calculator.component.html',
  styleUrl: './car-cost-calculator.component.scss',
})
export class CarCostCalculatorComponent implements OnInit {
  form: FormGroup;
  private formValues;

  readonly explanationSteps = [
    'Τα τέλη κυκλοφορίας υπολογίζονται από cc (πριν 2010) ή CO₂ (μετά).',
    'Τα καύσιμα: (χλμ/έτος ÷ 100) × λίτρα/100χλμ × τιμή/λίτρο.',
    'Τα ηλεκτρικά οχήματα έχουν μηδενικά τέλη κυκλοφορίας.',
    'Το μηνιαίο κόστος = ετήσιο σύνολο ÷ 12.',
  ];

  readonly explanationFormula =
    'Καύσιμα = (χλμ/έτος ÷ 100) × λίτρα/100χλμ × €/λίτρο · TCO = τέλη + ασφάλεια + καύσιμα + συντήρηση';

  constructor(
    private fb: FormBuilder,
    private calc: CarCostCalculatorService,
    private shareSvc: ShareStateService,
  ) {
    this.form = this.fb.group({
      firstRegistration: ['2015-06-01'],
      isEv: [false],
      engineCc: [1400],
      co2Grams: [120],
      insuranceYear: [450],
      fuelMode: ['calc'],
      fuelCostYear: [1800],
      kmPerYear: [15000],
      litersPer100km: [6.5],
      pricePerLiter: [1.85],
      maintenanceYear: [600],
    });

    this.formValues = toSignal(this.form.valueChanges, { initialValue: this.form.value });
  }

  ngOnInit(): void {
    this.loadState();
    const qp = this.shareSvc.getQueryParams();
    if (Object.keys(qp).length) {
      const state = this.shareSvc.deserializeState(qp);
      if (state['firstRegistration']) {
        state['firstRegistration'] = normalizeRegistrationDate(String(state['firstRegistration']));
      }
      this.form.patchValue(state, { emitEvent: false });
    }
    this.form.valueChanges.subscribe(() => this.saveState());
  }

  result = computed(() => {
    this.formValues();
    return this.calc.calculate(this.buildParams());
  });

  registrationEra = computed((): RegistrationEra => {
    this.formValues();
    const fv = this.form.value;
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
    this.formValues();
    const r = this.result();
    return `Κόστος αυτοκινήτου Salaries.gr: ${r.totalAnnual.toFixed(0)}€/έτος (${r.monthlyCost.toFixed(0)}€/μήνα)`;
  });

  setFuelMode(mode: 'calc' | 'manual'): void {
    this.form.patchValue({ fuelMode: mode });
  }

  private buildParams(): CarCostParams {
    const fv = this.form.value;
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

  private saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.form.value));
    } catch { /* storage unavailable */ }
  }

  private loadState(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const state = JSON.parse(raw);
      if (state?.firstRegistration) {
        state.firstRegistration = normalizeRegistrationDate(state.firstRegistration);
      }
      if (state && state.fuelMode == null) {
        state.fuelMode = 'manual';
      }
      if (state) this.form.patchValue(state, { emitEvent: false });
    } catch { /* ignore invalid storage */ }
  }
}
