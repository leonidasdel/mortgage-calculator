import { Component, computed, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  OvertimeCalculatorService,
  OvertimeParams,
  WorkSchedule,
} from '../../services/overtime-calculator.service';
import { ShareStateService } from '../../services/share-state.service';

const STORAGE_KEY = 'overtimeCalcState';

@Component({
  selector: 'app-overtime-calculator',
  standalone: false,
  templateUrl: './overtime-calculator.component.html',
  styleUrl: './overtime-calculator.component.scss',
})
export class OvertimeCalculatorComponent implements OnInit {
  form: FormGroup;
  private formValues;

  readonly explanationSteps = [
    'Ωρομίσθιο = μικτός μηνιαίος ÷ (εβδομαδιαίες ώρες × 52 ÷ 12).',
    'Οι πρώτες 120 ώρες υπερωρίας/έτος αμείβονται με προσαύξηση +40%.',
    'Οι επόμενες ώρες (έως 150/έτος) με προσαύξηση +60%.',
    'Η 6η μέρα (έως 8 ώρες/εβδομάδα) με προσαύξηση +40% επί του ωρομισθίου.',
  ];

  readonly explanationFormula =
    'Επιπλέον μικτά = (ώρες×40% × ωρομίσθιο×1,40) + (ώρες×60% × ωρομίσθιο×1,60) + 6η μέρα';

  constructor(
    private fb: FormBuilder,
    private calc: OvertimeCalculatorService,
    private shareSvc: ShareStateService,
  ) {
    this.form = this.fb.group({
      grossMonthly: [1500],
      schedule: ['penthimero'],
      overtimeHoursYear: [120],
      sixthDayHours: [0],
      includeSixthDay: [false],
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

  result = computed(() => {
    this.formValues();
    return this.calc.calculate(this.buildParams());
  });

  shareSummary = computed(() => {
    const r = this.result();
    return `Υπερωρίες Salaries.gr: ωρομίσθιο ${r.hourlyWage.toFixed(2)}€, επιπλέον μικτά ${r.totalExtraGross.toFixed(2)}€/έτος`;
  });

  print(): void {
    window.print();
  }

  private buildParams(): OvertimeParams {
    const fv = this.form.value;
    return {
      grossMonthly: this.toAmount(fv.grossMonthly),
      schedule: (fv.schedule || 'penthimero') as WorkSchedule,
      overtimeHoursYear: this.toAmount(fv.overtimeHoursYear),
      sixthDayHours: this.toAmount(fv.sixthDayHours),
      includeSixthDay: !!fv.includeSixthDay,
    };
  }

  private toAmount(value: unknown): number {
    return Math.max(0, Number(value) || 0);
  }

  private saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.form.value));
    } catch { /* storage unavailable */ }
  }

  private loadState(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const state = JSON.parse(raw);
      if (state) this.form.patchValue(state, { emitEvent: false });
    } catch { /* ignore invalid storage */ }
  }
}
