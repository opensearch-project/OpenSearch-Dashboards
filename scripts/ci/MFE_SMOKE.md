<!--
SPDX-License-Identifier: Apache-2.0
-->

# MFE Cypress smoke (`--mfe` :5602)

A **small, representative** end-to-end smoke that runs against the OpenSearch
Dashboards instance booted with `--mfe` (default `:5602`), whose UI is loaded from
Module Federation remotes. It is the lightweight functional companion to the
credential-free dual-path gate (`scripts/ci/mfe_dual_path.sh`).

It is **not** the full FTR/Cypress suite — that is far too heavy for a PR gate.
By design this is a SMOKE subset: it proves the MFE path is wired end-to-end, not
that every app behaves correctly.

## What it proves

Three Cypress tests in `cypress/integration/mfe/mfe_smoke.spec.js` load core apps
through the MFE path and assert each one **mounts**:

| App          | Page            | App-specific marker asserted (proves the remote mounted) |
|--------------|-----------------|----------------------------------------------------------|
| home (shell) | `/app/home`     | `toggleNavButton` / `homeApp`                            |
| **discover** | `/app/discover` | `discoverNewButton` / `globalQueryBar` / `docTable` …    |
| **dashboards** | `/app/dashboards` | `newItemButton` / `dashboardLandingPage` …            |

For each app the smoke asserts: (1) the global-nav **chrome** is present (the MFE
shell booted), (2) the body rendered **substantial content** with no
`Application Not Found` / `server is not ready` error, and (3) an **app-specific**
marker exists. Those markers only render once the app's own remote bundle has been
fetched, evaluated, and mounted — the end-to-end MFE proof for **≥ 2 core apps**
(discover + dashboards).

It is **origin-agnostic** (it asserts apps mount, not where the bytes came from);
the byte-origin proof — that `remoteEntry.js` is served by the origin — lives in
`harness/verify_mfe_render.js`. The smoke is **credential-free**: it only drives a
browser, making zero `ada`/AWS/CDN calls.

## Run it locally

The `--mfe` instance must already be up on `:5602`. Bring it up with either:

```bash
# Local dev harness (loads remotes from whatever the registry points at):
bash packages/osd-mfe/dev/run_osd_mfe.sh

# …or the exact CI topology (builds remotes, points the registry at the LOCAL
# origin :8080, launches :5602) and leaves it running:
KEEP_SERVERS=1 bash OpenSearch-Dashboards/scripts/ci/mfe_dual_path.sh
```

Then run the smoke:

```bash
bash OpenSearch-Dashboards/scripts/ci/mfe_smoke.sh
```

The runner uses Cypress' **bundled Electron** (headless), so no system Chrome is
required. It exits non-zero if any test fails or if `:5602` is unreachable
(fails closed). Useful overrides:

```bash
MFE_OSD_URL=http://localhost:5602 bash scripts/ci/mfe_smoke.sh   # explicit target
OSD_DIR=/path/to/OpenSearch-Dashboards bash <abs>/scripts/ci/mfe_smoke.sh
MFE_SMOKE_SPEC=cypress/integration/mfe/mfe_smoke.spec.js bash scripts/ci/mfe_smoke.sh
```

Path-portable: `OSD_DIR` / `WORKSPACE_DIR` / `MFE_OSD_URL` are derived from the
script's own location (with explicit-env override), so it runs from any checkout
and any current working directory.

## How it slots into CI

It is wired as its own step in the additive workflow
`.github/workflows/mfe_dual_path.yml` (it does **not** modify any of the existing
workflows):

1. **Run dual-path gate (credential-free)** — invoked with `KEEP_SERVERS=1`, so
   the gate leaves `:8080` (origin) + `:5602` (`--mfe`) running after the
   credential-free PATH A / PATH B verifiers pass.
2. **Re-point registry at local origin** — the gate's teardown restores the
   registry file to its pre-run bytes, so this step points it back at the LOCAL
   origin `:8080`, keeping the smoke fully credential-free and offline (no
   CloudFront). The mock origin serves the registry per request, so no relaunch is
   needed.
3. **MFE Cypress smoke** — `bash scripts/ci/mfe_smoke.sh` against the running
   `:5602`.
4. **Teardown** (`if: always()`) — stops `:5602` + `:8080`.

On failure the workflow uploads `cypress/screenshots/` and `cypress/videos/`
(alongside the harness logs/shots) as diagnostics.

> **Note (real CI-green is confirmed on push):** like the rest of the gate, the
> harness (`env.sh`, `verify_*.js`) and the registry data file live at the
> workspace root, outside this repo, and must be vendored/provisioned alongside
> the checkout for the workflow to run green on a bare runner. The smoke itself is
> validated locally against a live `:5602`.
