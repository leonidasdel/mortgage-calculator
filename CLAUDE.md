# Salaries.gr — App Knowledge Base for Claude

Auto-loaded by Claude Code. Keep this up to date when architecture changes.

---

## App Overview

**Name:** Salaries.gr
**Purpose:** Greek financial calculator suite (mortgages, salaries, savings, taxes, real estate)
**Stack:** Angular 16+ · NgModule (NOT standalone) · SCSS · Canvas charts · PWA
**Backend:** None — pure client-side calculations
**Locale:** Greek throughout (labels, tax law, EFKA, date formats)

---

## Project Structure

```
mortgage-app/
  src/
    app/
      app-module.ts          ← NgModule declaration + RouterModule.forRoot() (routes live here)
      app.ts                 ← Root component (sidebar layout + router-outlet)
      components/            ← One subfolder per component
      services/              ← 4 injectable services
      models/                ← 2 model files (mortgage, salary)
      pipes/                 ← euro | dateDDMMYYYY
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

**Nav sidebar groups** (NavComponent):
- Δάνεια → mortgage, consumer-loan
- Εισόδημα → salary, freelancer, unused-leave
- Αποταμίευση → interest, savings
- Ακίνητα → rent-vs-buy, rental-tax

---

## Services

### MortgageCalculatorService
`services/mortgage-calculator.service.ts` · `providedIn: 'root'`
- `pmt(principal, annualRate, months): number`
- `buildSchedule(params: LoanParams, erList: EarlyRepayment[]): AmortizationRow[]` — full amortization with grace period, fixed/variable rate switch, early repayments (reducePmt / reduceDur modes), N.128 levy (0.12% annual)
- `computeSummary(schedule, baseSchedule, params): MortgageSummary`
- `computeErMonthsSaved(params, erList): ErMonthsSavedMap`

### SalaryCalculatorService
`services/salary-calculator.service.ts` · `providedIn: 'root'`
- `calculate(params: SalaryParams): SalaryResult` — EFKA, progressive tax (age-dependent brackets), 14-month model, Christmas/Easter/Leave bonuses, annual bonus (marginal tax), salary change mid-year pro-rata
- `reverseCalculate(netTarget, params): number` — binary search gross from net

**Key constants:**
```
EFKA_EMPLOYEE_RATE    = 0.1337  (13.37%)
EFKA_EMPLOYER_RATE    = 0.2179  (21.79%)
MAX_INSURABLE_EARNINGS = 7572.62 €/month
MONTHS_PER_YEAR       = 14  (12 regular + Christmas + Easter/Leave)
LEAVE_SURCHARGE_RATE  = 0.04166
```

**Tax brackets:** 6 brackets (0-10k, 10-20k, 20-30k, 30-40k, 40-60k, 60k+) × 3 age groups (under25 / 26to30 / over30) × 7 children columns (0–6+). Brackets defined in `TAX_RATES` constant in the service.

### PersistenceService
`services/persistence.service.ts` · mortgage-only
- `saveState(inputs, erList, erCounter)` → `localStorage['mortgageCalcState']`
- `loadState(): PersistedState | null`

### ExportService
`services/export.service.ts`
- `exportCSV(schedule: AmortizationRow[])` → downloads `amortization_schedule.csv` (UTF-8 BOM, Greek headers)

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
- `SalaryParams` — grossMonthly, year, ageGroup, children, annualBonus?, salaryChange?
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

Both declared in `app-module.ts`.

---

## Angular Patterns

```typescript
// Reactive form → signal pipeline (used in every calculator)
formValues = toSignal(this.form.valueChanges, { initialValue: this.form.value });
result = computed(() => {
  this.formValues(); // registers dependency
  return this.service.calculate(this.form.value);
});

// Additional signals for non-form state
annualBonus = signal(0);
hasSalaryChange = signal(false);

// State persistence pattern (ngOnInit)
ngOnInit() {
  this.loadState();           // patchValue({ emitEvent: false })
  this.syncFromGross();
  this.form.valueChanges.subscribe(() => this.saveState());
}
```

- All components use **NgModule** (not standalone) — new components must be added to `declarations` in `app-module.ts`; pipes too
- Canvas charts use `effect()` for redraws triggered by signal changes
- `@HostListener('window:resize')` for responsive chart sizing
- `@ViewChild` + `ElementRef` for canvas access

---

## Global CSS Utilities (`styles.scss`)

**Always reuse these — never recreate them in component SCSS.**

### CSS Variables
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

2. **NgModule, not standalone** — every new component and pipe must be declared in `app-module.ts`. Do not use `standalone: true`.

3. **`toSignal()` + `computed()` dependency** — must call `this.formValues()` inside the `computed()` body to register the reactive form as a dependency; otherwise the computed won't re-run on form changes.

4. **Canvas charts** — `@ViewChild` canvas may be `undefined` on first render; charts use `effect()` and check for canvas availability before drawing.

5. **State loading** — always use `patchValue({ emitEvent: false })` when loading from localStorage to avoid triggering save loops.

6. **Salary 14-month model** — annual totals include 14 payment units (12 months + Christmas + Easter/Leave). Monthly tax = annual tax / 14, not / 12.

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

All saves/loads wrapped in `try/catch`.
