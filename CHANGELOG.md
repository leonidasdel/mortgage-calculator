# Changelog

All notable changes to Salaries.gr are documented here. Tax-law updates should bump the app version in `mortgage-app/package.json` and note the affected calculators.

## [1.0.0] - 2026-05-25

### Added

- Privacy policy page (`/privacy`) with localStorage and share-URL disclosures
- Site footer links (privacy, home) on all calculator pages
- Share-link hint on export row
- Unit tests for freelancer and rental-tax calculator services
- Full-route accessibility checks (axe, light + dark) in E2E
- Client error reporting hook (optional Sentry DSN)
- Optional privacy-friendly analytics (Plausible)
- Uptime monitoring workflow and Lighthouse CI on deploy

### Changed

- Improved color contrast across forms, hints, and semantic greens
- README and domain documentation aligned with `www.salaries.gr`
- Archived legacy root `index.html` prototype

## Prior work

Earlier releases evolved the repo from a vanilla mortgage page to the multi-calculator Angular app documented in [`CLAUDE.md`](CLAUDE.md).
