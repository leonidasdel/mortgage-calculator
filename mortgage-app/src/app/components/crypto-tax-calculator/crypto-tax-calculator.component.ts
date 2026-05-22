import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { CRYPTO_GAINS_TAX_RATE, CRYPTO_LOSS_CARRY_YEARS } from '../../constants/crypto-tax.constants';
import {
  CryptoTaxCalculatorService,
  CryptoTaxParams,
} from '../../services/crypto-tax-calculator.service';
import { CalculatorPersistenceService } from '../../services/calculator-persistence.service';

const STORAGE_KEY = 'cryptoTaxCalcState';

interface CryptoTaxModel {
  mode: string;
  totalProceeds: number;
  totalCost: number;
  carriedLoss: number;
  isProfessional: boolean;
}

import { DecimalPipe } from '@angular/common';
import { EuroPipe } from '../../pipes/euro.pipe';
import { CalcExplanationComponent } from '../calc-explanation/calc-explanation.component';
import { ExportRowComponent } from '../export-row/export-row.component';
import { LawFooterComponent } from '../law-footer/law-footer.component';
@Component({
  selector: 'app-crypto-tax-calculator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, FormField, EuroPipe, CalcExplanationComponent, ExportRowComponent, LawFooterComponent],
  templateUrl: './crypto-tax-calculator.component.html',
  styleUrl: './crypto-tax-calculator.component.scss',
})
export class CryptoTaxCalculatorComponent {
  formModel = signal<CryptoTaxModel>({
    mode: 'simple',
    totalProceeds: 10000,
    totalCost: 6000,
    carriedLoss: 0,
    isProfessional: false,
  });
  formFields = form(this.formModel);

  private readonly destroyRef = inject(DestroyRef);
  private readonly calc = inject(CryptoTaxCalculatorService);
  private readonly persistence = inject(CalculatorPersistenceService);

  readonly taxRatePct = CRYPTO_GAINS_TAX_RATE * 100;
  readonly lossCarryYears = CRYPTO_LOSS_CARRY_YEARS;

  readonly explanationSteps = [
    'Καθαρό κέρδος = έσοδα πώλησης − κόστος απόκτησης.',
    'Αφαιρούνται ζημίες που μεταφέρονται από προηγούμενα έτη.',
    'Στα κέρδη ιδιωτών εφαρμόζεται συντελεστής 15%.',
    'Ζημία του έτους μεταφέρεται για συμψηφισμό τα επόμενα 5 έτη.',
  ];

  readonly explanationFormula = 'Φόρος = max(0, κέρδος − ζημίες) × 15%';

  constructor() {
    this.persistence.initSignalForm(this.formModel, STORAGE_KEY, this.destroyRef);
  }

  result = computed(() => this.calc.calculate(this.buildParams()));

  shareSummary = computed(() => {
    const r = this.result();
    return `Φόρος κρυπτονομισμάτων Salaries.gr: ${r.taxDue.toFixed(2)}€ φόρος επί κέρδους ${r.taxableGain.toFixed(2)}€`;
  });

  setMode(mode: string): void {
    this.formModel.update(m => ({ ...m, mode }));
  }

  private buildParams(): CryptoTaxParams {
    const fv = this.formModel();
    return {
      mode: fv.mode === 'fifo' ? 'fifo' : 'simple',
      totalProceeds: this.toAmount(fv.totalProceeds),
      totalCost: this.toAmount(fv.totalCost),
      carriedLoss: this.toAmount(fv.carriedLoss),
      acquisitions: [],
      disposals: [],
      isProfessional: !!fv.isProfessional,
    };
  }

  private toAmount(value: unknown): number {
    return Math.max(0, Number(value) || 0);
  }
}
