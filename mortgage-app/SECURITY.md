# Security

## Dependency audit

CI runs `npm audit --audit-level=high` on every deploy.

**Framework** (`dependencies`): pin to **21.2.14** where published (`common`, `core`, `compiler`, `forms`, `platform-browser`, `platform-server`, `router`, `service-worker`). `@angular/ssr` stays at **21.2.12** (latest on npm).

**Tooling** (`devDependencies`): **21.2.12** for `cli`, `build`, `cdk`; **21.2.14** for `compiler-cli`.

After changing versions, regenerate the lockfile:

```bash
rm -f package-lock.json && npm install
npm audit --audit-level=high
```

## Reporting issues

Open a GitHub issue for security concerns related to Salaries.gr. Do not include real salary or loan figures in reports.
