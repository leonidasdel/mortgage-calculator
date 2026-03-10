import { Component, computed, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';

const STORAGE_KEY = 'unusedLeaveCalcState';

// ΕΦΚΑ μισθωτών ιδιωτικού τομέα από 01.01.2025: 13,32%
const EFKA_RATE = 0.1332;
// Ανώτατο όριο ασφαλιστέων αποδοχών 2025
const MAX_INSURABLE = 7572.62;

// Φορολογικά κλιμάκια
const BRACKETS_2025 = [10000, 20000, 30000, 40000]; // 4 όρια → 5 κλιμάκια
const BRACKETS_2026 = [10000, 20000, 30000, 40000, 60000]; // 5 όρια → 6 κλιμάκια

type AgeGroup = 'over30' | '26to30' | 'under25';

// Συντελεστές 2025: ίδιοι για όλες τις ηλικιακές ομάδες
const RATES_2025: Record<AgeGroup, number[]> = {
  over30:   [0.09, 0.22, 0.28, 0.36, 0.44],
  '26to30': [0.09, 0.22, 0.28, 0.36, 0.44],
  under25:  [0.09, 0.22, 0.28, 0.36, 0.44],
};

// Συντελεστές 2026 (Ν. 5246/2025): νέες κλίμακες με ηλικιακές διαφορές
const RATES_2026: Record<AgeGroup, number[]> = {
  over30:   [0.09, 0.20, 0.26, 0.34, 0.39, 0.44],
  '26to30': [0.09, 0.09, 0.26, 0.34, 0.39, 0.44],
  under25:  [0.00, 0.00, 0.26, 0.34, 0.39, 0.44],
};

// Μείωση φόρου βάσει αριθμού τέκνων (άρθρο 16 ΚΦΕ)
const TAX_DISCOUNT: Record<number, number> = {
  0: 777, 1: 900, 2: 1120, 3: 1340, 4: 1580, 5: 1780,
};

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

  constructor(private fb: FormBuilder) {
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
    // = 50% αποζημίωσης, μέγιστο ½ μηνιαίου μισθού
    let holidayBonus = 0;
    let holidayBonusCapped = false;
    if (includeBonus) {
      const rawBonus = +(leaveCompensation * 0.5).toFixed(2);
      const cap      = +(monthlyEquiv / 2).toFixed(2);
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

    // Επιλογή κλιμακίων & συντελεστών βάσει έτους
    const brackets = taxYear === '2026' ? BRACKETS_2026 : BRACKETS_2025;
    const rates    = taxYear === '2026' ? RATES_2026[ageGroup] : RATES_2025[ageGroup];

    // Φόρος στο βασικό εισόδημα
    const taxOnBase  = this.calcTax(annualBaseTaxable, brackets, rates, children);

    // Φόρος στο συνολικό εισόδημα (βασικό + αποζημίωση)
    const totalAnnualTaxable = +(annualBaseTaxable + taxableLeaveComp).toFixed(2);
    const taxOnTotal = this.calcTax(totalAnnualTaxable, brackets, rates, children);

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

  toggleTaxBreakdown(): void {
    this.showTaxBreakdown = !this.showTaxBreakdown;
  }

  print(): void {
    window.print();
  }

  // Υπολογισμός φόρου με κλιμάκια
  private calcTax(
    taxable: number,
    brackets: number[],
    rates: number[],
    children: number,
  ): { tax: number; taxGross: number; breakdown: TaxBracket[] } {
    const breakdown: TaxBracket[] = [];
    let remaining = taxable;
    let totalTax  = 0;

    for (let i = 0; i < rates.length; i++) {
      const from        = i === 0 ? 0 : brackets[i - 1];
      const to          = i < brackets.length ? brackets[i] : null;
      const bracketSize = to !== null ? to - from : Infinity;
      const inBracket   = Math.min(Math.max(0, remaining), bracketSize);

      if (inBracket > 0) {
        const tax = +(inBracket * rates[i]).toFixed(2);
        totalTax += tax;
        breakdown.push({ from, to, rate: rates[i] * 100, taxableAmount: inBracket, tax });
      }

      remaining -= bracketSize;
      if (remaining <= 0) break;
    }

    // Μείωση φόρου (άρθρο 16 ΚΦΕ) – μειώνεται 20€/1.000€ για εισόδημα > 12.000€
    let discount = children <= 5 ? TAX_DISCOUNT[children] : 1780 + 220 * (children - 5);
    if (taxable > 12000) {
      discount = Math.max(0, discount - ((taxable - 12000) / 1000) * 20);
    }

    const tax = Math.max(0, +(totalTax - discount).toFixed(2));
    // taxGross: φόρος ΠΡΙΝ τη μείωση (σύνολο κλιμακίων), χρήσιμο για εμφάνιση στον πίνακα
    return { tax, taxGross: +totalTax.toFixed(2), breakdown };
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
