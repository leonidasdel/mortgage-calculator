import { test, expect } from '@playwright/test';
import { CalculatorPage } from '../helpers/calculator.page';
import { golden } from '../helpers/golden';
import { formatEuro } from '../helpers/money';
import { CryptoTax } from '../helpers/test-ids';

test.describe('Crypto tax calculator', () => {
  test('calculates 15% tax on 5000 taxable gain', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await page.goto('/crypto-tax');

    await calc.fill(CryptoTax.inputTotalProceeds, 15_000);
    await calc.fill(CryptoTax.inputTotalCost, 10_000);
    await calc.fill(CryptoTax.inputCarriedLoss, 0);

    await expect(calc.hero(CryptoTax.heroTaxDue)).toContainText(
      formatEuro(golden.cryptoTax.simple5kGain.taxDue),
      { timeout: 5000 },
    );
  });
});
