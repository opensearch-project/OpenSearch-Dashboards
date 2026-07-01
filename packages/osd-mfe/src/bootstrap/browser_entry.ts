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
 * Browser bundle entry for MFE mode.
 *
 * The server render branch (`opensearchDashboards.mfe.enabled`) emits a bootstrap
 * (src/legacy/ui/ui_render/bootstrap/bootstrap_mfe.js.hbs) that loads this bundle
 * and then calls `window.__osdBootstrapMfe__({ registryUrl, sharedDepsUrl })`.
 *
 * This module is the side-effecting entry that assigns that global; the actual
 * orchestration lives in {@link bootstrapMfe}. It is built into a self-contained
 * browser bundle and served at the configured `opensearchDashboards.mfe.bootstrapUrl`
 * (wired up in the launch harness). It is intentionally NOT re-exported
 * from the node `src/index.ts` barrel.
 */

import { bootstrapMfe, BootstrapMfeOptions } from './bootstrap_mfe';

/** The global the MFE bootstrap template invokes once this bundle has loaded. */
export interface OsdBootstrapMfeWindow {
  __osdBootstrapMfe__?: (options: BootstrapMfeOptions) => Promise<void>;
  [key: string]: unknown;
}

const bootstrapMfeWindow = (window as unknown) as OsdBootstrapMfeWindow;
bootstrapMfeWindow.__osdBootstrapMfe__ = bootstrapMfe;

export { bootstrapMfe };
