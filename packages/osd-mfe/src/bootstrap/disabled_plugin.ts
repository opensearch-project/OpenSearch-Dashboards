/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/**
 * VISIBLE graceful-degradation UX (Phase 14, Story 2) — enrich Phase 4's silent
 * `createDisabledPluginModule` placeholder with REASON metadata and a
 * user-facing surface, WITHOUT replacing the silent-disable mechanism.
 *
 * THE LOCKED INVARIANT this module preserves (Phase 4): a single failed remote
 * does NOT block core boot or other plugins. The disabled placeholder still
 * satisfies `plugin_reader.read()`'s contract (a `.plugin` function whose
 * instance has `setup`/`start`/`stop`); we simply extend `setup()` to register
 * a hidden DEGRADED APP STUB so that direct navigation to `/app/<id>` shows a
 * friendly status component instead of OSD's default 404. The plugin's own
 * lifecycle is still inert (no peer registrations, no nav entry).
 *
 * Two surfaces compose this story (both mfe-gated; no-flag path unchanged):
 *
 *  1. The degraded app stub (this file) — registers an `application` with id
 *     equal to the disabled plugin id, with `navLinkStatus: hidden` so it does
 *     NOT pollute the nav bar (the user only sees it on direct navigation).
 *     Mount renders a small PURE-DOM status component naming the failed plugin
 *     and the human-readable reason. Pure DOM (no React / EUI) for the same
 *     reason `compat_block_page` and `chunk_error_surface` are pure DOM: a
 *     degraded plugin may be involved in a shared-singleton mismatch, and the
 *     surface MUST work regardless of app state.
 *
 *  2. The dev Inspector panel (see ./inspector.tsx) gains a "Disabled plugins"
 *     section listing every {id, errorClass, humanReason} when any are
 *     disabled. Wired by the bootstrap when it collects records here.
 *
 * The reason taxonomy (`errorClass`) is the SAME one Phase 14 Story 1's
 * telemetry uses — see ./telemetry.ts. The `humanReason` mapping below is the
 * single source of truth for what an end-user (and the inspector / verifier)
 * sees per failure mode.
 */

import { TelemetryErrorClass } from './telemetry';
import type { PluginPublicModule } from './types';

/**
 * Persisted record for a plugin that the bootstrap disabled. Carried through
 * `bootstrapMfe()` and handed to {@link createDisabledPluginModuleWithReason}
 * (for the runtime degraded app stub) and {@link MountInspectorOptions.disabled}
 * (for the dev Inspector panel section).
 *
 * Field semantics:
 *  - `id`: matches the disabled plugin id (the `plugin/<id>/public` key the
 *    `__osdBundles__` shim registers).
 *  - `version`: the registry/manifest-resolved version label of the rejected
 *    artifact. May be `''` for the registry-trust skip path (every plugin is
 *    refused but no specific artifact failed).
 *  - `errorClass`: the locked Phase 14 taxonomy member.
 *  - `humanReason`: the {@link humanReasonFor} mapping for `errorClass`. Stored
 *    on the record so callers don't need to re-derive it; equality with the
 *    mapping is enforced by `createDisabledPluginRecord`.
 */
export interface DisabledPluginRecord {
  id: string;
  version: string;
  errorClass: TelemetryErrorClass;
  humanReason: string;
}

/**
 * The locked human-reason mapping. EXHAUSTIVE over {@link TelemetryErrorClass}
 * — `humanReasonFor` is total at the type level so adding a new member is a
 * compile error here, never a silent fallthrough. The strings are intentionally
 * SHORT and end-user-readable: they appear inline in the Inspector panel and
 * inside the degraded app stub, both visible to the developer/operator (and,
 * in the stub case, to the user). Keep them stable — `verify_phase14.js`
 * cases E + F assert exact values.
 */
const HUMAN_REASON: { readonly [K in TelemetryErrorClass]: string } = {
  'sri-mismatch': 'integrity check failed',
  'compat-reject': 'incompatible with this OSD version',
  network: 'failed to load',
  'mf-runtime-error': 'plugin runtime error',
  unknown: 'unknown error',
};

/**
 * Map a Phase 14 telemetry `errorClass` to the user-facing one-liner shown in
 * the degraded app stub + the dev Inspector panel. EXHAUSTIVE by the type
 * system: an unhandled future class would fail the index lookup, so the
 * compile-time check enforces the contract.
 */
export function humanReasonFor(errorClass: TelemetryErrorClass): string {
  return HUMAN_REASON[errorClass];
}

/**
 * Build a {@link DisabledPluginRecord} for the given failure source. Single
 * factory ensures `humanReason` is always {@link humanReasonFor}(errorClass) —
 * callers cannot drift the two apart.
 */
export function createDisabledPluginRecord(
  id: string,
  version: string,
  errorClass: TelemetryErrorClass
): DisabledPluginRecord {
  return {
    id,
    version,
    errorClass,
    humanReason: humanReasonFor(errorClass),
  };
}

/** test_subj on the rendered degraded-app status root. Stable for verifiers. */
export const DEGRADED_APP_TEST_SUBJ = 'mfeDegradedApp';

/** Stable class name on the rendered status root for any host stylesheet. */
export const DEGRADED_APP_CLASS = 'osdMfeDegradedApp';

/**
 * Render the small status component that replaces OSD's default 404 when the
 * user navigates directly to a disabled plugin's app route. PURE DOM (no React
 * / EUI imports) so the surface works regardless of shared-singleton state —
 * mirroring the same defense-in-depth choice {@link renderCompatBlockPage} and
 * {@link renderChunkErrorSurface} make.
 *
 * The element is taken from the host's mount params (`{ element }`), so the
 * caller (the degraded app stub's `mount`) controls its lifetime. Nothing here
 * touches `document` directly — easy to test against a detached DOM node.
 *
 * Markup is intentionally minimal:
 *
 *   <div data-test-subj="mfeDegradedApp" class="osdMfeDegradedApp" role="alert">
 *     <h2>This feature is currently unavailable</h2>
 *     <p>{humanReason}</p>
 *     <p>plugin: <code>{id}</code> (errorClass: <code>{errorClass}</code>)</p>
 *   </div>
 *
 * The `role="alert"` is recoverable a11y so screen readers announce the
 * change-of-state on navigation; the explicit `data-test-subj` lets
 * verify_phase14.js case E grep the rendered DOM by attribute.
 *
 * @param element host-supplied mount target (must be empty when called)
 * @param record  the record built by the bootstrap for this disabled plugin
 */
export function renderDegradedAppContent(element: HTMLElement, record: DisabledPluginRecord): void {
  const doc = element.ownerDocument || document;

  const root = doc.createElement('div');
  root.setAttribute('data-test-subj', DEGRADED_APP_TEST_SUBJ);
  root.setAttribute('role', 'alert');
  root.className = DEGRADED_APP_CLASS;

  const heading = doc.createElement('h2');
  heading.textContent = 'This feature is currently unavailable';
  root.appendChild(heading);

  const reason = doc.createElement('p');
  reason.setAttribute('data-test-subj', `${DEGRADED_APP_TEST_SUBJ}-reason`);
  reason.textContent = record.humanReason;
  root.appendChild(reason);

  const meta = doc.createElement('p');
  meta.setAttribute('data-test-subj', `${DEGRADED_APP_TEST_SUBJ}-meta`);
  // textContent + appended <code> children — building child nodes (not innerHTML)
  // means the plugin id / errorClass strings are rendered as text, never
  // interpreted as markup. Belt-and-suspenders: id + errorClass come from the
  // host-controlled registry, not user input, but pure-DOM appending costs
  // nothing extra.
  const idLabel = doc.createTextNode('plugin: ');
  const idCode = doc.createElement('code');
  idCode.textContent = record.id;
  const sep = doc.createTextNode(' (errorClass: ');
  const ecCode = doc.createElement('code');
  ecCode.textContent = record.errorClass;
  const close = doc.createTextNode(')');
  meta.appendChild(idLabel);
  meta.appendChild(idCode);
  meta.appendChild(sep);
  meta.appendChild(ecCode);
  meta.appendChild(close);
  root.appendChild(meta);

  element.appendChild(root);
}

/**
 * The minimal subset of OSD's `CoreSetup.application` we touch. Structurally
 * typed so this module does NOT have to depend on `@osd/core` (the bootstrap
 * package intentionally has no `src/core/...` import — it stays at the MFE
 * layer). The shape mirrors the public {@link App} contract enough that a
 * real core accepts our payload and a non-core (test) double can stub it.
 */
interface MinimalApplicationSetup {
  register: (app: {
    id: string;
    title: string;
    /**
     * `AppNavLinkStatus` (3 = hidden). We pass the numeric value directly so
     * we do not import the OSD enum from `src/core/public/application/types.ts`.
     * The contract is documented inline here and asserted by test.
     */
    navLinkStatus?: number;
    appRoute?: string;
    mount: (params: { element: HTMLElement }) => void | (() => void) | Promise<void | (() => void)>;
  }) => void;
}

/**
 * The minimal `CoreSetup` shape the disabled placeholder reads. Everything is
 * optional so the module gracefully no-ops if invoked under a future core
 * surface that no longer carries `application.register` (defense — Phase 4
 * invariant: the placeholder must NEVER block boot, even if the surrounding
 * core surface drifts).
 */
interface MinimalCoreSetup {
  application?: MinimalApplicationSetup;
}

/**
 * `AppNavLinkStatus.hidden` (see core/public/application/types.ts). Inlined as a
 * numeric literal so this module avoids importing from `src/core/`. Asserted to
 * match the enum value by `disabled_plugin.test.ts`.
 */
const APP_NAV_LINK_STATUS_HIDDEN = 3;

/**
 * Build the disabled-plugin placeholder module for the given record. The result
 * is shape-compatible with Phase 4's {@link createDisabledPluginModule} (so the
 * `__osdBundles__` shim still resolves a `.plugin` function whose instance has
 * `setup`/`start`/`stop`), but `setup()` ALSO registers a hidden degraded app
 * stub at the disabled plugin's id. Direct navigation to `/app/<id>` then hits
 * that stub's `mount` and renders {@link renderDegradedAppContent} — the user
 * sees a friendly status component instead of OSD's default "app not found".
 *
 * Defensive choices, in order of priority:
 *
 *  - Phase 4 INVARIANT: NEVER throw out of setup/start/stop. The whole body of
 *    `setup()` is wrapped in try/catch; if `core.application.register` is
 *    absent, faulty, or rejects our payload, we silently fall through to the
 *    inert no-op. A failed remote must not break the rest of the app, ever.
 *
 *  - `navLinkStatus: hidden` (3) — keep the disabled plugin OUT of the side
 *    nav. The user only sees the degraded surface when they navigate directly
 *    to `/app/<id>` (Story 2 spec: "NOT a banner, NOT a nav-bar element").
 *
 *  - `mount` returns a cleanup function that detaches our DOM children when
 *    the user navigates away — the contract `application.register` documents.
 *    Wrapped in try/catch so a transient detach error never escalates.
 *
 * @param record the captured-at-disable-site reason metadata
 */
export function createDisabledPluginModuleWithReason(
  record: DisabledPluginRecord
): PluginPublicModule {
  return {
    plugin: () => ({
      setup: (core: unknown) => {
        try {
          // Narrow `core` defensively. `core` arrives unknown because the MFE
          // bootstrap does not depend on `@osd/core` types; we bridge with a
          // structural minimal interface and only proceed if `application.register`
          // is actually a function. Older / future cores without `application` —
          // and the inert test doubles — fall through to the silent inert path.
          const c: MinimalCoreSetup = (core as MinimalCoreSetup) ?? {};
          const app = c.application;
          if (!app || typeof app.register !== 'function') {
            return {};
          }
          app.register({
            id: record.id,
            // The title appears under "Recently visited" / browser tabs only
            // (we hide the nav link). Make it descriptive so a developer
            // recognises the failure mode without opening the inspector.
            title: `${record.id} (unavailable)`,
            navLinkStatus: APP_NAV_LINK_STATUS_HIDDEN,
            mount: ({ element }) => {
              try {
                renderDegradedAppContent(element, record);
              } catch {
                // Rendering must never throw out of mount; the app surface
                // would crash. Worst case the user sees an empty page — which
                // is still better than a white-screened OSD.
              }
              return () => {
                try {
                  while (element.firstChild) element.removeChild(element.firstChild);
                } catch {
                  // unmount must also never throw out — a partial cleanup is
                  // acceptable; OSD will reuse `element` for the next app.
                }
              };
            },
          });
        } catch {
          // `register` rejected our payload (a future core may tighten the
          // schema). Silent — the placeholder still satisfies plugin_reader
          // (the .plugin instance below has setup/start/stop), so the app
          // boots without the degraded stub. Phase 4 invariant preserved.
        }
        return {};
      },
      start: () => ({}),
      stop: () => undefined,
    }),
  };
}
