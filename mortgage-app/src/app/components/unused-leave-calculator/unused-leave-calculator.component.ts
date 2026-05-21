import { Component, computed, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { EFKA_EMPLOYEE_RATE, MAX_INSURABLE_EARNINGS } from '../../constants/payroll.constants';
import { SalaryCalculatorService } from '../../services/salary-calculator.service';
import { ShareStateService } from '../../services/share-state.service';
import { AgeGroup } from '../../models/salary.models';

const STORAGE_KEY = 'unusedLeaveCalcState';

// ΕΦΚΑ μισθωτών ιδιωτικού τομέα από 01.01.2025
const EFKA_RATE = EFKA_EMPLOYEE_RATE;
const MAX_INSURABLE = MAX_INSURABLE_EARNINGS;

export interface TaxBracket {
  from: number;
  to: number | null;
  rate: number;
  taxableAmount: number;
  tax: number;
}

export interface LeaveResult {
  dailyWage: number;
  monthlyEquiv: number;
  // Αποζημίωση
  leaveCompensation: number;
  holidayBonus: number;
  holidayBonusCapped: boolean;
  totalGross: number;
  // ΕΦΚΑ
  efkaOnLeaveComp: number;
  efkaOnHolidayBonus: number;
  totalEfka: number;
  // Φόρος εισοδήματος
  annualBaseGross: number;
  annualBaseTaxable: number;
  taxableLeaveComp: number;
  taxOnBase: number;
  taxOnTotalGross: number;   // Φόρος πριν τη μείωση (σύνολο κλιμακίων)
  taxDiscountAmount: number; // Ποσό μείωσης φόρου (άρθρο 16 ΚΦΕ)
  taxOnTotal: number;        // Φόρος μετά τη μείωση
  marginalTax: number;
  effectiveTaxRate: number;
  // Σύνολο
  totalNet: number;
  totalDeductions: number;
  // Φορολογική ανάλυση
  taxBreakdown: TaxBracket[];
}

@Component({
  selector: 'app-unused-leave-calculator',
  standalone: false,
  templateUrl: './unused-leave-calculator.component.html',
  styleUrl: './unused-leave-calculator.component.scss',
})
export class UnusedLeaveCalculatorComponent implements OnInit {
  form: FormGroup;
  private formValues;

  showTaxBreakdown = false;

  readonly explanationSteps = [
    'Ημερομίσθιο = μηνιαίος ÷ 25 (πενθήμερο) ή ÷ 26 (εξαήμερο).',
    'Αποζημίωση = ημερομίσθιο × ημέρες μη ληφθείσας άδειας.',
    'Το επίδομα αδείας = 100% των αποδοχών, με ανώτατο όριο.',
    'Αφαιρούνται ΕΦΚΑ (αν ισχύει) και οριακός φόρος εισοδήματος.',
  ];

  readonly explanationFormula =
    'Καθαρά = (αποζημίωση + επίδομα) − ΕΦΚΑ − οριακός φόρος';

  constructor(
    private fb: FormBuilder,
    private salaryService: SalaryCalculatorService,
    private shareSvc: ShareStateService,
  ) {
    this.form = this.fb.group({
      salaryType:           ['monthly'],       // 'monthly' | 'daily'
      grossMonthly:         [1500],
      dailyWage:            [69.23],
      workWeek:             ['5day'],           // '5day' | '6day'
      unusedDays:           [10],
      includeHolidayBonus:  [true],
      situation:            ['termination'],    // 'termination' | 'during_employment'
      taxYear:              ['2025'],
      ageGroup:             ['over30'],
      children:             [0],
      useCustomAnnualIncome: [false],
      customAnnualGross:    [21000],
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

  result = computed<LeaveResult>(() => {
    this.formValues();
    const fv = this.form.value;

    const salaryType       = fv.salaryType as 'monthly' | 'daily';
    const workWeek         = fv.workWeek as '5day' | '6day';
    const unusedDays       = Math.max(0, +(fv.unusedDays || 0));
    const includeBonus     = !!fv.includeHolidayBonus;
    const situation        = fv.situation as 'termination' | 'during_employment';
    const taxYear          = fv.taxYear as '2025' | '2026';
    const ageGroup         = (fv.ageGroup || 'over30') as AgeGroup;
    const children         = Math.min(Math.max(0, +(fv.children || 0)), 10);
    const useCustom        = !!fv.useCustomAnnualIncome;

    // Διαιρέτης: 25 για πενθήμερο, 26 για εξαήμερο
    const divisor = workWeek === '5day' ? 25 : 26;

    // Υπολογισμός ημερομισθίου & μηνιαίου ισοδύναμου
    let dailyWage: number;
    let monthlyEquiv: number;

    if (salaryType === 'monthly') {
      monthlyEquiv = Math.max(0, +(fv.grossMonthly || 0));
      dailyWage    = +(monthlyEquiv / divisor).toFixed(4);
    } else {
      dailyWage    = Math.max(0, +(fv.dailyWage || 0));
      monthlyEquiv = +(dailyWage * divisor).toFixed(2);
    }

    // ─── ΑΠΟΖΗΜΙΩΣΗ ΜΗ ΛΗΦΘΕΙΣΑΣ ΑΔΕΙΑΣ ────────────────────────────────────
    // Βάση: ημερομίσθιο × αριθμός ημερών μη ληφθείσας άδειας
    const leaveCompensation = +(dailyWage * unusedDays).toFixed(2);

    // ─── ΕΠΙΔΟΜΑ ΑΔΕΙΑΣ ─────────────────────────────────────────────────────
    // Ν. 4504/1966 άρθρο 3 & ΑΠ 1182/2017:
    //   Επίδομα = ίσο με τις αποδοχές αδείας (100%, ΌΧΙ 50%)
    //   Ανώτατο: ½ μηνιαίος μισθός (μισθωτοί) | 13 ημερομίσθια (ημερομίσθιοι)
    let holidayBonus = 0;
    let holidayBonusCapped = false;
    if (includeBonus) {
      const rawBonus = leaveCompensation; // 100% των αποδοχών αδείας
      const cap = salaryType === 'monthly'
        ? +(monthlyEquiv / 2).toFixed(2)        // μισθωτοί: ½ μηνιαίος μισθός
        : +(13 * dailyWage).toFixed(2);         // ημερομίσθιοι: 13 ημερομίσθια
      if (rawBonus > cap) {
        holidayBonus      = cap;
        holidayBonusCapped = true;
      } else {
        holidayBonus = rawBonus;
      }
    }

    const totalGross = +(leaveCompensation + holidayBonus).toFixed(2);

    // ─── ΕΦΚΑ ───────────────────────────────────────────────────────────────
    // • Λύση σχέσης εργασίας: η αποζημίωση ΔΕΝ υπόκειται σε ΕΦΚΑ.
    //   Το επίδομα αδείας ΥΠΟΚΕΙΤΑΙ σε ΕΦΚΑ (ΑΝ. 1846/1951).
    // • Κατά τη διάρκεια σχέσης: όλες οι αποδοχές υπόκεινται σε ΕΦΚΑ.
    let efkaOnLeaveComp   = 0;
    let efkaOnHolidayBonus = 0;

    if (situation === 'termination') {
      efkaOnLeaveComp    = 0;
      efkaOnHolidayBonus = +(Math.min(holidayBonus, MAX_INSURABLE) * EFKA_RATE).toFixed(2);
    } else {
      // Κατά τη διάρκεια: ΕΦΚΑ στα πάντα, εντός ορίου
      const insLeave    = Math.min(leaveCompensation, MAX_INSURABLE);
      const insBonus    = Math.min(holidayBonus, Math.max(0, MAX_INSURABLE - leaveCompensation));
      efkaOnLeaveComp    = +(insLeave * EFKA_RATE).toFixed(2);
      efkaOnHolidayBonus = +(insBonus * EFKA_RATE).toFixed(2);
    }

    const totalEfka = +(efkaOnLeaveComp + efkaOnHolidayBonus).toFixed(2);

    // ─── ΦΟΡΟΣ ΕΙΣΟΔΗΜΑΤΟΣ ──────────────────────────────────────────────────
    // Το φορολογητέο ποσό της αποζημίωσης = ακαθάριστο - ΕΦΚΑ
    const taxableLeaveComp = Math.max(0, +(totalGross - totalEfka).toFixed(2));

    // Ετήσιο βασικό εισόδημα (εκτός αποζημίωσης)
    let annualBaseGross: number;
    if (useCustom) {
      annualBaseGross = Math.max(0, +(fv.customAnnualGross || 0));
    } else {
      annualBaseGross = +(monthlyEquiv * 14).toFixed(2); // 12 μισθοί + δώρα (14μηνο)
    }

    // ΕΦΚΑ στο βασικό ετήσιο εισόδημα (απλοποιημένος υπολογισμός)
    const monthlyForBase      = +(annualBaseGross / 14).toFixed(2);
    const insMonthlyBase      = Math.min(monthlyForBase, MAX_INSURABLE);
    const annualEfkaBase      = +(insMonthlyBase * EFKA_RATE * 14).toFixed(2);
    const annualBaseTaxable   = Math.max(0, +(annualBaseGross - annualEfkaBase).toFixed(2));

    const year = taxYear === '2026' ? 2026 : 2025;

    // Φόρος στο βασικό εισόδημα
    const taxOnBase  = this.calcTax(annualBaseTaxable, year, ageGroup, children);

    // Φόρος στο συνολικό εισόδημα (βασικό + αποζημίωση)
    const totalAnnualTaxable = +(annualBaseTaxable + taxableLeaveComp).toFixed(2);
    const taxOnTotal = this.calcTax(totalAnnualTaxable, year, ageGroup, children);

    // Οριακός φόρος = επιπλέον φόρος λόγω της αποζημίωσης
    const marginalTax = Math.max(0, +(taxOnTotal.tax - taxOnBase.tax).toFixed(2));

    // Σύνολο φόρου πριν τη μείωση (για εμφάνιση στον πίνακα κλιμακίων)
    const taxOnTotalGross   = taxOnTotal.taxGross;
    const taxDiscountAmount = +(taxOnTotalGross - taxOnTotal.tax).toFixed(2);

    const effectiveTaxRate = taxableLeaveComp > 0
      ? +((marginalTax / taxableLeaveComp) * 100).toFixed(1)
      : 0;

    const totalDeductions = +(totalEfka + marginalTax).toFixed(2);
    const totalNet        = Math.max(0, +(totalGross - totalDeductions).toFixed(2));

    return {
      dailyWage:          +dailyWage.toFixed(2),
      monthlyEquiv,
      leaveCompensation,
      holidayBonus:       +holidayBonus.toFixed(2),
      holidayBonusCapped,
      totalGross,
      efkaOnLeaveComp,
      efkaOnHolidayBonus,
      totalEfka,
      annualBaseGross,
      annualBaseTaxable,
      taxableLeaveComp,
      taxOnBase:          taxOnBase.tax,
      taxOnTotalGross,
      taxDiscountAmount,
      taxOnTotal:         taxOnTotal.tax,
      marginalTax,
      effectiveTaxRate,
      totalNet,
      totalDeductions,
      taxBreakdown:       taxOnTotal.breakdown,
    };
  });

  shareSummary = computed(() => {
    const r = this.result();
    return `Μη ληφθείσα άδεια Salaries.gr: καθαρά ${r.totalNet.toFixed(2)}€ (${this.form.value.unusedDays} ημέρες)`;
  });

  toggleTaxBreakdown(): void {
    this.showTaxBreakdown = !this.showTaxBreakdown;
  }

  print(): void {
    window.print();
  }

  // Υπολογισμός φόρου με κλιμάκια (κοινή λογική με SalaryCalculatorService)
  private calcTax(
    taxable: number,
    year: number,
    ageGroup: AgeGroup,
    children: number,
  ): { tax: number; taxGross: number; breakdown: TaxBracket[] } {
    const result = this.salaryService.calculateTaxOnly(taxable, year, ageGroup, children);
    return {
      tax: result.annualTax,
      taxGross: result.totalTax,
      breakdown: result.breakdown.map(b => ({
        from: b.from,
        to: b.to,
        rate: b.rate,
        taxableAmount: b.taxableAmount,
        tax: b.tax,
      })),
    };
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
