# Salaries.gr

**Live site:** [https://www.salaries.gr](https://www.salaries.gr)

Greek financial calculator suite (mortgages, salaries, taxes, property) built with Angular 21. The application lives in [`mortgage-app/`](mortgage-app/).

## Development

```bash
cd mortgage-app
npm ci
npm start          # http://localhost:4200
npm test           # unit tests (Vitest)
npm run e2e:ci     # production build + Playwright E2E
```

## Deploy

Pushes to `main` run lint, tests, E2E, and deploy static output to GitHub Pages with custom domain `www.salaries.gr` (see [`mortgage-app/public/CNAME`](mortgage-app/public/CNAME)).

## Law updates

When EFKA/AADE brackets or calculator rules change, update constants under `mortgage-app/src/app/constants/`, `law-metadata.ts`, and record the change in [`CHANGELOG.md`](CHANGELOG.md).

## Legacy

The original single-page mortgage prototype is archived at [`archive/legacy-mortgage/index.html`](archive/legacy-mortgage/index.html).
