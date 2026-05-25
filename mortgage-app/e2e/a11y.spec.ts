import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { ROUTES } from './helpers/routes';

const A11Y_PATHS = ROUTES.map((r) => r.path);

async function assertNoSeriousViolations(
  page: import('@playwright/test').Page,
  label: string,
): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  const serious = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
  expect(serious, `${label}\n${JSON.stringify(serious, null, 2)}`).toEqual([]);
}

for (const route of A11Y_PATHS) {
  test(`axe light: no serious violations on ${route}`, async ({ page }) => {
    await page.goto(route);
    await assertNoSeriousViolations(page, `light ${route}`);
  });

  test(`axe dark: no serious violations on ${route}`, async ({ page }) => {
    await page.goto(route);
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    });
    await assertNoSeriousViolations(page, `dark ${route}`);
  });
}
