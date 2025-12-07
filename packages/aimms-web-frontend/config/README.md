# Configuration Files

This directory contains tool configuration files that have been moved from the project root for better organization.

## Files

### Chromatic (`chromatic.config.json`)
Visual regression testing configuration for Storybook.

**Usage:**
```bash
npm run chromatic              # Builds Storybook + uploads to Chromatic
npm run chromatic:prebuild     # Uses existing storybook-static/ (faster if already built)
```

**Outputs:**
- Logs: `.chromatic/build-storybook.log`
- Diagnostics: `.chromatic/diagnostics.json`
- Build: `storybook-static/` (gitignored)

**Config options:**
- `storybookConfigDir`: Points to monorepo root `.storybook/`
- `storybookBuildDir`: Uses local `storybook-static/`
- `logFile`: Organizes logs in `.chromatic/`
- `onlyChanged`: Only test changed stories (TurboSnap)

**Note:** When clicking "Run Chromatic" from Storybook UI, it auto-generates a `chromatic.config.json` in the package root. This file is gitignored and can be safely deleted.

**Docs:** https://www.chromatic.com/docs/cli

### Lighthouse (`.lighthouserc.json`)
Performance and accessibility testing configuration.
- Used by: Lighthouse CI
- Docs: https://github.com/GoogleChrome/lighthouse-ci

## Root Configuration Files

Some tools require their config files to be in the project root. These remain there:

- `.eslintrc.cjs` - ESLint (linting)
- `.prettierignore` - Prettier ignore patterns
- `tsconfig.json` - TypeScript compiler
- `vite.config.ts` - Vite build tool
- `package.json` - npm package (includes Prettier config)
- `.gitignore` - Git ignore patterns
- `vercel.json` - Vercel deployment
- `Dockerfile.dev` - Docker development
- `index.html` - Vite entry point

## Moved Configuration Files

The following config files have been moved from the project root:

- `playwright.config.ts` → `e2e/playwright.config.ts`
  - Test outputs now go to `e2e/playwright-report/` and `e2e/test-results/`
- `chromatic.config.json` → `config/chromatic.config.json`
  - Logs now go to `.chromatic/` directory
- `prettier.config.cjs` → merged into `package.json`
