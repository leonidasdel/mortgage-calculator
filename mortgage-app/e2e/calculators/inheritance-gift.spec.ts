import { test, expect } from '@playwright/test';
import { CalculatorPage } from '../helpers/calculator.page';
import { InheritanceGift } from '../helpers/test-ids';

test.describe('Inheritance & gift calculator', () => {
  test('shows zero tax for category A gift within exemption', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await page.goto('/inheritance-gift');

    await calc.get(InheritanceGift.inputTransferType).selectOption('gift');
    await calc.get(InheritanceGift.inputCategory).selectOption('A');
    await calc.fill(InheritanceGift.inputValue, 100_000);

    await expect(calc.hero(InheritanceGift.heroTaxDue)).toContainText('€0.00', { timeout: 5000 });
  });
});
