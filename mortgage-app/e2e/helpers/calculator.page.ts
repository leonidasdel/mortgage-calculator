import { Locator, Page } from '@playwright/test';

export class CalculatorPage {
  constructor(readonly page: Page) {}

  async fillNumber(id: string, value: string | number): Promise<void> {
    const input = this.page.locator(`#${id}`);
    await input.fill(String(value));
    await input.blur();
  }

  firstHeroVal(): Locator {
    return this.page.locator('.hero-val').first();
  }

  heroValIn(containerId: string): Locator {
    return this.page.locator(`#${containerId} .hero-val`).first();
  }

  async scrollToDefer(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  }
}
