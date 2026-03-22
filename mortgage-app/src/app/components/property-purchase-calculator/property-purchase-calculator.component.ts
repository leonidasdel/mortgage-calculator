import { Component, computed, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';

const STORAGE_KEY = 'propertyPurchaseCalcState';

// Φορολογικοί συντελεστές & ποσοστά
const FMA_RATE           = 0.03;     // Φόρος Μεταβίβασης Ακινήτου 3%
const NOTARY_RATE        = 0.01;     // Συμβολαιογραφικά ~1% επί τιμήματος
const VAT_RATE           = 0.24;     // ΦΠΑ 24% επί συμβολαιογραφικών & μεσίτη
const LAND_REGISTRY_RATE = 0.00475;  // Κτηματολόγιο 0,475%
const AGENT_RATE         = 0.02;     // Αμοιβή μεσίτη 2% + ΦΠΑ
const LAWYER_RATE        = 0.005;    // Αμοιβή δικηγόρου ~0,5%
const OTHER_FIXED        = 500;      // Ενεργειακό πιστοποιητικό & τεχνικός έλεγχος

// Όρια απαλλαγής πρώτης κατοικίας (ΚΦΕ)
const FH_BASE_SINGLE  = 200_000;
const FH_BASE_MARRIED = 250_000;
const FH_PER_CHILD    = 25_000;

export interface CostItem {
  label:      string;
  amount:     number;
  note?:      string;
  isOptional: boolean;
  isExempt:   boolean;
}

export interface PropertyPurchaseResult {
  purchasePrice:        number;
  taxBase:              number;
  fmaExemption:         number;
  fmaTaxable:           number;
  fma:                  number;
  notary:               number;
  landRegistry:         number;
  agentFee:             number;
  lawyerFee:            number;
  otherFixed:           number;
  totalExtraCosts:      number;
  totalAcquisitionCost: number;
  extraCostsPct:        number;
  items:                CostItem[];
  fhThreshold:          number;
  firstHomeFullExempt:  boolean;
}

@Component({
  selector: 'app-property-purchase-calculator',
  standalone: false,
  templateUrl: './property-purchase-calculator.component.html',
  styleUrl: './property-purchase-calculator.component.scss',
})
export class PropertyPurchaseCalculatorComponent implements OnInit {
  form: FormGroup;
  private formValues;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      purchasePrice: [200000],
      aaotValue:     [200000],
      isFirstHome:   [true],
      isMarried:     [false],
      children:      [0],
      includeAgent:  [true],
      includeLawyer: [true],
    });
    this.formValues = toSignal(this.form.valueChanges, { initialValue: this.form.value });
  }

  ngOnInit(): void {
    this.loadState();
    this.form.valueChanges.subscribe(() => this.saveState());
  }

  result = computed<PropertyPurchaseResult>(() => {
    this.formValues();
    const fv = this.form.value;

    const price        = Math.max(0, +(fv.purchasePrice || 0));
    const aaot         = Math.max(0, +(fv.aaotValue || price));
    const taxBase      = Math.max(price, aaot);
    const isFirst      = !!fv.isFirstHome;
    const married      = !!fv.isMarried;
    const children     = Math.max(0, +(fv.children || 0));
    const inclAgent    = !!fv.includeAgent;
    const inclLawyer   = !!fv.includeLawyer;

    // Απαλλαγή πρώτης κατοικίας
    const fhBase      = married ? FH_BASE_MARRIED : FH_BASE_SINGLE;
    const fhThreshold = isFirst ? fhBase + children * FH_PER_CHILD : 0;
    const fmaExemption = isFirst ? Math.min(taxBase, fhThreshold) : 0;
    const fmaTaxable   = Math.max(0, taxBase - fmaExemption);
    const fma          = +(fmaTaxable * FMA_RATE).toFixed(2);

    const notary       = +(price * NOTARY_RATE * (1 + VAT_RATE)).toFixed(2);
    const landRegistry = +(price * LAND_REGISTRY_RATE).toFixed(2);
    const agentFee     = inclAgent  ? +(price * AGENT_RATE * (1 + VAT_RATE)).toFixed(2) : 0;
    const lawyerFee    = inclLawyer ? +(price * LAWYER_RATE).toFixed(2) : 0;

    const totalExtraCosts     = +(fma + notary + landRegistry + agentFee + lawyerFee + OTHER_FIXED).toFixed(2);
    const totalAcquisitionCost = +(price + totalExtraCosts).toFixed(2);
    const extraCostsPct        = price > 0 ? +((totalExtraCosts / price) * 100).toFixed(1) : 0;
    const firstHomeFullExempt  = isFirst && fmaExemption >= taxBase;

    const items: CostItem[] = [
      {
        label:      'Φόρος Μεταβίβασης Ακινήτου (ΦΜΑ) 3%',
        amount:     fma,
        note:       isFirst && fmaExemption > 0
          ? `Απαλλαγή πρώτης κατοικίας: ${fmaExemption.toLocaleString('el-GR')}€`
          : undefined,
        isOptional: false,
        isExempt:   firstHomeFullExempt,
      },
      {
        label:      'Συμβολαιογραφικά (~1% + ΦΠΑ 24%)',
        amount:     notary,
        isOptional: false,
        isExempt:   false,
      },
      {
        label:      'Κτηματολόγιο (0,475%)',
        amount:     landRegistry,
        isOptional: false,
        isExempt:   false,
      },
      ...(inclAgent ? [{
        label:      'Αμοιβή Μεσίτη (2% + ΦΠΑ 24%)',
        amount:     agentFee,
        isOptional: true,
        isExempt:   false,
      }] : []),
      ...(inclLawyer ? [{
        label:      'Αμοιβή Δικηγόρου (~0,5%)',
        amount:     lawyerFee,
        isOptional: true,
        isExempt:   false,
      }] : []),
      {
        label:      'Λοιπές Δαπάνες (ενεργειακό, τεχνικός)',
        amount:     OTHER_FIXED,
        isOptional: false,
        isExempt:   false,
      },
    ];

    return {
      purchasePrice: price,
      taxBase, fmaExemption, fmaTaxable, fma,
      notary, landRegistry, agentFee, lawyerFee,
      otherFixed: OTHER_FIXED,
      totalExtraCosts, totalAcquisitionCost, extraCostsPct,
      items, fhThreshold, firstHomeFullExempt,
    };
  });

  print(): void {
    window.print();
  }

  private saveState(): void {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.form.value)); } catch { /* ignore */ }
  }

  private loadState(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const state = JSON.parse(raw);
      if (state) this.form.patchValue(state, { emitEvent: false });
    } catch { /* ignore */ }
  }
}
