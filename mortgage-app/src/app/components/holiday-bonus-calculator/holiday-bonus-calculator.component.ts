import { Component, computed, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { SalaryCalculatorService } from '../../services/salary-calculator.service';
import { ShareStateService } from '../../services/share-state.service';
import { SalaryParams, BonusBreakdown } from '../../models/salary.models';

const STORAGE_KEY = 'holidayBonusCalcState';

// Δώρο Χριστουγέννων: Μάι–Δεκ = 8 μήνες
const CHRISTMAS_MONTHS = 8;
// Δώρο Πάσχα & Επίδομα Αδείας: Ιαν–Απρ = 4 μήνες
const EASTER_MONTHS = 4;

interface AdjustedBonus {
  grossBase: number;
  leaveSurcharge: number;
  grossTotal: number;
  efka: number;
  tax: number;
  net: number;
}

interface HolidayBonusResult {
  christmas: AdjustedBonus;
  easter: AdjustedBonus;
  leave: AdjustedBonus;
  christmasFactor: number;
  easterFactor: number;
  totalNet: number;
  totalGross: number;
  totalEfka: number;
  totalTax: number;
}

@Component({
  selector: 'app-holiday-bonus-calculator',
  standalone: false,
  templateUrl: './holiday-bonus-calculator.component.html',
  styleUrl: './holiday-bonus-calculator.component.scss',
})
export class HolidayBonusCalculatorComponent implements OnInit {
  form: FormGroup;
  private formValues;

  readonly explanationSteps = [
    'Δώρο Χριστουγέννων = 1 μισθός (Μάι–Δεκ) + προσαύξηση 4,166%.',
    'Δώρο Πάσχα & επίδομα αδείας = ½ μισθού (Ιαν–Απρ) + 4,166%.',
    'Κάθε δώρο υπόκειται σε ΕΦΚΑ (13,37%) και φόρο εισοδήματος.',
    'Για μερική απασχόληση: αναλογία εργάσιμων μηνών.',
  ];

  readonly explanationFormula =
    'Καθαρά = Σ(μικτά δώρων) − ΕΦΚΑ − φόρος (14μηνο μοντέλο)';

  constructor(
    private fb: FormBuilder,
    private calc: SalaryCalculatorService,
    private shareSvc: ShareStateService,
  ) {
    this.form = this.fb.group({
      grossMonthly:           [1500],
      year:                   [2026],
      ageGroup:               ['over30'],
      children:               [0],
      partialEnabled:         [false],
      christmasMonthsWorked:  [8],
      easterMonthsWorked:     [4],
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

  result = computed<HolidayBonusResult>(() => {
    this.formValues();
    const fv = this.form.value;

    const params: SalaryParams = {
      grossMonthly: Math.max(0, +(fv.grossMonthly || 0)),
      year:         fv.year || 2026,
      ageGroup:     fv.ageGroup || 'over30',
      children:     Math.max(0, +(fv.children || 0)),
    };

    const sr = this.calc.calculate(params);
    const partial = !!fv.partialEnabled;

    const cFactor = partial
      ? Math.min(1, Math.max(0, (fv.christmasMonthsWorked || 0) / CHRISTMAS_MONTHS))
      : 1;
    const eFactor = partial
      ? Math.min(1, Math.max(0, (fv.easterMonthsWorked || 0) / EASTER_MONTHS))
      : 1;

    const applyFactor = (b: BonusBreakdown, f: number): AdjustedBonus => ({
      grossBase:      +((b.grossBase      * f).toFixed(2)),
      leaveSurcharge: +((b.leaveSurcharge * f).toFixed(2)),
      grossTotal:     +((b.grossTotal     * f).toFixed(2)),
      efka:           +((b.efka           * f).toFixed(2)),
      tax:            +((b.tax            * f).toFixed(2)),
      net:            +((b.net            * f).toFixed(2)),
    });

    const christmas = applyFactor(sr.christmasBonus,  cFactor);
    const easter    = applyFactor(sr.easterBonus,     eFactor);
    const leave     = applyFactor(sr.leaveAllowance,  eFactor);

    return {
      christmas,
      easter,
      leave,
      christmasFactor: cFactor,
      easterFactor:    eFactor,
      totalNet:   +(christmas.net   + easter.net   + leave.net).toFixed(2),
      totalGross: +(christmas.grossTotal + easter.grossTotal + leave.grossTotal).toFixed(2),
      totalEfka:  +(christmas.efka  + easter.efka  + leave.efka).toFixed(2),
      totalTax:   +(christmas.tax   + easter.tax   + leave.tax).toFixed(2),
    };
  });

  shareSummary = computed(() => {
    const r = this.result();
    return `Δώρα Salaries.gr: καθαρά ${r.totalNet.toFixed(2)}€ (Χριστούγεννα + Πάσχα + επίδομα αδείας)`;
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
