import { ComponentHarness } from '@angular/cdk/testing';

/** Test harness for app-date-select. */
export class DateSelectHarness extends ComponentHarness {
  static hostSelector = 'app-date-select';

  async getPreviewText(): Promise<string> {
    const el = await this.locatorFor('.date-select-preview')();
    return el.text();
  }
}
