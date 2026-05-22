import { Component, computed, DestroyRef, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { SalaryCalculatorService } from '../../services/salary-calculator.service';
import { CalculatorPersistenceService } from '../../services/calculator-persistence.service';
import { AgeGroup } from '../../models/salary.models';

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
  private destroyRef = inject(DestroyRef);

  readonly efkaCategories = EFKA_CATEGORIES;
  readonly childrenOptions = [0, 1, 2, 3, 4, 5, 6];

  readonly explanationSteps = [
    'Αφαιρούνται επαγγελματικά έξοδα και ετήσιες εισφορές ΕΦΚΑ από τα έσοδα.',
    'Ο φόρος εισοδήματος υπολογίζεται με προοδευτική κλίμακα ΚΦΕ.',
    'Προστίθεται προκαταβολή φόρου 55% (ή 27,5% τα πρώτα 3 έτη).',
    'Το καθαρό = έσοδα − έξοδα − ΕΦΚΑ − φόρος − προκαταβολή.',
  ];

  readonly explanationFormula =
    'Καθαρά = Έσοδα − Έξοδα − ΕΦΚΑ − Φόρος − Προκαταβολή';

  constructor(
    private fb: FormBuilder,
    private salaryService: SalaryCalculatorService,
    private persistence: CalculatorPersistenceService,
  ) {
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
    this.persistence.initCalculatorForm(this.form, STORAGE_KEY, this.destroyRef);
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

  shareSummary = computed(() => {
    const r = this.result();
    return `Ελεύθερος επαγγελματίας Salaries.gr: καθαρά ${r.netMonthly.toFixed(2)}€/μήνα (${r.netAnnual.toFixed(2)}€/έτος)`;
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

    const taxResult = this.salaryService.calculateTaxOnly(taxableIncome, 2026, ageGroup, children);
    const grossTax = taxResult.totalTax;
    const taxDiscount = 0; // άρθρο 16 ΚΦΕ — μόνο για μισθωτούς, όχι ελεύθερους επαγγελματίες
    const incomeTax = grossTax;
    const bracketRows: TaxBracketRow[] = taxResult.breakdown.map(b => ({
      from: b.from,
      to: b.to,
      rate: b.rate / 100,
      taxableAmount: b.taxableAmount,
      tax: b.tax,
    }));
    const advanceTax = incomeTax * advanceRate;
    const totalObligations = annualEfka + incomeTax + advanceTax;
    const netAnnual = revenue - expenses - totalObligations;
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
}
