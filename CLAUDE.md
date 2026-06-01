# Salaries.gr — App Knowledge Base for Claude

Auto-loaded by Claude Code. Keep this up to date when architecture changes.

---

## App Overview

**Name:** Salaries.gr
**Purpose:** Greek financial calculator suite (mortgages, salaries, savings, taxes, real estate)
**Stack:** Angular 22 (RC) · Standalone components · OnPush · Zoneless · SCSS · Canvas charts · PWA · SSG (prerender)
**Backend:** None — pure client-side calculations
**Locale:** Greek throughout (labels, tax law, EFKA, date formats)

---

## Project Structure

```
mortgage-app/
  src/
    main.ts                  ← bootstrapApplication(App, appConfig)
    main.server.ts           ← SSR bootstrap (BootstrapContext)
    server.ts                ← Express handler (outputMode static; not required for static deploy)
    app/
      app.config.ts          ← provideZonelessChangeDetection, router, service worker
      app.config.server.ts   ← provideServerRendering(withRoutes(...))
      app.routes.server.ts   ← RenderMode.Prerender per calculator route
      app.routes.ts          ← root routes + lazy loadChildren
      app.ts                 ← root shell (OnPush, standalone)
      routes/
        loans.routes.ts      ← lazy loadComponent: mortgage, consumer-loan
        income.routes.ts     ← salary, bonuses, freelancer, severance, unused-leave
        property.routes.ts   ← rent-vs-buy, rental-tax, property-purchase
        savings-tax.routes.ts ← interest, savings, inheritance, crypto, car-cost
      components/            ← One subfolder per standalone component
      services/              ← calculator + platform services
      constants/             ← law metadata, tax brackets, per-calculator law tables
      models/                ← mortgage, salary models
      calculators/           ← pure calculation modules (framework-agnostic)
        mortgage/mortgage.calc.ts
        interest/interest.calc.ts
        salary/salary.calc.ts  ← SalaryCalculatorEngine + exported functions
      pipes/                 ← euro | dateDDMMYYYY (standalone)
      utils/                 ← calculator-form.util.ts, store-adapters.ts, create-calculator-store.ts, chart-canvas.util.ts
      directives/            ← chart-resize.directive.ts (standalone)
    styles.scss              ← Global CSS variables + all utility classes
```

---

## Routes & Navigation

| Path | Component |
|------|-----------|
| `/` | HomeComponent |
| `/mortgage` | MortgageCalculatorComponent |
| `/salary` | SalaryCalculatorComponent |
| `/interest` | InterestCalculatorComponent |
| `/consumer-loan` | ConsumerLoanCalculatorComponent |
| `/rent-vs-buy` | RentVsBuyCalculatorComponent |
| `/rental-tax` | RentalTaxCalculatorComponent |
| `/freelancer` | FreelancerCalculatorComponent |
| `/savings` | SavingsCalculatorComponent |
| `/unused-leave` | UnusedLeaveCalculatorComponent |
| `/inheritance-gift` | InheritanceGiftCalculatorComponent |
| `/crypto-tax` | CryptoTaxCalculatorComponent |
| `/car-cost` | CarCostCalculatorComponent |
| `/severance` | SeveranceCalculatorComponent |
| `/annual-bonus` | AnnualBonusCalculatorComponent |
| `/holiday-bonus` | HolidayBonusCalculatorComponent |
| `/property-purchase` | PropertyPurchaseCalculatorComponent |

**Nav sidebar groups** (NavComponent):
- Δάνεια → mortgage, consumer-loan
- Εισόδημα → salary, freelancer, unused-leave, severance, annual-bonus, holiday-bonus
- Αποταμίευση → interest, savings
- Ακίνητα → rent-vs-buy, rental-tax, property-purchase
- Φόροι & Άλλα → inheritance-gift, crypto-tax, car-cost

**Shared platform components:** `law-footer`, `export-row`, `calc-explanation`, `compare-panel`

---

## Calculator architecture

**Pure math** lives in `calculators/<domain>/*.calc.ts` (mortgage, interest, salary, property-purchase, car-cost, inheritance-gift, crypto-tax, savings, rental-tax, severance, unused-leave, freelancer, rent-vs-buy, consumer-loan). `@Injectable` `*-calculator.service.ts` files are thin facades. Portable re-exports: `calculators/index.ts`.

**Tier A (simple routes)** — `injectCalculatorForm()` from `utils/calculator-form.util.ts` + optional `*.schema.ts` + optional `profileBindings` from `constants/profile-field-maps.ts`. Used by: interest, property-purchase, car-cost, crypto-tax, inheritance-gift, annual-bonus, holiday-bonus, severance, unused-leave, freelancer.

**Tier B (complex routes)** — route-scoped NgRx `signalStore` (`providers: [XStore]` on component), `form(store.formModelWritable, schema)` + `withCalculatorPersistence` / custom persistence:

| Store | Route | Notes |
|-------|-------|--------|
| `MortgageStore` | `/mortgage` | `withMortgagePersistence` (`inputs` + `erList` in localStorage) |
| `ConsumerLoanStore` | `/consumer-loan` | `withCalculatorPersistence` |
| `SalaryStore` | `/salary` | Custom persistence (`inputs` + `annualBonus`, etc.) |
| `RentVsBuyStore` | `/rent-vs-buy` | Compare panel computeds |
| `SavingsStore` | `/savings` | Chart stays in component; computeds in store |
| `RentalTaxStore` | `/rental-tax` | Custom `onLoad` merge for income mode |

**Store ↔ signal forms:** `createStoreWritable` + `withCalculatorPersistence` in `utils/store-adapters.ts` (deprecated when [NgRx delegated-signal RFC #5121](https://github.com/ngrx/platform/issues/5121) ships). Imperative handlers that read-then-write should use `store.formModelWritable()`, not `store.formModel()`, then `TestBed.flushEffects()` in tests before asserting computeds.

**Experimental:** `createCalculatorStore()` in `utils/create-calculator-store.ts` — prefer explicit `signalStore` for full TypeScript inference.

---

## Services

### MortgageCalculatorService
`services/mortgage-calculator.service.ts` · `providedIn: 'root'` · delegates to `calculators/mortgage/mortgage.calc.ts`
- `pmt(principal, annualRate, months): number`
- `buildSchedule(params: LoanParams, erList: EarlyRepayment[]): AmortizationRow[]` — full amortization with grace period, fixed/variable rate switch, early repayments (reducePmt / reduceDur modes), N.128 levy (0.12% annual)
- `computeSummary(schedule, baseSchedule, params): MortgageSummary`
- `computeErMonthsSaved(params, erList): ErMonthsSavedMap`

### SalaryCalculatorService
`services/salary-calculator.service.ts` · `providedIn: 'root'` · delegates to `calculators/salary/salary.calc.ts` (`SalaryCalculatorEngine`)
- `calculate(params: SalaryParams): SalaryResult` — EFKA, progressive tax (age-dependent brackets), 14-month model, Christmas/Easter/Leave bonuses, annual bonus (marginal tax), salary change mid-year pro-rata
- `buildSalaryParams(formSlice, extras?)` — shared form → `SalaryParams` mapping for salary / annual-bonus routes
- `calculateWithPartialBonuses(params)` — holiday-bonus route with partial-month scaling
- `reverseCalculate(netTarget, params): number` — binary search gross from net

**Key constants:**
```
EFKA_EMPLOYEE_RATE    = 0.1337  (13.37%)
EFKA_EMPLOYER_RATE    = 0.2179  (21.79%)
MAX_INSURABLE_EARNINGS = 7572.62 €/month (2025) · 7761.94 €/month (2026) via `getMaxInsurableEarnings(year)`
MONTHS_PER_YEAR       = 14  (12 regular + Christmas + Easter/Leave)
LEAVE_SURCHARGE_RATE  = 0.04166
```

**Tax brackets:** imported from `constants/tax-brackets.constants.ts` (2025/2026 tables).

### Other calculator services
All delegate to `calculators/<domain>/*.calc.ts` (same pattern as mortgage/interest/salary).

### UserProfileStore
`stores/user-profile.store.ts` · `providedIn: 'root'` · `localStorage` key `userFinancialProfile`. Salary (primary) and property-purchase write overlapping fields; `initSignalForm` / store init applies `profileBindings` with fill-missing-only semantics (no overwrite of per-calculator saves or URL share keys). Nav shows hint when profile exists.

### ShareStateService
`services/share-state.service.ts` — serialize/deserialize form state ↔ URL query params via `URLSearchParams`; `loadShareStateIntoForm()` for URL restore; copy share link + WhatsApp.

### SeoService
`services/seo.service.ts` — per-route Title/Meta/OG + FAQ JSON-LD via `SEO_CONFIG`; wired on router `NavigationEnd` in `app.ts`.

### CalculatorPersistenceService
`services/calculator-persistence.service.ts` · `providedIn: 'root'`
- `saveFormState` / `loadFormState` — generic localStorage for all calculators
- `initSignalForm(model, key, destroyRef, options?)` — load localStorage → URL override → optional `profileBindings` merge → auto-save via effect

### PersistenceService (mortgage)
`services/persistence.service.ts` — **deprecated**; prefer `MortgageStore` + `withMortgagePersistence`. Thin wrapper kept for legacy tests.

### ExportService
`services/export.service.ts`
- `exportAmortizationCSV(schedule)` — mortgage amortization CSV
- `exportCSV(rows, filename)` — generic CSV
- `printPage()` / `printElement(id)` — browser print
- `exportPayslipPdf(lines, title)` — salary δελτίο αποδοχών
- `copySummary(text)` — clipboard + toast

### Constants (`constants/`)
- `law-metadata.ts` — per-route law/disclaimer for `app-law-footer`
- `tax-brackets.constants.ts`, `payroll.constants.ts`, `inheritance-gift.constants.ts`, `crypto-tax.constants.ts`, `circulation-fee.constants.ts`

**Public SEO:** `public/sitemap.xml`, `public/robots.txt`

---

## Models

### `models/mortgage.models.ts`
- `LoanParams` — loanAmount, loanYears, fixedYears, fixedRate, euribor, bankMargin, gracePeriod, erMode
- `AmortizationRow` — month, date, payment, principal, interest, n128, earlyAmt, balance, isGrace, isFixed, rate
- `EarlyRepayment` — id, month, amount
- `BulkErParams` — startMonth, amount, every, count
- `MortgageSummary` — fixedPayment, variablePayment, totals, interestSaved, monthsSaved
- `ErMonthsSavedMap` — `Record<number, number>`

### `models/salary.models.ts`
- `AgeGroup` — `'under25' | '26to30' | 'over30'`
- `SalaryParams` — grossMonthly, year, ageGroup, children, ftePercent?, annualBonus?, salaryChange?
- `SalaryChange` — effectiveMonth, previousGross
- `SalaryResult` — monthly net, annual totals (with/without bonus), bonuses, employer cost, tax breakdown
  - `annualGrossBase` / `annualNetBase` — without bonus
  - `annualGross` / `annualNet` — includes bonus if present
  - `bonusResult?: AnnualBonusResult`
- `AnnualBonusResult` — grossBonus, efkaEmployee, efkaEmployer, tax, net
- `BonusBreakdown` — grossBase, leaveSurcharge, grossTotal, efka, tax, net (for Christmas/Easter/Leave)
- `MonthlyBreakdown` — before/after snapshot for salary-change mode
- `TaxBracketResult` — from, to, rate, taxableAmount, tax

---

## Pipes

| Pipe | Usage | Example |
|------|-------|---------|
| `euro` | `{{ value \| euro }}` | `1234.56` → `€1,234.56` |
| `dateDDMMYYYY` | `{{ date \| dateDDMMYYYY }}` | `Date` → `22/03/2026` |

Both are **standalone pipes** — import `EuroPipe` / `DateDDMMYYYYPipe` directly in each component that uses them.

---

## Angular Patterns

```typescript
// Bootstrap (main.ts)
bootstrapApplication(App, appConfig);

// app.config.ts — zoneless + router + PWA
export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding()),
    provideServiceWorker('ngsw-worker.js', { enabled: !isDevMode(), … }),
  ],
};

// New component pattern — standalone + OnPush, explicit imports only
@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormField, EuroPipe, ExportRowComponent], // template deps only
  templateUrl: '…',
})

// Lazy route (routes/*.routes.ts)
{ path: 'mortgage', loadComponent: () => import('…').then(m => m.MortgageCalculatorComponent) }

// Tier A: injectCalculatorForm + schema + profileBindings
interface MyModel { loanAmount: number; /* never use undefined values */ }

private readonly formSetup = injectCalculatorForm<MyModel>({
  defaultModel: { loanAmount: 100000 },
  storageKey: STORAGE_KEY,
  schema: myFormSchema, // optional — min/max, hidden, applyWhen (@experimental)
  persistence: {
    onLoad: (saved, model) => { /* optional; model is WritableSignal<MyModel> */ },
    onApplyShareState: (state, model) => model.set({ ...model(), ...state } as MyModel),
  },
});
readonly formModel = this.formSetup.formModel;
readonly formFields = this.formSetup.formFields;

result = computed(() => this.service.calculate(this.formModel()));

// Tier B: form(store.formModelWritable, myFormSchema) + linked-field effects (see below)
// Tier B + schema: rent-vs-buy, rental-tax; Tier A + schema: car-cost, interest, property-purchase

// Template bindings
// <input type="number" [formField]="formFields.loanAmount" />
// <select [formField]="formFields.year"> … </select>   // select fields: use string model values
// <app-export-row [shareState]="formModel()" … />

// Patch model (replaces form.patchValue)
this.formModel.update(m => ({ ...m, loanMonths: 48 }));

// Router subscriptions — use takeUntilDestroyed()
private router = inject(Router);
this.router.events.pipe(
  filter((e): e is NavigationEnd => e instanceof NavigationEnd),
  takeUntilDestroyed(),
).subscribe(…);
```

- **All components are standalone + OnPush** — no NgModules; add new routes in the appropriate `routes/*.routes.ts` file with `loadComponent`
- **No barrel files** — each component lists only its template deps in `imports`, imported from direct source paths (duplicate `CommonModule` across files is intentional)
- **Child form slices** — pass `FieldTree` slices from parent (e.g. `app-loan-form [formFields]="formFields"`, `app-salary-change-block [formFields]="$any(formFields)"`)
- **`[formField]` inputs** — do not set `min`/`max`/`step` on the same element (use schema validation or accept unconstrained input)

### Signal form schemas & linked fields (v22 pilot)

**Angular 22** (`@angular/*` 22.0.0-rc.x). `npm install` uses `legacy-peer-deps` (`.npmrc`) because `@ngrx/signals@21` peers Angular 21. CLI build requires **Node ≥24.15.0** (or 22.22.3+ / 26+).

**Schemas** (`form(writable, schemaFn)` — still `@experimental`):

```typescript
import { hidden, SchemaPathTree } from '@angular/forms/signals';
import { minZero, pctRange } from '../utils/calculator-schemas';

export function myFormSchema(path: SchemaPathTree<MyModel>): void {
  minZero(path.amount);
  pctRange(path.ratePct);
  hidden(path.annualField, ({ valueOf }) => valueOf(path.mode) === 'monthly');
}
```

Reusable validators: `utils/calculator-schemas/common-validators.ts`.

**Bi-directional sync** (pct ↔ amount, annual ↔ monthly) is **not** declarative in the schema API — use `effect()` helpers in `utils/calculator-schemas/setup-linked-fields.util.ts`:

- `setupPctAmountPairLinks(formModel, destroyRef, { propertyPrice, mode, pct, amount })` — single pair (generic)
- `setupAnnualMonthlyLinks(formModel, destroyRef, { annual, monthly }, () => incomeMode)` — rental-tax
- Rent-vs-buy uses dedicated `rent-vs-buy-linked-fields.ts` (two pct/amount pairs on one price)

Use **`applyWhen` / `hidden`** for conditional visibility; use **effects** for cross-field writes. After imperative `formModelWritable.update`, call **`TestBed.flushEffects()`** in unit tests before asserting store computeds.

**Pilot routes:** `/rent-vs-buy`, `/rental-tax`, `/car-cost` — schemas + linked fields; templates bind `[formField]` only (no redundant `(input)` sync handlers).
- **`date-select`** — still a CVA; bind via `[(ngModel)]` + `FormsModule` or manual `(ngModelChange)` against `formModel`
- **Salary extras** — `annualBonus`, `hasSalaryChange`, `inputMode`, etc. stay as separate signals alongside `formModel`
- Canvas charts use `effect()` for redraws triggered by signal changes
- `@HostListener('window:resize')` or `ChartResizeDirective` for responsive chart sizing
- `@ViewChild` + `ElementRef` for canvas access

### `@defer` (below-fold heavy UI)

Heavy below-fold sections use viewport deferral with card skeleton placeholders:

```html
@defer (on viewport) {
  <div class="card">… chart or table …</div>
} @placeholder {
  <div class="card">
    <div class="card-header">
      <div class="card-header-icon skeleton-block"></div>
      <h2 class="skeleton-block skeleton-title"></h2>
    </div>
    <div class="card-body">
      <div class="skeleton-block skeleton-chart"></div>
    </div>
  </div>
}
```

**Currently deferred:** mortgage amortization chart/table, savings chart canvas, consumer-loan chart/table.

Global skeleton utilities live in `styles.scss` (`.skeleton-block`, `.skeleton-chart`, `.skeleton-table`).

### SSG / prerender

- `@angular/ssr` with `outputMode: "static"` in `angular.json` — build emits prerendered HTML per route under `dist/mortgage-app/browser/`
- Route list in `app.routes.server.ts` — all 17 calculator paths use `RenderMode.Prerender`; client `**` redirect uses `RenderMode.Client`
- Compatible with zoneless + PWA (`serviceWorker` in production build config)
- `ng build` logs `Prerendered N static routes` on success
- Express 5 catch-all in `server.ts` must use `/{*path}` syntax (not bare `*`)

---

## E2E tests (Playwright)

**Location:** `mortgage-app/e2e/` · config: `playwright.config.ts`

| Command | What it does |
|---------|----------------|
| `npm run e2e` | Playwright against `ng serve :4200` (reuses running server locally) |
| `npm run e2e:ui` | Playwright UI mode |
| `npm run e2e:ci` | `ng build` + Playwright against `http-server dist/mortgage-app/browser` on `:4200` |

Browsers install to `node_modules` via `PLAYWRIGHT_BROWSERS_PATH=0` (set in npm scripts). First run: `npx playwright install chromium`.

**CI:** GitHub Actions `deploy.yml` runs unit tests → build → `playwright install --with-deps chromium` → E2E against `dist/mortgage-app/browser/` (SPA fallback `-s`). Uploads `playwright-report/` artifact on failure.

**Helpers:** `e2e/helpers/routes.ts`, `e2e/helpers/test-ids.ts` (central registry), `e2e/helpers/golden.ts` (cent-exact expected values), `e2e/helpers/money.ts` (`formatEuro`), `e2e/helpers/calculator.page.ts` (`fill`, `get`, `hero`, `scrollToDeferred`).

**Locator policy:** Use **`data-testid` only** in E2E specs — `page.getByTestId()` via registry constants. Do not use `#id`, `.class`, or CSS selectors in new specs. Keep `#id` on inputs for labels/a11y; add matching `data-testid` alongside.

**Exact money assertions:** Calculator E2E specs must assert **cent-exact** euro amounts — never regex patterns like `/€[\d,]+\.\d{2}/`, `toBeGreaterThan`, or “value changed” alone. Source expected numbers from service unit tests; store them in `e2e/helpers/golden.ts` and format with `formatEuro()` (mirrors `EuroPipe`). Use `toContainText(formatEuro(golden…))` on hero locators. Unit tests use `expect(value).toBe(cents)` or `roundEuro()` — not `toBeCloseTo(_, 0)` for user-visible money.

**TestId pattern:** `{scope}-{role}-{name}` — e.g. `mortgage-input-loanAmount`, `salary-hero-net`, `nav-link-mortgage`. See `e2e/helpers/test-ids.ts`.

**`@defer` blocks:** Charts/tables load on viewport — call `scrollToDeferred(testId)` before asserting deferred content.

**Specs (~50+ tests):** `smoke.routes.spec.ts`, `navigation.spec.ts`, `home.spec.ts`, `deferred.spec.ts`, `share-state.spec.ts`, `e2e/calculators/*.spec.ts` (golden-path per calculator).

---

## Global CSS Utilities (`styles.scss`)

**Always reuse these — never recreate them in component SCSS.**

### CSS Variables
**Semantic text:** use `var(--fg-default)`, `--fg-muted`, `--fg-positive`, `--fg-negative`, `--fg-link`, `--fg-warm` for body copy (not raw `--green` / `--g500`). Hints: global `.form-hint` / `.form-hint--warn`.

```scss
--blue, --blue-dark, --blue-light, --blue-mid
--red, --red-light
--green, --green-light
--amber-light, --amber-border
--g50 … --g900          // grayscale palette
--shadow, --shadow-md, --shadow-lg
--r                      // border-radius: 12px
--sidebar-w: 240px
```

### Layout
```
.container          max-width 1300px, centered
.grid               360px left + 1fr right (collapses at 860px)
.left-panel / .right-panel
```

### Cards
```
.card               white, border, shadow, overflow:hidden ⚠️
.card-header        flex row with icon support
.card-body          18px padding
```

### Forms
```
.form-group         14px margin-bottom
.input-wrap         position:relative wrapper
.has-pfx / .has-sfx
.pfx / .sfx         absolute-positioned prefix/suffix
.form-select        custom select with arrow
```

### Sections
```
.sec-div            border-top divider
.sec-label          11px uppercase section label
.section-title      uppercase heading with margin
```

### Info Boxes
```
.info-box.blue
.info-box.amber
.info-box.green
```

### Buttons
```
.btn-primary        blue fill
.btn-outline        white + gray border
.btn-danger         red text, light red bg
```

### Summary Grid
```
.sum-grid           2-col grid with 1px gaps
.sum-item           white cell, overflow:hidden ⚠️
.sum-lbl            11px label
.sum-val            15px bold value
.sum-val.red / .blue / .green
```

### Hero Cards
```
.hero-row           2-col grid
.hero-card          blue gradient, hover lift
.hero-lbl / .hero-val / .hero-sub
```

---

## ⚠️ Known Gotchas

1. **`overflow: hidden` on `.card` AND `.sum-item`** — `position: absolute` tooltips are clipped by both. Use inline sub-text (e.g., a `.sum-val-hint` div) instead of floating tooltips.

2. **Standalone + OnPush + zoneless** — new components must set `standalone: true` and `changeDetection: ChangeDetectionStrategy.OnPush`; app uses `provideZonelessChangeDetection()`. Do not create NgModules or barrel re-exports.

3. **Signal form `computed()`** — read `this.formModel()` directly inside `computed()`; no `toSignal(form.valueChanges)` bridge needed.

4. **Canvas charts** — `@ViewChild` canvas may be `undefined` on first render; charts use `effect()` and check for canvas availability before drawing.

5. **State loading** — `initSignalForm` merges saved/URL state into the model signal; use `onLoad` / `onApplyShareState` callbacks for custom restore logic (salary, mortgage, rent-vs-buy, rental-tax).

6. **Salary 14-month model** — annual totals include 14 payment units (12 months + Christmas + Easter/Leave). Monthly tax = annual tax / 14, not / 12.

7. **`@defer (on viewport)`** — deferred blocks (charts/tables) are absent from initial HTML; prerendered pages still ship fast shell + summary; heavy UI loads when scrolled into view.

8. **Prerender + browser APIs** — nav dark-mode, localStorage persistence, and SW update run client-side only; prerender must not depend on them for initial render.

---

## localStorage Keys

| Key | Component/Service | Persisted data |
|-----|-------------------|----------------|
| `mortgageCalcState` | PersistenceService | inputs, erList, erCounter |
| `salaryCalcState` | SalaryCalculatorComponent | inputs, annualBonus, inputMode, hasSalaryChange, salaryChangeMonth, previousGross |
| `interestCalcState` | InterestCalculatorComponent | form values |
| `consumerLoanCalcState` | ConsumerLoanCalculatorComponent | form values |
| `rentVsBuyCalcState` | RentVsBuyCalculatorComponent | form values |
| `savingsCalcState` | SavingsCalculatorComponent | form values |
| `freelancerCalcState` | FreelancerCalculatorComponent | form values |
| `rentalTaxCalcState` | RentalTaxCalculatorComponent | form values |
| `unusedLeaveCalcState` | UnusedLeaveCalculatorComponent | form values |
| `inheritanceGiftCalcState` | InheritanceGiftCalculatorComponent | form values |
| `cryptoTaxCalcState` | CryptoTaxCalculatorComponent | form values |
| `carCostCalcState` | CarCostCalculatorComponent | form values |
| `severanceCalcState` | SeveranceCalculatorComponent | form values |
| `propertyPurchaseCalcState` | PropertyPurchaseCalculatorComponent | form values |
| `userFinancialProfile` | UserProfileStore | grossMonthly, taxYear, ageGroup, children, ftePercent, isMarried, inputMode |

**Share URLs:** URL query params override localStorage on init (via ShareStateService).

All saves/loads wrapped in `try/catch`.
