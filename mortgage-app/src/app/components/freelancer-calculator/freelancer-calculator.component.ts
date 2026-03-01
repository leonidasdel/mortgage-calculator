import { Component, computed, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';

const STORAGE_KEY = 'freelancerCalcState';

// EFKA monthly contributions 2026 (e-EFKA circular 6/2026, FEK B' 318/29-1-2026)
// Total = Pension + Health (cash + in-kind) + OAED (€10)
const EFKA_CATEGORIES = [
  { id: 'special', label: 'Ειδική (νέοι, πρώτα 5 έτη)', monthly: 160.46 },  // 111.06 pension + 3.58 health-cash + 35.82 health-kind + 10 OAED
  { id: 'cat1',    label: 'Κατηγορία 1',                 monthly: 260.77 },  // 185.09 + 5.97 + 59.71 + 10
  { id: 'cat2',    label: 'Κατηγορία 2',                 monthly: 310.93 },  // 222.12 + 7.16 + 71.65 + 10
  { id: 'cat3',    label: 'Κατηγορία 3',                 monthly: 370.63 },  // 281.82 + 7.16 + 71.65 + 10
  { id: 'cat4',    label: 'Κατηγορία 4',                 monthly: 443.47 },  // 354.66 + 7.16 + 71.65 + 10
  { id: 'cat5',    label: 'Κατηγορία 5',                 monthly: 529.45 },  // 440.64 + 7.16 + 71.65 + 10
  { id: 'cat6',    label: 'Κατηγορία 6',                 monthly: 685.87 },  // 597.06 + 7.16 + 71.65 + 10
];

type AgeGroup = 'under25' | '26to30' | 'over30';

// Business income tax brackets 2026 — age-dependent
// Under 25: first €20k at 0% (tax-free threshold)
// 26–30:    first €20k at 9% (reduced second bracket)
// Over 30:  standard 9%/22%/28%/36%/44%
function getTaxBrackets(ageGroup: AgeGroup): { from: number; to: number | null; rate: number }[] {
  if (ageGroup === 'under25') {
    return [
      { from: 0,     to: 20000, rate: 0.00 },
      { from: 20000, to: 30000, rate: 0.28 },
      { from: 30000, to: 40000, rate: 0.36 },
      { from: 40000, to: null,  rate: 0.44 },
    ];
  }
  if (ageGroup === '26to30') {
    return [
      { from: 0,     to: 10000, rate: 0.09 },
      { from: 10000, to: 20000, rate: 0.09 },
      { from: 20000, to: 30000, rate: 0.28 },
      { from: 30000, to: 40000, rate: 0.36 },
      { from: 40000, to: null,  rate: 0.44 },
    ];
  }
  // over30: standard brackets
  return [
    { from: 0,     to: 10000, rate: 0.09 },
    { from: 10000, to: 20000, rate: 0.22 },
    { from: 20000, to: 30000, rate: 0.28 },
    { from: 30000, to: 40000, rate: 0.36 },
    { from: 40000, to: null,  rate: 0.44 },
  ];
}

// Tax discount by number of children (same as salary calculator)
const BASE_TAX_DISCOUNTS: Record<number, number> = {
  0: 777, 1: 900, 2: 1120, 3: 1340, 4: 1580, 5: 1780,
};

interface TaxBracketRow {
  from: number;
  to: number | null;
  rate: number;
  taxableAmount: number;
  tax: number;
}

interface EfkaComparison {
  label: string;
  monthlyEfka: number;
  annualEfka: number;
  incomeTax: number;
  advanceTax: number;
  totalObligations: number;
  netAnnual: number;
  netMonthly: number;
  effectiveRate: number;
  selected: boolean;
}

interface FreelancerResult {
  annualRevenue: number;
  annualExpenses: number;
  efkaLabel: string;
  monthlyEfka: number;
  annualEfka: number;
  taxableIncome: number;
  bracketRows: TaxBracketRow[];
  grossTax: number;
  taxDiscount: number;
  incomeTax: number;
  advanceTaxRate: number;
  advanceTax: number;
  totalObligations: number;
  netAnnual: number;
  netMonthly: number;
  effectiveRate: number;
  efkaComparison: EfkaComparison[];
}

@Component({
  selector: 'app-freelancer-calculator',
  standalone: false,
  templateUrl: './freelancer-calculator.component.html',
  styleUrl: './freelancer-calculator.component.scss',
})
export class FreelancerCalculatorComponent implements OnInit {
  form: FormGroup;
  private formValues;

  readonly efkaCategories = EFKA_CATEGORIES;
  readonly childrenOptions = [0, 1, 2, 3, 4, 5, 6];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      annualRevenue:  [30000],
      annualExpenses: [5000],
      efkaCategory:   ['cat1'],
      yearsActive:    ['over3'],
      ageGroup:       ['over30' as AgeGroup],
      children:       [0],
    });
    this.formValues = toSignal(this.form.valueChanges, { initialValue: this.form.value });
  }

  ngOnInit(): void {
    this.loadState();
    this.form.valueChanges.subscribe(() => this.saveState());
  }

  result = computed<FreelancerResult>(() => {
    this.formValues();
    const fv = this.form.value;
    const revenue = Math.max(0, fv.annualRevenue || 0);
    const expenses = Math.max(0, fv.annualExpenses || 0);
    const catId = fv.efkaCategory || 'cat1';
    const yearsActive = fv.yearsActive || 'over3';
    const ageGroup: AgeGroup = fv.ageGroup || 'over30';
    const children = Math.min(Math.max(0, fv.children || 0), 6);

    const cat = EFKA_CATEGORIES.find(c => c.id === catId) || EFKA_CATEGORIES[1];
    const advanceRate = yearsActive === 'under3' ? 0.275 : 0.55;

    const calc = this.calcForCategory(cat, revenue, expenses, children, advanceRate, ageGroup);

    // Build comparison for all EFKA categories
    const efkaComparison: EfkaComparison[] = EFKA_CATEGORIES.map(c => {
      const r = this.calcForCategory(c, revenue, expenses, children, advanceRate, ageGroup);
      return {
        label: c.label,
        monthlyEfka: c.monthly,
        annualEfka: r.annualEfka,
        incomeTax: r.incomeTax,
        advanceTax: r.advanceTax,
        totalObligations: r.totalObligations,
        netAnnual: r.netAnnual,
        netMonthly: r.netMonthly,
        effectiveRate: r.effectiveRate,
        selected: c.id === catId,
      };
    });

    return { ...calc, efkaLabel: cat.label, monthlyEfka: cat.monthly, advanceTaxRate: advanceRate * 100, efkaComparison };
  });

  getSelectedEfkaMonthly(): number {
    const catId = this.form.get('efkaCategory')?.value;
    const cat = EFKA_CATEGORIES.find(c => c.id === catId);
    return cat ? cat.monthly : 0;
  }

  print(): void {
    window.print();
  }

  private calcForCategory(
    cat: typeof EFKA_CATEGORIES[0],
    revenue: number,
    expenses: number,
    children: number,
    advanceRate: number,
    ageGroup: AgeGroup = 'over30',
  ): Omit<FreelancerResult, 'efkaLabel' | 'monthlyEfka' | 'advanceTaxRate' | 'efkaComparison'> {
    const annualEfka = cat.monthly * 12;
    const taxableIncome = Math.max(0, revenue - expenses - annualEfka);

    // Walk tax brackets (age-dependent)
    const brackets = getTaxBrackets(ageGroup);
    const bracketRows: TaxBracketRow[] = [];
    let remaining = taxableIncome;
    let grossTax = 0;

    for (const b of brackets) {
      const width = b.to !== null ? b.to - b.from : Infinity;
      const taxable = Math.min(Math.max(0, remaining), width);
      if (taxable > 0) {
        const tax = taxable * b.rate;
        grossTax += tax;
        bracketRows.push({ from: b.from, to: b.to, rate: b.rate, taxableAmount: taxable, tax });
      }
      remaining -= width;
      if (remaining <= 0) break;
    }

    // Tax discount (children-based, same formula as salary calc)
    const baseDiscount = BASE_TAX_DISCOUNTS[Math.min(children, 5)] || 1780;
    const extra = children > 5 ? (children - 5) * 220 : 0;
    let taxDiscount = baseDiscount + extra;
    // Reduction: −€20 per €1,000 above €12,000
    if (taxableIncome > 12000) {
      taxDiscount = Math.max(0, taxDiscount - Math.floor((taxableIncome - 12000) / 1000) * 20);
    }

    const incomeTax = Math.max(0, grossTax - taxDiscount);
    const advanceTax = incomeTax * advanceRate;
    const totalObligations = annualEfka + incomeTax + advanceTax;
    const netAnnual = revenue - totalObligations;
    const netMonthly = netAnnual / 12;
    const effectiveRate = revenue > 0 ? (totalObligations / revenue) * 100 : 0;

    return {
      annualRevenue: revenue,
      annualExpenses: expenses,
      annualEfka,
      taxableIncome,
      bracketRows,
      grossTax,
      taxDiscount,
      incomeTax,
      advanceTax,
      totalObligations,
      netAnnual,
      netMonthly,
      effectiveRate,
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
