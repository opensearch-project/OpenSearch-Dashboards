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
 * Dev-only MFE Inspector panel (Phase 5, Story 3).
 *
 * A small React/EUI panel that lists every micro-frontend, shows where its
 * `remoteEntry` was resolved FROM (the registry/CDN vs a dev override), and
 * gives the developer an input to repoint a single plugin at a local dev server
 * (or any other URL). Applying an override persists it (query param +
 * `localStorage`) and reloads so the new URL takes effect on the next boot. See
 * docs/01-MFE-DESIGN.md §7.
 *
 * SECURITY (the crux of Phase 5): the inspector is a SOURCE of overrides, and
 * overrides let arbitrary remote code load into OSD. It is therefore mounted
 * ONLY when the non-production `mfe.allowOverride` gate is on — the bootstrap
 * (see `bootstrap_mfe.ts`) calls {@link mountInspector} exclusively inside the
 * `allowOverride` branch, so in production the panel is never rendered and the
 * override sources it writes (`localStorage` / the query param) are ignored by
 * the gated parser regardless. This module performs NO gating itself; it trusts
 * its caller to honor the gate, exactly like `override_sources.ts`.
 *
 * React, react-dom and `@elastic/eui` are resolved to the host's
 * `__osdSharedDeps__` singletons via the bootstrap bundler's `externals` (see
 * packages/osd-mfe/dev/build_bootstrap.js), so the panel reuses the SAME React the rest
 * of the app uses rather than bundling a second copy.
 */

import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import {
  EuiBadge,
  EuiButton,
  EuiButtonEmpty,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiPanel,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';

import { OVERRIDE_STORAGE_KEY } from './override_sources';
import type { DisabledPluginRecord } from './disabled_plugin';

/** The `localStorage` element id the inspector mounts itself into when no
 * explicit container is supplied. Stable so a hot-reload can find/replace it. */
export const INSPECTOR_ROOT_ID = 'osd-mfe-inspector-root';

/**
 * One row of the inspector: a plugin id, the effective `remoteEntry` URL it
 * loaded from, and whether that URL came from the registry/CDN or a dev
 * override. This is intentionally a structural SUBSET of
 * {@link import('../registry/resolve').ResolvedRemote} so the bootstrap can pass
 * its already-resolved descriptors straight through.
 */
export interface InspectorEntry {
  /** Plugin id (e.g. `data`). */
  id: string;
  /** Effective `remoteEntry.js` URL this plugin loaded from. */
  remoteEntry: string;
  /** Where `remoteEntry` came from — drives the source badge. */
  source: 'registry' | 'override';
}

/** Props for {@link MfeInspector}. The component is PURE: all side effects
 * (persist + reload) are delegated to the `onApply`/`onClear` callbacks so it is
 * trivially render-testable. */
export interface MfeInspectorProps {
  /** The MFEs to list, with their resolved source. */
  entries: InspectorEntry[];
  /** Persist an override for `id` to `url` and reload (host-provided). */
  onApply: (id: string, url: string) => void;
  /** Remove the override for `id` and reload (host-provided). */
  onClear: (id: string) => void;
  /**
   * Optional list of plugins the bootstrap DISABLED during boot (Phase 14, Story
   * 2 — `bootstrap_mfe.ts` collects these at every disable site: compat-skip,
   * registry-trust skip, per-remote load failure). When non-empty, the panel
   * renders an extra "Disabled plugins" section listing each id with its
   * `errorClass` (machine label, for the developer) and `humanReason` (the same
   * one-liner the user sees on `/app/<id>`). `undefined` or `[]` => the section
   * is suppressed entirely (no banner / placeholder noise on a healthy boot).
   */
  disabled?: DisabledPluginRecord[];
}

/** Test_subj on the "Disabled plugins" section root — verifier hook for
 * verify_phase14.js case F. Stable so a verifier can grep by attribute. */
export const DISABLED_SECTION_TEST_SUBJ = 'mfeInspectorDisabledSection';

/**
 * Render the "Disabled plugins" section. Pulled out of {@link MfeInspector} so
 * the rendered subtree (and its absence on a healthy boot) is independently
 * testable. Returns `null` when no plugins are disabled — the inspector then
 * shows nothing extra. The id is rendered first (the developer-facing label),
 * the human reason next (the same one shown to the user via the degraded app
 * stub), and the errorClass tucked into a small badge so the operator can
 * cross-reference Phase 14 telemetry.
 */
const DisabledPluginsSection: React.FC<{ disabled?: DisabledPluginRecord[] }> = ({ disabled }) => {
  if (!disabled || disabled.length === 0) {
    return null;
  }
  return (
    <div data-test-subj={DISABLED_SECTION_TEST_SUBJ}>
      <EuiSpacer size="s" />
      <EuiTitle size="xxs">
        <h3>Disabled plugins ({disabled.length})</h3>
      </EuiTitle>
      <EuiText size="xs" color="subdued">
        <p>
          These plugins failed to load and are unavailable. Navigation to /app/&lt;id&gt; shows a
          status page; healthy plugins continue to work.
        </p>
      </EuiText>
      <EuiSpacer size="xs" />
      {disabled.map((record) => (
        <div
          key={record.id}
          data-test-subj={`mfeInspectorDisabled-${record.id}`}
          style={{ marginBottom: 4 }}
        >
          <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiText size="s">
                <strong>{record.id}</strong>
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiBadge color="warning" data-test-subj={`mfeInspectorDisabledClass-${record.id}`}>
                {record.errorClass}
              </EuiBadge>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiText
                size="s"
                color="subdued"
                data-test-subj={`mfeInspectorDisabledReason-${record.id}`}
              >
                {record.humanReason}
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        </div>
      ))}
      <EuiHorizontalRule margin="s" />
    </div>
  );
};

/**
 * The dev-only inspector panel. Renders a fixed, scrollable card in the corner
 * listing each MFE with a source badge and an editable `remoteEntry` field.
 * Phase 14, Story 2: also renders a "Disabled plugins" section ABOVE the
 * editable list when any remote was disabled at boot — keeping the failures
 * visible at the top of the panel where a developer is most likely to spot
 * them.
 */
export const MfeInspector: React.FC<MfeInspectorProps> = ({
  entries,
  onApply,
  onClear,
  disabled,
}) => {
  // Per-id edit buffer; an entry is only present once the user has typed into
  // that row, so untouched rows always reflect the current resolved URL.
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const draftFor = (entry: InspectorEntry): string =>
    drafts[entry.id] !== undefined ? drafts[entry.id] : entry.remoteEntry;

  return (
    <EuiPanel
      paddingSize="m"
      hasShadow
      data-test-subj="mfeInspector"
      className="osdMfeInspector"
      style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        width: 540,
        maxHeight: '60vh',
        overflowY: 'auto',
        zIndex: 10000,
      }}
    >
      <EuiTitle size="xs">
        <h2>MFE Inspector (dev)</h2>
      </EuiTitle>
      <EuiText size="xs" color="subdued">
        <p>
          Repoint a micro-frontend at a local/other URL. Dev-only — overrides are ignored in
          production.
        </p>
      </EuiText>
      <EuiHorizontalRule margin="s" />

      {/* Phase 14, Story 2 — surface every disabled plugin with its reason +
        errorClass. Section is suppressed entirely when no plugins are disabled
        (a healthy boot). */}
      <DisabledPluginsSection disabled={disabled} />

      {entries.map((entry) => {
        const isOverridden = entry.source === 'override';
        return (
          <div key={entry.id} data-test-subj={`mfeInspectorRow-${entry.id}`}>
            <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
              <EuiFlexItem grow={false}>
                <EuiText size="s">
                  <strong>{entry.id}</strong>
                </EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiBadge
                  color={isOverridden ? 'accent' : 'hollow'}
                  data-test-subj={`mfeInspectorSource-${entry.id}`}
                >
                  {isOverridden ? 'override' : 'registry/CDN'}
                </EuiBadge>
              </EuiFlexItem>
            </EuiFlexGroup>

            <EuiSpacer size="xs" />

            <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
              <EuiFlexItem>
                <EuiFieldText
                  compressed
                  fullWidth
                  value={draftFor(entry)}
                  aria-label={`Override remoteEntry URL for ${entry.id}`}
                  data-test-subj={`mfeInspectorInput-${entry.id}`}
                  onChange={(event) => {
                    // Capture the input value SYNCHRONOUSLY before passing the
                    // setDrafts updater function. React 16's synthetic events
                    // are pooled — by the time the updater function runs
                    // (during the next render), React has reused the event
                    // object and `event.target` is null. Reading the value
                    // inside the updater triggered:
                    //   TypeError: Cannot read properties of null (reading 'value')
                    // The closure-captured `value` is safe regardless of the
                    // pooled event's state.
                    const value = event.target.value;
                    setDrafts((prev) => ({ ...prev, [entry.id]: value }));
                  }}
                />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButton
                  size="s"
                  data-test-subj={`mfeInspectorApply-${entry.id}`}
                  onClick={() => onApply(entry.id, draftFor(entry))}
                >
                  Apply
                </EuiButton>
              </EuiFlexItem>
              {isOverridden && (
                <EuiFlexItem grow={false}>
                  <EuiButtonEmpty
                    size="s"
                    data-test-subj={`mfeInspectorClear-${entry.id}`}
                    onClick={() => onClear(entry.id)}
                  >
                    Reset
                  </EuiButtonEmpty>
                </EuiFlexItem>
              )}
            </EuiFlexGroup>

            <EuiSpacer size="s" />
          </div>
        );
      })}
    </EuiPanel>
  );
};

/**
 * The minimal `localStorage`-like surface the inspector writes overrides to.
 * Injectable so apply/clear are unit-testable without a DOM and tolerant of a
 * blocked/throwing store (privacy mode).
 */
export interface OverrideWritableStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * The host environment the inspector's side effects (persist + reload) act on.
 * Injectable so {@link applyOverride}/{@link clearOverride} can be tested
 * against fakes instead of the real `window.location`/`localStorage`.
 */
export interface InspectorEnv {
  /** Persisted-override store (defaults to `window.localStorage`), or undefined. */
  storage?: OverrideWritableStorage;
  /** Current page href (defaults to `window.location.href`). */
  getHref: () => string;
  /** Navigate to `href`, triggering a reload (defaults to `location.assign`). */
  navigate: (href: string) => void;
}

/**
 * Read the persisted override map ({@link OVERRIDE_STORAGE_KEY}) as a plain
 * `id → url` object. A missing/blocked store, absent key, bad JSON or non-string
 * entries all yield an empty map (mirrors `parseStorageOverrides`).
 */
function readStoredOverrides(storage?: OverrideWritableStorage): Record<string, string> {
  if (!storage) {
    return {};
  }
  let raw: string | null;
  try {
    raw = storage.getItem(OVERRIDE_STORAGE_KEY);
  } catch {
    return {};
  }
  if (!raw) {
    return {};
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (typeof parsed !== 'object' || parsed === null) {
    return {};
  }
  const out: Record<string, string> = {};
  for (const [id, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (typeof value === 'string') {
      out[id] = value;
    }
  }
  return out;
}

/** Persist `map` to `storage`, removing the key entirely when the map is empty. */
function writeStoredOverrides(
  storage: OverrideWritableStorage | undefined,
  map: Record<string, string>
): void {
  if (!storage) {
    return;
  }
  try {
    if (Object.keys(map).length === 0) {
      storage.removeItem(OVERRIDE_STORAGE_KEY);
    } else {
      storage.setItem(OVERRIDE_STORAGE_KEY, JSON.stringify(map));
    }
  } catch {
    // A blocked/throwing store simply means the override is not persisted; the
    // query-param write below still applies it for the next load.
  }
}

/** Set/delete the `mfe.<id>` param on `href`, returning the rewritten URL (or
 * the original href when it cannot be parsed). */
function withOverrideParam(href: string, id: string, url: string | undefined): string {
  let parsed: URL;
  try {
    parsed = new URL(href);
  } catch {
    return href;
  }
  if (url === undefined) {
    parsed.searchParams.delete(`mfe.${id}`);
  } else {
    parsed.searchParams.set(`mfe.${id}`, url);
  }
  return parsed.toString();
}

/**
 * Apply a dev override for `id` → `url`: persist it to `localStorage` AND set
 * the `?mfe.<id>=<url>` query param (so it is visible in the address bar and —
 * since the query WINS over storage in `parseOverrideSources` — stays
 * consistent), then reload so the next boot loads the overridden remote.
 */
export function applyOverride(id: string, url: string, env: InspectorEnv): void {
  const map = readStoredOverrides(env.storage);
  map[id] = url;
  writeStoredOverrides(env.storage, map);
  env.navigate(withOverrideParam(env.getHref(), id, url));
}

/**
 * Clear the dev override for `id`: drop it from `localStorage` and remove the
 * `?mfe.<id>` query param, then reload so the plugin reverts to its registry/CDN
 * URL.
 */
export function clearOverride(id: string, env: InspectorEnv): void {
  const map = readStoredOverrides(env.storage);
  delete map[id];
  writeStoredOverrides(env.storage, map);
  env.navigate(withOverrideParam(env.getHref(), id, undefined));
}

/** Build the default {@link InspectorEnv} bound to the real `window`, tolerant
 * of a blocked `localStorage`. */
function defaultEnv(): InspectorEnv {
  let storage: OverrideWritableStorage | undefined;
  try {
    storage = typeof window !== 'undefined' ? window.localStorage : undefined;
  } catch {
    storage = undefined;
  }
  return {
    storage,
    getHref: () => (typeof window !== 'undefined' ? window.location.href : ''),
    navigate: (href: string) => {
      if (typeof window !== 'undefined') {
        window.location.assign(href);
      }
    },
  };
}

/** Inputs to {@link mountInspector}. */
export interface MountInspectorOptions {
  /** The MFEs to list, with their resolved source. */
  entries: InspectorEntry[];
  /** Container to render into. Defaults to a fresh div appended to `body`. */
  container?: HTMLElement;
  /** Host environment for the apply/clear side effects (defaults to `window`). */
  env?: InspectorEnv;
  /**
   * Plugins the bootstrap disabled at boot (Phase 14, Story 2). Threaded
   * through {@link MfeInspectorProps.disabled}; absent / empty => no extra
   * section rendered.
   */
  disabled?: DisabledPluginRecord[];
}

/**
 * Mount the dev-only inspector into the page and wire its apply/clear actions to
 * the real persist+reload side effects. The caller (the bootstrap) invokes this
 * ONLY when the `mfe.allowOverride` gate is on, so it is never mounted in
 * production.
 *
 * @returns an `unmount` function that tears the panel down (and removes the
 *   auto-created container).
 */
export function mountInspector(options: MountInspectorOptions): () => void {
  const env = options.env ?? defaultEnv();
  const usingOwnContainer = options.container === undefined;

  let container: HTMLElement;
  if (options.container) {
    container = options.container;
  } else {
    container = document.createElement('div');
    container.id = INSPECTOR_ROOT_ID;
    container.setAttribute('data-test-subj', 'mfeInspectorRoot');
    document.body.appendChild(container);
  }

  ReactDOM.render(
    <MfeInspector
      entries={options.entries}
      disabled={options.disabled}
      onApply={(id, url) => applyOverride(id, url, env)}
      onClear={(id) => clearOverride(id, env)}
    />,
    container
  );

  return () => {
    ReactDOM.unmountComponentAtNode(container);
    if (usingOwnContainer && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  };
}
