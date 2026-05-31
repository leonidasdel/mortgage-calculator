import { computed } from '@angular/core';
import { signalStore, withComputed, withHooks, withState } from '@ngrx/signals';
import { AmortizationRow } from '../../models/mortgage.models';
import {
  calculateConsumerLoanSummary,
  ConsumerLoanSummary,
} from '../../calculators/consumer-loan/consumer-loan.calc';
import { withCalculatorPersistence } from '../../utils/store-adapters';

const STORAGE_KEY = 'consumerLoanCalcState';

export interface ConsumerLoanModel {
  loanAmount: number;
  interestRate: number;
  loanMonths: number;
  loanFees: number;
}

export type { ConsumerLoanSummary };

const DEFAULT_MODEL: ConsumerLoanModel = {
  loanAmount: 10000,
  interestRate: 13,
  loanMonths: 48,
  loanFees: 0,
};

export const ConsumerLoanStore = signalStore(
  withState({
    formModel: DEFAULT_MODEL,
  }),
  withCalculatorPersistence<ConsumerLoanModel>(STORAGE_KEY),
  withComputed((store) => {
    const schedule = computed<AmortizationRow[]>(() => {
      const { loanAmount, interestRate, loanMonths } = store.formModel();
      const months = Math.max(1, Math.round(loanMonths));
      return calculateConsumerLoanSummary({
        loanAmount,
        interestRate,
        loanMonths: months,
        loanFees: store.formModel().loanFees,
      }).schedule;
    });

    const summary = computed<ConsumerLoanSummary>(() => {
      const fv = store.formModel();
      const months = Math.max(1, Math.round(fv.loanMonths));
      return calculateConsumerLoanSummary({
        loanAmount: fv.loanAmount,
        interestRate: fv.interestRate,
        loanMonths: months,
        loanFees: fv.loanFees,
      }).summary;
    });

    const shareSummary = computed(() => {
      const s = summary();
      return `Καταναλωτικό δάνειο Salaries.gr: δόση ${s.monthlyPayment.toFixed(2)}€/μήνα, σύνολο ${s.grandTotal.toFixed(2)}€`;
    });

    return {
      schedule,
      summary,
      shareSummary,
    };
  }),
  withHooks({
    onInit(store) {
      store.initCalculatorState();
    },
  }),
);
