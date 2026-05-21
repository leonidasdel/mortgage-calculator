import { Component, computed, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ShareStateService } from '../../services/share-state.service';

const STORAGE_KEY = 'severanceCalcState';

// Ν. 4808/2021 — Αποζημίωση απόλυσης ιδιωτικού τομέα (λευκόχολοι + εργατοτεχνίτες ενοποιημένα)
// Πίνακας: συμπληρωμένα έτη υπηρεσίας → μήνες αποζημίωσης (απόλυση χωρίς προειδοποίηση)
// Περιλαμβάνει τη βασική αποζημίωση (έως 12 μήνες) και την επιπλέον αποζημίωση για παλαιούς υπαλλήλους (Ν. 4093/2012)
const SEVERANCE_TABLE: { years: number; months: number }[] = [
  { years: 0,  months: 0  },
  { years: 1,  months: 2  },
  { years: 2,  months: 2  },
  { years: 3,  months: 2  },
  { years: 4,  months: 3  },
  { years: 5,  months: 3  },
  { years: 6,  months: 4  },
  { years: 7,  months: 4  },
  { years: 8,  months: 5  },
  { years: 9,  months: 5  },
  { years: 10, months: 6  },
  { years: 11, months: 7  },
  { years: 12, months: 8  },
  { years: 13, months: 9  },
  { years: 14, months: 10 },
  { years: 15, months: 11 },
  { years: 16, months: 12 },
  { years: 17, months: 13 },
  { years: 18, months: 14 },
  { years: 19, months: 15 },
  { years: 20, months: 16 },
  { years: 21, months: 17 },
  { years: 22, months: 18 },
  { years: 23, months: 19 },
  { years: 24, months: 20 },
  { years: 25, months: 21 },
  { years: 26, months: 22 },
  { years: 27, months: 23 },
  { years: 28, months: 24 },
];

const SEVERANCE_CAP_MONTHS = 24;
const SEVERANCE_TAX_BRACKETS: { upTo: number | null; rate: number }[] = [
  { upTo: 60000, rate: 0 },
  { upTo: 100000, rate: 0.10 },
  { upTo: 150000, rate: 0.20 },
  { upTo: null, rate: 0.30 },
];

function getSeveranceMonths(completedYears: number): number {
  if (completedYears < 1) return 0;
  if (completedYears >= 28) return SEVERANCE_CAP_MONTHS;
  // Find last entry where years <= completedYears
  let months = 0;
  for (const row of SEVERANCE_TABLE) {
    if (row.years <= completedYears) months = row.months;
  }
  return months;
}

function getNoticePeriod(completedYears: number): number {
  if (completedYears < 1)  return 0;
  if (completedYears < 2)  return 1;
  if (completedYears < 5)  return 2;
  if (completedYears < 10) return 3;
  return 4;
}

export interface SeveranceResult {
  completedYears:      number;
  noticePeriod:        number;
  fullSeveranceMonths: number;
  actualMonths:        number;
  grossMonthly:        number;
  baseSalaryCalculation: number;
  grossSeverance:      number;
  severanceTax:        number;
  netSeverance:        number;
  isZero:              boolean;
  isCapped:            boolean;
  terminationType:     string;
}

@Component({
  selector: 'app-severance-calculator',
  standalone: false,
  templateUrl: './severance-calculator.component.html',
  styleUrl: './severance-calculator.component.scss',
})
export class SeveranceCalculatorComponent implements OnInit {
  form: FormGroup;
  private formValues;

  readonly explanationSteps = [
    'Οι μήνες αποζημίωσης καθορίζονται από τον πίνακα Ν.4808/2021.',
    'Μισθός υπολογισμού = μηνιαίος × 14 ÷ 12 (προσαύξηση 1/6).',
    'Με προειδοποίηση ή συναινετική λύση: αποζημίωση = ½.',
    'Φόρος αυτοτελώς: 0% έως €60.000, 10% / 20% / 30% πάνω.',
  ];

  readonly explanationFormula =
    'Αποζημίωση = μήνες × (μικτός × 14/12) · Καθαρά = μεικτή − φόρος';

  constructor(
    private fb: FormBuilder,
    private shareSvc: ShareStateService,
  ) {
    this.form = this.fb.group({
      grossMonthly:    [1500],
      yearsOfService:  [5],
      monthsExtra:     [0],
      terminationType: ['without_notice'],
    });
    this.formValues = toSignal(this.form.valueChanges, { initialValue: this.form.value });
  }

  ngOnInit(): void {
    this.loadState();
    const qp = this.shareSvc.getQueryParams();
    if (Object.keys(qp).length) {
      const state = this.shareSvc.deserializeState(qp);
      this.form.patchValue(state, { emitEvent: false });
    }
    this.form.valueChanges.subscribe(() => this.saveState());
  }

  result = computed<SeveranceResult>(() => {
    this.formValues();
    const fv = this.form.value;

    const gross        = Math.max(0, +(fv.grossMonthly || 0));
    const years        = Math.max(0, Math.floor(+(fv.yearsOfService || 0)));
    const months       = Math.min(11, Math.max(0, Math.floor(+(fv.monthsExtra || 0))));
    const termType     = fv.terminationType || 'without_notice';

    // Συμπληρωμένα έτη (μήνες δεν προάγονται σε έτος)
    const completedYears = years + (months >= 12 ? 1 : 0);
    const noticePeriod   = getNoticePeriod(completedYears);
    const fullMonths     = getSeveranceMonths(completedYears);
    const isCapped       = completedYears >= 1 && fullMonths >= SEVERANCE_CAP_MONTHS;

    // Με προειδοποίηση / συναινετική: μισή αποζημίωση
    const actualMonths = termType === 'without_notice' ? fullMonths : fullMonths / 2;

    const baseSalaryCalculation = +(gross * 14 / 12).toFixed(2);
    const grossSeverance = +(actualMonths * baseSalaryCalculation).toFixed(2);
    const severanceTax = this.calcSeveranceTax(grossSeverance);
    const netSeverance = Math.max(0, +(grossSeverance - severanceTax).toFixed(2));

    return {
      completedYears,
      noticePeriod,
      fullSeveranceMonths: fullMonths,
      actualMonths,
      grossMonthly: gross,
      baseSalaryCalculation,
      grossSeverance,
      severanceTax,
      netSeverance,
      isZero:    completedYears < 1,
      isCapped,
      terminationType: termType,
    };
  });

  shareSummary = computed(() => {
    const r = this.result();
    return `Αποζημίωση Salaries.gr: καθαρά ${r.netSeverance.toFixed(2)}€ (${r.actualMonths} μισθοί, ${r.completedYears} έτη)`;
  });

  print(): void {
    window.print();
  }

  private calcSeveranceTax(grossSeverance: number): number {
    let previousLimit = 0;
    let tax = 0;

    for (const bracket of SEVERANCE_TAX_BRACKETS) {
      const upper = bracket.upTo ?? Infinity;
      const taxable = Math.min(Math.max(0, grossSeverance - previousLimit), upper - previousLimit);
      if (taxable > 0) tax += taxable * bracket.rate;
      previousLimit = upper;
      if (grossSeverance <= upper) break;
    }

    return +tax.toFixed(2);
  }

  private saveState(): void {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.form.value)); } catch { /* ignore */ }
  }

  private loadState(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const state = JSON.parse(raw);
      if (state) this.form.patchValue(state, { emitEvent: false });
    } catch { /* ignore */ }
  }
}
