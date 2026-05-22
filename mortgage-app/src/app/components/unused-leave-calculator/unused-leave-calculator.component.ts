import { Component, computed, DestroyRef, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { CalculatorPersistenceService } from '../../services/calculator-persistence.service';
import {
  LeaveResult,
  UnusedLeaveCalculatorService,
} from '../../services/unused-leave-calculator.service';

const STORAGE_KEY = 'unusedLeaveCalcState';

@Component({
  selector: 'app-unused-leave-calculator',
  standalone: false,
  templateUrl: './unused-leave-calculator.component.html',
  styleUrl: './unused-leave-calculator.component.scss',
})
export class UnusedLeaveCalculatorComponent implements OnInit {
  form: FormGroup;
  private formValues;
  private destroyRef = inject(DestroyRef);

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
    private calc: UnusedLeaveCalculatorService,
    private persistence: CalculatorPersistenceService,
  ) {
    this.form = this.fb.group({
      salaryType:           ['monthly'],
      grossMonthly:         [1500],
      dailyWage:            [69.23],
      workWeek:             ['5day'],
      unusedDays:           [10],
      includeHolidayBonus:  [true],
      situation:            ['termination'],
      taxYear:              ['2025'],
      ageGroup:             ['over30'],
      children:             [0],
      useCustomAnnualIncome: [false],
      customAnnualGross:    [21000],
    });
    this.formValues = toSignal(this.form.valueChanges, { initialValue: this.form.value });
  }

  ngOnInit(): void {
    this.persistence.initCalculatorForm(this.form, STORAGE_KEY, this.destroyRef);
  }

  result = computed<LeaveResult>(() => {
    this.formValues();
    return this.calc.calculate(this.form.value);
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
}
