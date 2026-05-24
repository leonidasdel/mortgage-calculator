import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { SalaryCalculatorService } from '../../services/salary-calculator.service';
import { CalculatorPersistenceService } from '../../services/calculator-persistence.service';
import { AgeGroup } from '../../models/salary.models';

const STORAGE_KEY = 'holidayBonusCalcState';

interface HolidayBonusModel {
  grossMonthly: number;
  year: number;
  ageGroup: AgeGroup;
  children: number;
  partialEnabled: boolean;
  christmasMonthsWorked: number;
  easterMonthsWorked: number;
}

import { CommonModule } from '@angular/common';
import { EuroPipe } from '../../pipes/euro.pipe';
import { CalcExplanationComponent } from '../calc-explanation/calc-explanation.component';
import { ExportRowComponent } from '../export-row/export-row.component';
import { LawFooterComponent } from '../law-footer/law-footer.component';
@Component({
  selector: 'app-holiday-bonus-calculator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormField, EuroPipe, CalcExplanationComponent, ExportRowComponent, LawFooterComponent],
  templateUrl: './holiday-bonus-calculator.component.html',
  styleUrl: './holiday-bonus-calculator.component.scss',
})
export class HolidayBonusCalculatorComponent {
  formModel = signal<HolidayBonusModel>({
    grossMonthly: 1500,
    year: 2026,
    ageGroup: 'over30',
    children: 0,
    partialEnabled: false,
    christmasMonthsWorked: 8,
    easterMonthsWorked: 4,
  });
  formFields = form(this.formModel);

  private readonly destroyRef = inject(DestroyRef);
  private readonly calc = inject(SalaryCalculatorService);
  private readonly persistence = inject(CalculatorPersistenceService);

  readonly explanationSteps = [
    'Δώρο Χριστουγέννων = 1 μισθός (Μάι–Δεκ) + προσαύξηση 4,166%.',
    'Δώρο Πάσχα & επίδομα αδείας = ½ μισθού (Ιαν–Απρ) + 4,166%.',
    'Κάθε δώρο υπόκειται σε ΕΦΚΑ (13,37%) και φόρο εισοδήματος.',
    'Για μερική απασχόληση: αναλογία εργάσιμων μηνών.',
  ];

  readonly explanationFormula =
    'Καθαρά = Σ(μικτά δώρων) − ΕΦΚΑ − φόρος (14μηνο μοντέλο)';

  constructor() {
    this.persistence.initSignalForm(this.formModel, STORAGE_KEY, this.destroyRef);
  }

  result = computed(() => {
    const fv = this.formModel();
    return this.calc.calculateWithPartialBonuses({
      grossMonthly: Math.max(0, +(fv.grossMonthly || 0)),
      year: fv.year || 2026,
      ageGroup: (fv.ageGroup || 'over30') as AgeGroup,
      children: Math.max(0, +(fv.children || 0)),
      partialEnabled: !!fv.partialEnabled,
      christmasMonthsWorked: fv.christmasMonthsWorked || 0,
      easterMonthsWorked: fv.easterMonthsWorked || 0,
    });
  });

  shareSummary = computed(() => {
    const r = this.result();
    return `Δώρα Salaries.gr: καθαρά ${r.totalNet.toFixed(2)}€ (Χριστούγεννα + Πάσχα + επίδομα αδείας)`;
  });

  print(): void {
    window.print();
  }
}
