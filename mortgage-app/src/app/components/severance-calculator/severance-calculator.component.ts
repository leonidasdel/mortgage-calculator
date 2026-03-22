import { Component, computed, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';

const STORAGE_KEY = 'severanceCalcState';

// Ν. 4808/2021 — Αποζημίωση απόλυσης ιδιωτικού τομέα (λευκόχολοι + εργατοτεχνίτες ενοποιημένα)
// Πίνακας: συμπληρωμένα έτη υπηρεσίας → μήνες αποζημίωσης (απόλυση χωρίς προειδοποίηση)
const SEVERANCE_TABLE: { years: number; months: number }[] = [
  { years: 0,  months: 0  },
  { years: 1,  months: 1  },
  { years: 2,  months: 2  },
  { years: 3,  months: 2  },
  { years: 4,  months: 2  },
  { years: 5,  months: 3  },
  { years: 6,  months: 3  },
  { years: 7,  months: 3  },
  { years: 8,  months: 4  },
  { years: 9,  months: 4  },
  { years: 10, months: 5  },
  { years: 11, months: 6  },
  { years: 12, months: 7  },
  { years: 13, months: 8  },
  { years: 14, months: 9  },
  { years: 15, months: 10 },
  { years: 16, months: 11 },
  { years: 17, months: 12 },
  { years: 18, months: 13 },
  { years: 19, months: 14 },
  { years: 20, months: 15 },
];

const SEVERANCE_CAP_MONTHS = 24;

function getSeveranceMonths(completedYears: number): number {
  if (completedYears < 1) return 0;
  if (completedYears >= 21) {
    return Math.min(SEVERANCE_CAP_MONTHS, 15 + (completedYears - 20));
  }
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
  grossSeverance:      number;
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

  constructor(private fb: FormBuilder) {
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

    const grossSeverance = +(actualMonths * gross).toFixed(2);

    return {
      completedYears,
      noticePeriod,
      fullSeveranceMonths: fullMonths,
      actualMonths,
      grossMonthly: gross,
      grossSeverance,
      netSeverance: grossSeverance, // αφορολόγητη & χωρίς ΕΦΚΑ
      isZero:    completedYears < 1,
      isCapped,
      terminationType: termType,
    };
  });

  print(): void {
    window.print();
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
