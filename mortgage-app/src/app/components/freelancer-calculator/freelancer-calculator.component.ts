import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { CommonModule } from '@angular/common';
import { EuroPipe } from '../../pipes/euro.pipe';
import { CalcExplanationComponent } from '../calc-explanation/calc-explanation.component';
import { ExportRowComponent } from '../export-row/export-row.component';
import { LawFooterComponent } from '../law-footer/law-footer.component';
import { CalculatorPersistenceService } from '../../services/calculator-persistence.service';
import {
  EFKA_CATEGORIES,
  FreelancerCalculatorService,
} from '../../services/freelancer-calculator.service';
import { AgeGroup } from '../../models/salary.models';

const STORAGE_KEY = 'freelancerCalcState';

interface FreelancerModel {
  annualRevenue: number;
  annualExpenses: number;
  efkaCategory: string;
  yearsActive: string;
  ageGroup: AgeGroup;
  children: string;
}

@Component({
  selector: 'app-freelancer-calculator',
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
  private readonly calcService = inject(FreelancerCalculatorService);
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

  result = computed(() => {
    const fv = this.formModel();
    return this.calcService.calculate({
      annualRevenue: fv.annualRevenue,
      annualExpenses: fv.annualExpenses,
      efkaCategory: fv.efkaCategory,
      yearsActive: fv.yearsActive,
      ageGroup: fv.ageGroup,
      children: Math.min(Math.max(0, Number(fv.children) || 0), 6),
    });
  });

  shareSummary = computed(() => {
    const r = this.result();
    return `Ελεύθερος επαγγελματίας Salaries.gr: καθαρά ${r.netMonthly.toFixed(2)}€/μήνα (${r.netAnnual.toFixed(2)}€/έτος)`;
  });

  selectedEfkaMonthly = computed(() => {
    const cat = EFKA_CATEGORIES.find(c => c.id === this.formModel().efkaCategory);
    return cat?.monthly ?? 0;
  });

  print(): void {
    window.print();
  }
}
