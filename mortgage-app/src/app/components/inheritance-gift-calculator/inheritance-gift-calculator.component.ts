import { Component, computed, DestroyRef, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { KINSHIP_LABELS, KinshipCategory, TransferType } from '../../constants/inheritance-gift.constants';
import {
  InheritanceGiftCalculatorService,
  InheritanceGiftParams,
} from '../../services/inheritance-gift-calculator.service';
import { CalculatorPersistenceService } from '../../services/calculator-persistence.service';

const STORAGE_KEY = 'inheritanceGiftCalcState';

@Component({
  selector: 'app-inheritance-gift-calculator',
  standalone: false,
  templateUrl: './inheritance-gift-calculator.component.html',
  styleUrl: './inheritance-gift-calculator.component.scss',
})
export class InheritanceGiftCalculatorComponent implements OnInit {
  form: FormGroup;
  private formValues;
  private destroyRef = inject(DestroyRef);

  readonly kinshipLabels = KINSHIP_LABELS;

  readonly explanationSteps = [
    'Επιλέγετε τύπο μεταβίβασης: κληρονομιά, δωρεά ή χρηματική δωρεά.',
    'Η κατηγορία συγγένειας (Α/Β/Γ) καθορίζει τους φορολογικούς συντελεστές.',
    'Για δωρεές κατηγορίας Α ισχύει αφορολόγητο όριο €800.000.',
    'Η αναπηρία 67%+ μειώνει τον φόρο κατά 10%.',
  ];

  readonly explanationFormula = 'Φόρος = κλιμακωτός υπολογισμός επί φορολογητέας βάσης';

  constructor(
    private fb: FormBuilder,
    private calc: InheritanceGiftCalculatorService,
    private persistence: CalculatorPersistenceService,
  ) {
    this.form = this.fb.group({
      transferType: ['inheritance'],
      category: ['A'],
      value: [250000],
      hasDisability: [false],
      applyPrimaryResidenceInfo: [false],
    });

    this.formValues = toSignal(this.form.valueChanges, { initialValue: this.form.value });
  }

  ngOnInit(): void {
    this.persistence.initCalculatorForm(this.form, STORAGE_KEY, this.destroyRef);
  }

  result = computed(() => {
    this.formValues();
    return this.calc.calculate(this.buildParams());
  });

  shareSummary = computed(() => {
    const r = this.result();
    return `Φόρος κληρονομιάς Salaries.gr: φόρος ${r.taxDue.toFixed(2)}€, συντελεστής ${r.effectiveRate.toFixed(1)}%`;
  });

  transferTypeLabel = computed(() => {
    const t = this.formValues()?.transferType ?? 'inheritance';
    const labels: Record<TransferType, string> = {
      inheritance: 'Κληρονομιά',
      gift: 'Δωρεά περιουσιακού στοιχείου',
      monetary: 'Χρηματική δωρεά',
    };
    return labels[t as TransferType] ?? labels.inheritance;
  });

  private buildParams(): InheritanceGiftParams {
    const fv = this.form.value;
    return {
      transferType: (fv.transferType || 'inheritance') as TransferType,
      category: (fv.category || 'A') as KinshipCategory,
      value: this.toAmount(fv.value),
      hasDisability: !!fv.hasDisability,
      applyPrimaryResidenceInfo: !!fv.applyPrimaryResidenceInfo,
    };
  }

  formatBracketTo(to: number | null): string {
    return to === null ? 'Άνω' : `${to.toLocaleString('el-GR')} €`;
  }

  private toAmount(value: unknown): number {
    return Math.max(0, Number(value) || 0);
  }
}
