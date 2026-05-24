import { LoanFormHarness } from './loan-form.harness';
import { DateSelectHarness } from './date-select.harness';

describe('Component harnesses', () => {
  it('LoanFormHarness should target app-loan-form', () => {
    expect(LoanFormHarness.hostSelector).toBe('app-loan-form');
  });

  it('DateSelectHarness should target app-date-select', () => {
    expect(DateSelectHarness.hostSelector).toBe('app-date-select');
  });
});
