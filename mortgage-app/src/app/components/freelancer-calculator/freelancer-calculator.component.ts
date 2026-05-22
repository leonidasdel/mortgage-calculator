import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { SalaryCalculatorService } from '../../services/salary-calculator.service';
import { CalculatorPersistenceService } from '../../services/calculator-persistence.service';
import { AgeGroup } from '../../models/salary.models';

const STORAGE_KEY = 'freelancerCalcState';

const EFKA_CATEGORIES = [
  { id: 'special', label: 'Ειδική (νέοι, πρώτα 5 έτη)', monthly: 160.46 },
  { id: 'cat1',    label: 'Κατηγορία 1',                 monthly: 260.77 },
  { id: 'cat2',    label: 'Κατηγορία 2',                 monthly: 310.93 },
  { id: 'cat3',    label: 'Κατηγορία 3',                 monthly: 370.63 },
  { id: 'cat4',    label: 'Κατηγορία 4',                 monthly: 443.47 },
  { id: 'cat5',    label: 'Κατηγορία 5',                 monthly: 529.45 },
  { id: 'cat6',    label: 'Κατηγορία 6',                 monthly: 685.87 },
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

interface FreelancerModel {
  annualRevenue: number;
  annualExpenses: number;
  efkaCategory: string;
  yearsActive: string;
  ageGroup: AgeGroup;
  children: string;
}

import { CommonModule } from '@angular/common';
import { EuroPipe } from '../../pipes/euro.pipe';
import { CalcExplanationComponent } from '../calc-explanation/calc-explanation.component';
import { ExportRowComponent } from '../export-row/export-row.component';
import { LawFooterComponent } from '../law-footer/law-footer.component';
@Component({
  selector: 'app-freelancer-calculator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormField, EuroPipe, CalcExplanationComponent, ExportRowComponent, LawFooterComponent],
  templateUrl: './freelancer-calculator.component.html',
  styleUrl: './freelancer-calculator.component.scss',
})
export class FreelancerCalculatorComponent {
  formModel = signal<FreelancerModel>({
    annualRevenue: 30000,
    annualExpenses: 5000,
    efkaCategory: 'cat1',
    yearsActive: 'over3',
    ageGroup: 'over30',
    children: '0',
  });
  formFields = form(this.formModel);

  private readonly destroyRef = inject(DestroyRef);
  private readonly salaryService = inject(SalaryCalculatorService);
  private readonly persistence = inject(CalculatorPersistenceService);

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

  constructor() {
    this.persistence.initSignalForm(this.formModel, STORAGE_KEY, this.destroyRef);
  }

  result = computed<FreelancerResult>(() => {
    const fv = this.formModel();
    const revenue = Math.max(0, fv.annualRevenue || 0);
    const expenses = Math.max(0, fv.annualExpenses || 0);
    const catId = fv.efkaCategory || 'cat1';
    const yearsActive = fv.yearsActive || 'over3';
    const ageGroup: AgeGroup = fv.ageGroup || 'over30';
    const children = Math.min(Math.max(0, Number(fv.children) || 0), 6);

    const cat = EFKA_CATEGORIES.find(c => c.id === catId) || EFKA_CATEGORIES[1];
    const advanceRate = yearsActive === 'under3' ? 0.275 : 0.55;

    const calc = this.calcForCategory(cat, revenue, expenses, children, advanceRate, ageGroup);

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

  selectedEfkaMonthly = computed(() => {
    const catId = this.formModel().efkaCategory;
    const cat = EFKA_CATEGORIES.find(c => c.id === catId);
    return cat ? cat.monthly : 0;
  });

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
    const taxDiscount = 0;
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
