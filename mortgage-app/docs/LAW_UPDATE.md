# Tax law update runbook

Use this checklist when EFKA, AADE, or other Greek rules change (typically January or when official tables are published).

## 1. Constants

- [ ] `src/app/constants/tax-brackets.constants.ts`
- [ ] `src/app/constants/payroll.constants.ts`
- [ ] Calculator-specific tables (`inheritance-gift`, `crypto-tax`, `circulation-fee`, etc.)

## 2. Metadata & SEO

- [ ] `src/app/constants/law-metadata.ts` — bump `lastVerified` per affected route
- [ ] `src/app/services/seo.service.ts` — titles/descriptions if the tax year is in copy

## 3. Tests

- [ ] Update service unit tests with cent-exact expected values
- [ ] Update `e2e/helpers/golden.ts` for user-visible amounts
- [ ] Run `npm test` and `npm run e2e:ci`

## 4. Release

- [ ] Bump `version` in `package.json`
- [ ] Add entry to repo root `CHANGELOG.md`
- [ ] Deploy via merge to `main`
