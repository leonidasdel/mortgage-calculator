import { Locator, Page } from '@playwright/test';

export class CalculatorPage {
  constructor(readonly page: Page) {}

  get(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  async fill(testId: string, value: string | number): Promise<void> {
    const input = this.get(testId);
    await input.fill(String(value));
    await input.blur();
  }

  hero(testId: string): Locator {
    return this.get(testId);
  }

  async scrollToDeferred(testId: string): Promise<void> {
    for (let i = 0; i < 20; i++) {
      if (await this.get(testId).count()) break;
      await this.page.mouse.wheel(0, 600);
      await this.page.waitForTimeout(150);
    }
    await this.get(testId).waitFor({ state: 'visible', timeout: 15_000 });
    await this.get(testId).scrollIntoViewIfNeeded();
  }
}
