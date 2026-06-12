/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/*
 * Phase 8, Story 4 — MFE SMOKE subset (Cypress) against the `--mfe` instance.
 *
 * This is a deliberately SMALL, representative end-to-end smoke that runs against
 * the OSD instance booted with `--mfe` (default :5602), whose UI is loaded from
 * Module Federation remotes (locally: served by the origin :8080; it is
 * origin-agnostic — it asserts the apps actually MOUNT, not where bytes came
 * from; the byte-origin proof lives in harness/verify_mfe_render.js). It is the
 * lightweight functional counterpart to the credential-free dual-path gate
 * (scripts/ci/mfe_dual_path.sh) and is NOT the full FTR/Cypress suite (which is
 * far too heavy for a PR gate).
 *
 * What it proves: >= 2 core apps (discover + dashboards, plus home as the shell
 * smoke) load END-TO-END through the MFE path — i.e. the global-nav chrome boots
 * from the MFE shell AND each app's own remote bundle mounts and renders its
 * app-specific UI, with no "Application Not Found" / "server is not ready" error.
 * If a remote failed to fetch/execute, the app body would not mount and these
 * assertions would fail.
 *
 * Run it against :5602 via: scripts/ci/mfe_smoke.sh  (see that script + docs).
 * Point cypress at the --mfe instance with --config baseUrl=http://localhost:5602.
 *
 * Data-independent by design: it asserts each app's chrome + a stable top-level
 * app marker that renders WITHOUT any index pattern / sample data, so it needs no
 * OpenSearch fixtures beyond a reachable cluster.
 */

// Stable, version-correct data-test-subj markers (sourced from this repo's own
// cypress utils). Each app lists a few resilient alternatives; at least one must
// render once the app's remote bundle has mounted. Using a multi-selector keeps
// the smoke robust across the classic-discover / data-explorer layouts without
// weakening the "the app actually mounted" assertion.
const CHROME = '[data-test-subj="headerGlobalNav"]';

const ERROR_STRINGS = ['Application Not Found', 'OpenSearch Dashboards server is not ready'];

// Generous waits: a cold MFE mount (remoteEntry fetch + chunk eval) is slower
// than a local-bundle mount.
const MOUNT_TIMEOUT = 90000;

/**
 * Visit an MFE app page, wait for the shell chrome to boot, assert no fatal
 * error text leaked into the body, then assert an app-specific marker rendered
 * (proving the app's own remote mounted — not just the shell).
 */
function smokeApp(appPath, appMarkerSelector, label) {
  cy.visit(appPath, { timeout: MOUNT_TIMEOUT });

  // 1. The MFE shell booted: the global-nav chrome is PRESENT in the DOM. We
  //    assert existence (not `be.visible`): the modern OSD header chrome can
  //    measure 0px height in headless layout, so visibility is an unreliable
  //    proxy. This mirrors harness/verify_mfe_render.js, which proves these same
  //    pages boot by waiting for the headerGlobalNav element's presence.
  cy.get(CHROME, { timeout: MOUNT_TIMEOUT }).should('exist');

  // 2. The app actually rendered real content (not the empty loading shell) AND
  //    no fatal shell/app error leaked into the body. The length check mirrors
  //    verify_mfe_render.js's body-length floor that distinguishes a mounted app
  //    from a stuck bootstrap shell.
  cy.get('body', { timeout: MOUNT_TIMEOUT })
    .invoke('text')
    .then((text) => {
      const normalized = text.replace(/\s+/g, ' ').trim();
      ERROR_STRINGS.forEach((err) => {
        expect(normalized, `${label}: body must not contain "${err}"`).to.not.include(err);
      });
      expect(
        normalized.length,
        `${label}: body should render substantial content`
      ).to.be.greaterThan(200);
    });

  // 3. The app's OWN remote bundle mounted and rendered its app-specific UI.
  //    These markers only exist once the app's Module Federation remote has been
  //    fetched, evaluated, and mounted — the end-to-end MFE proof for this app.
  cy.get(appMarkerSelector, { timeout: MOUNT_TIMEOUT }).should('exist');
}

describe('MFE smoke (--mfe :5602): core apps load end-to-end via Module Federation', () => {
  before(() => {
    // Suppress the first-run home welcome modal so it never overlays the apps
    // under test (mirrors dashboard_sanity_test.spec.ts).
    cy.visit('/app/home', { timeout: MOUNT_TIMEOUT });
    cy.get(CHROME, { timeout: MOUNT_TIMEOUT }).should('exist');
    cy.window().then((win) => win.localStorage.setItem('home:welcome:show', 'false'));
  });

  after(() => {
    cy.window().then((win) => win.localStorage.removeItem('home:welcome:show'));
  });

  it('home: MFE shell boots and renders the global nav', () => {
    smokeApp(
      '/app/home',
      '[data-test-subj="homeApp"], [data-test-subj="homeTab"], [data-test-subj="toggleNavButton"]',
      'home'
    );
  });

  it('discover: the discover remote mounts and renders its app UI', () => {
    smokeApp(
      '/app/discover',
      // Discover top-nav / app markers that render without an index pattern,
      // across both the classic and data-explorer discover layouts.
      [
        '[data-test-subj="discoverNewButton"]',
        '[data-test-subj="discoverOpenButton"]',
        '[data-test-subj="globalQueryBar"]',
        '[data-test-subj="discoverQueryHits"]',
        '[data-test-subj="docTable"]',
        '[data-test-subj="datasetSelectorButton"]',
        '[data-test-subj="discover-dataset-select"]',
      ].join(', '),
      'discover'
    );
  });

  it('dashboards: the dashboards remote mounts and renders its app UI', () => {
    smokeApp(
      '/app/dashboards',
      // Dashboards landing-page markers (render with zero saved dashboards).
      [
        '[data-test-subj="newItemButton"]',
        '[data-test-subj="createDashboardPromptButton"]',
        '[data-test-subj="dashboardLandingPage"]',
        '[data-test-subj="itemsInMemTable"]',
      ].join(', '),
      'dashboards'
    );
  });
});
