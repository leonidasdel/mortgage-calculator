import { ComponentHarness } from '@angular/cdk/testing';

/** Test harness for app-loan-form. */
export class LoanFormHarness extends ComponentHarness {
  static hostSelector = 'app-loan-form';

  async setLoanAmount(value: number): Promise<void> {
    const input = await this.locatorFor('[data-testid="mortgage-input-loanAmount"]')();
    await input.clear();
    await input.sendKeys(String(value));
  }

  async getLoanAmount(): Promise<string> {
    const input = await this.locatorFor('[data-testid="mortgage-input-loanAmount"]')();
    return input.getProperty('value');
  }

  async setLoanYears(value: number): Promise<void> {
    const input = await this.locatorFor('[data-testid="mortgage-input-loanYears"]')();
    await input.clear();
    await input.sendKeys(String(value));
  }
}
