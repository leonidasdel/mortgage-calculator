import { test, expect } from '@playwright/test';
import { CalculatorPage } from '../helpers/calculator.page';
import { golden } from '../helpers/golden';
import { formatEuro } from '../helpers/money';
import { InheritanceGift } from '../helpers/test-ids';

test.describe('Inheritance & gift calculator', () => {
  test('shows zero tax for category A gift within exemption', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await page.goto('/inheritance-gift');

    await calc.get(InheritanceGift.inputTransferType).selectOption('gift');
    await calc.get(InheritanceGift.inputCategory).selectOption('A');
    await calc.fill(InheritanceGift.inputValue, 100_000);

    await expect(calc.hero(InheritanceGift.heroTaxDue)).toContainText(
      formatEuro(golden.inheritanceGift.exemptGift.taxDue),
      { timeout: 5000 },
    );
  });
});
