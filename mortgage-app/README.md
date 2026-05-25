# Salaries.gr (mortgage-app)

Angular application for [https://www.salaries.gr](https://www.salaries.gr).

## Commands

| Command | Purpose |
|---------|---------|
| `npm start` | Dev server on :4200 |
| `npm test` | Unit tests |
| `npm run lint` | ESLint |
| `npm run build` | Production SSG build → `dist/mortgage-app/browser` |
| `npm run e2e` | Playwright (reuses dev server locally) |
| `npm run e2e:ci` | Build + Playwright against static dist |

## Law / tax updates

1. Update brackets in `src/app/constants/`.
2. Set `lastVerified` in `src/app/constants/law-metadata.ts`.
3. Add golden values in unit tests and `e2e/helpers/golden.ts` if outputs change.
4. Record the release in the repo root [`CHANGELOG.md`](../CHANGELOG.md).

## Optional production config

Set these when building or in your host environment if you use them:

| Variable | Purpose |
|----------|---------|
| `NG_APP_SENTRY_DSN` | Client error reporting (Sentry) |
| `NG_APP_PLAUSIBLE_DOMAIN` | Privacy-friendly analytics (e.g. `salaries.gr`) |

When unset, both are no-ops.
