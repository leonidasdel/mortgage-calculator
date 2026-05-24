import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import {
  KINSHIP_LABELS,
  KinshipCategory,
  TransferType,
} from '../../constants/inheritance-gift.constants';
import {
  InheritanceGiftCalculatorService,
  InheritanceGiftParams,
} from '../../services/inheritance-gift-calculator.service';
import { CalculatorPersistenceService } from '../../services/calculator-persistence.service';

const STORAGE_KEY = 'inheritanceGiftCalcState';

interface InheritanceGiftModel {
  transferType: string;
  category: string;
  value: number;
  hasDisability: boolean;
  applyPrimaryResidenceInfo: boolean;
}

import { DecimalPipe } from '@angular/common';
import { EuroPipe } from '../../pipes/euro.pipe';
import { CalcExplanationComponent } from '../calc-explanation/calc-explanation.component';
import { ExportRowComponent } from '../export-row/export-row.component';
import { LawFooterComponent } from '../law-footer/law-footer.component';
@Component({
  selector: 'app-inheritance-gift-calculator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe,
    FormField,
    EuroPipe,
    CalcExplanationComponent,
    ExportRowComponent,
    LawFooterComponent,
  ],
  templateUrl: './inheritance-gift-calculator.component.html',
  styleUrl: './inheritance-gift-calculator.component.scss',
})
export class InheritanceGiftCalculatorComponent {
  formModel = signal<InheritanceGiftModel>({
    transferType: 'inheritance',
    category: 'A',
    value: 250000,
    hasDisability: false,
    applyPrimaryResidenceInfo: false,
  });
  formFields = form(this.formModel);

  private readonly destroyRef = inject(DestroyRef);
  private readonly calc = inject(InheritanceGiftCalculatorService);
  private readonly persistence = inject(CalculatorPersistenceService);

  readonly kinshipLabels = KINSHIP_LABELS;

  readonly explanationSteps = [
    'Επιλέγετε τύπο μεταβίβασης: κληρονομιά, δωρεά ή χρηματική δωρεά.',
    'Η κατηγορία συγγένειας (Α/Β/Γ) καθορίζει τους φορολογικούς συντελεστές.',
    'Για δωρεές κατηγορίας Α ισχύει αφορολόγητο όριο €800.000.',
    'Η αναπηρία 67%+ μειώνει τον φόρο κατά 10%.',
  ];

  readonly explanationFormula = 'Φόρος = κλιμακωτός υπολογισμός επί φορολογητέας βάσης';

  constructor() {
    this.persistence.initSignalForm(this.formModel, STORAGE_KEY, this.destroyRef);
  }

  result = computed(() => this.calc.calculate(this.buildParams()));

  shareSummary = computed(() => {
    const r = this.result();
    return `Φόρος κληρονομιάς Salaries.gr: φόρος ${r.taxDue.toFixed(2)}€, συντελεστής ${r.effectiveRate.toFixed(1)}%`;
  });

  transferTypeLabel = computed(() => {
    const t = this.formModel().transferType ?? 'inheritance';
    const labels: Record<TransferType, string> = {
      inheritance: 'Κληρονομιά',
      gift: 'Δωρεά περιουσιακού στοιχείου',
      monetary: 'Χρηματική δωρεά',
    };
    return labels[t as TransferType] ?? labels.inheritance;
  });

  setTransferType(type: string): void {
    this.formModel.update((m) => ({ ...m, transferType: type }));
  }

  setCategory(category: string): void {
    this.formModel.update((m) => ({ ...m, category }));
  }

  private buildParams(): InheritanceGiftParams {
    const fv = this.formModel();
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
