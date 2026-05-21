import { Component, computed, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { CRYPTO_GAINS_TAX_RATE, CRYPTO_LOSS_CARRY_YEARS } from '../../constants/crypto-tax.constants';
import {
  CryptoTaxCalculatorService,
  CryptoTaxParams,
} from '../../services/crypto-tax-calculator.service';
import { ShareStateService } from '../../services/share-state.service';

const STORAGE_KEY = 'cryptoTaxCalcState';

@Component({
  selector: 'app-crypto-tax-calculator',
  standalone: false,
  templateUrl: './crypto-tax-calculator.component.html',
  styleUrl: './crypto-tax-calculator.component.scss',
})
export class CryptoTaxCalculatorComponent implements OnInit {
  form: FormGroup;
  private formValues;

  readonly taxRatePct = CRYPTO_GAINS_TAX_RATE * 100;
  readonly lossCarryYears = CRYPTO_LOSS_CARRY_YEARS;

  readonly explanationSteps = [
    'Καθαρό κέρδος = έσοδα πώλησης − κόστος απόκτησης.',
    'Αφαιρούνται ζημίες που μεταφέρονται από προηγούμενα έτη.',
    'Στα κέρδη ιδιωτών εφαρμόζεται συντελεστής 15%.',
    'Ζημία του έτους μεταφέρεται για συμψηφισμό τα επόμενα 5 έτη.',
  ];

  readonly explanationFormula = 'Φόρος = max(0, κέρδος − ζημίες) × 15%';

  constructor(
    private fb: FormBuilder,
    private calc: CryptoTaxCalculatorService,
    private shareSvc: ShareStateService,
  ) {
    this.form = this.fb.group({
      mode: ['simple'],
      totalProceeds: [10000],
      totalCost: [6000],
      carriedLoss: [0],
      isProfessional: [false],
    });

    this.formValues = toSignal(this.form.valueChanges, { initialValue: this.form.value });
  }

  ngOnInit(): void {
    this.loadState();
    const qp = this.shareSvc.getQueryParams();
    if (Object.keys(qp).length) {
      this.form.patchValue(this.shareSvc.deserializeState(qp), { emitEvent: false });
    }
    this.form.valueChanges.subscribe(() => this.saveState());
  }

  result = computed(() => {
    this.formValues();
    return this.calc.calculate(this.buildParams());
  });

  shareSummary = computed(() => {
    const r = this.result();
    return `Φόρος κρυπτονομισμάτων Salaries.gr: ${r.taxDue.toFixed(2)}€ φόρος επί κέρδους ${r.taxableGain.toFixed(2)}€`;
  });

  private buildParams(): CryptoTaxParams {
    const fv = this.form.value;
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
