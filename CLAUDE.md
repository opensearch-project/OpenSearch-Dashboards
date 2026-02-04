# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OpenSearch Dashboards is a browser-based data visualization and exploration tool for OpenSearch. It is a large-scale Node.js + React monorepo with a plugin-based architecture. The project was forked from Kibana and adapted for the OpenSearch ecosystem.

## Common Commands

```bash
# Bootstrap (install deps + build internal packages) — run after pulling changes
yarn osd bootstrap

# Start dev server (requires a running OpenSearch instance on localhost:9200)
yarn start

# Run all unit tests
yarn test:jest

# Run a single test file
yarn test:jest path/to/file.test.ts

# Run integration tests
yarn test:jest_integration

# Lint (ESLint + Stylelint)
yarn lint

# Lint with autofix
node scripts/eslint --fix

# Type check
yarn typecheck

# Run Cypress functional tests (no security plugin)
yarn cypress:run-without-security

# Run a specific Cypress test
yarn cypress:run-without-security --spec path/to/test.ts

# Clean build artifacts and node_modules
yarn osd clean

# Accept Core API signature changes after modifying Core public/server APIs
yarn docs:acceptApiChanges

# Start dev server with example plugins loaded
yarn start --run-examples

# Start OpenSearch snapshot for local development
yarn opensearch snapshot

# Pre-commit checks (lint + type check)
node scripts/precommit_hook.js --fix
```

## Architecture

### Monorepo Structure

- **`src/core/`** — Core platform providing HTTP, plugin system, saved objects, logging, config, and both public (browser) and server APIs. Plugins depend on Core's `setup` and `start` contracts.
- **`src/plugins/`** — Built-in plugins (~67). Each plugin has `public/` (React UI) and/or `server/` (Hapi routes) directories.
- **`packages/`** — Internal workspace packages (prefixed `osd-`): optimizer, dev-utils, plugin-helpers, i18n, test utilities, Monaco editor integration, etc.
- **`examples/`** — Example plugins demonstrating plugin development patterns. Load with `yarn start --run-examples`.
- **`test/`** — Test infrastructure: `functional/` (Selenium FTR), `api_integration/`, `plugin_functional/`.
- **`cypress/`** — Cypress end-to-end tests (preferred over Selenium for new tests).

### Plugin System

Every plugin has an `opensearch_dashboards.json` manifest declaring its `id`, `requiredPlugins`, `optionalPlugins`, and whether it has `server`/`ui` sides.

Plugin lifecycle:
1. **`setup(core, deps)`** — Registration phase. Register routes, saved object types, UI applications, and services here.
2. **`start(core, deps)`** — Running phase. Start listeners or expose runtime APIs.
3. **`stop()`** — Cleanup.

Standard plugin file structure:
```
my_plugin/
├── opensearch_dashboards.json    # Manifest
├── public/
│   ├── index.ts                  # Exports plugin initializer + types
│   ├── plugin.ts                 # Plugin class (setup/start/stop)
│   ├── applications/             # UI apps (lazy-loaded via dynamic import)
│   └── services/                 # Client-side services
└── server/
    ├── index.ts                  # Exports plugin + config
    ├── plugin.ts                 # Server plugin class
    ├── routes/                   # HTTP API routes (must start with /api/)
    ├── saved_objects/            # Saved object type definitions + migrations
    └── services/                 # Server-side services
```

Use `core.getStartServices()` in application mount handlers rather than storing `start` references as class fields.

### Key Technologies

- **Frontend:** React 18, React Router 5, Redux, RxJS, EUI/OUI component library
- **Backend:** Node.js 22, Hapi.js
- **Build:** Webpack/Rspack, Babel, `@osd/optimizer`
- **Package manager:** Yarn 1 (workspaces)

## Code Conventions

- **Filenames:** Always `snake_case` (e.g., `index_pattern.ts`, not `IndexPattern.ts`).
- **Language:** TypeScript for all new code. Avoid `any` (use `unknown` or generics). Avoid non-null assertions (`!.`) and `@ts-ignore`.
- **Exports:** Use named exports, not default exports.
- **Modules:** ES2015 import/export syntax. Only import top-level module APIs, never reach into internal paths.
- **Strings:** Single quotes, 100-char print width, ES5 trailing commas (enforced by Prettier).
- **API routes:** Must start with `/api/`, use `snake_case` for paths, params, and body fields.
- **HTML attributes:** `id` and `data-test-subj` values should be camelCase.
- **SASS:** Import `.scss` files at the top of the component file. Use a 3-letter prefix on class names for scoping (e.g., `plgComponent`).
- **React:** Prefer functional components. Name action props as `on<Subject><Change>`.
- **Saved objects types:** Define in `server/saved_objects/`, one file per type, with migration functions keyed by version.

## Testing Conventions

- **Unit tests** (`*.test.ts`): Jest. Aim for 80%+ coverage (enforced by Codecov). Use react-testing-library for components, not enzyme snapshots.
- **Integration tests** (`**/integration_tests/**/*.test.ts`): Jest, run with `yarn test:jest_integration`.
- **Functional tests**: Cypress (preferred). Selenium is legacy — do not write new Selenium tests.
- **Cypress best practices:** Use `data-test-subj` attributes for selectors. Use `cy.intercept()` instead of hard-coded delays. Always use UTC time.

## Core API Changes

When modifying `src/core/public/` or `src/core/server/` APIs, run `yarn docs:acceptApiChanges` to regenerate API review files, then commit the updated `.api.md` files.

## Pull Request Requirements

- All commits must include a DCO sign-off: `Signed-off-by: Name <email>` (use `git commit -s`).
- PRs must include appropriate test coverage and pass CI checks.
- Do not write new Selenium/FTR tests; use Cypress instead.