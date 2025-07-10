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

import { BannerService } from './services/banner_service';

/**
 * Setup contract for the banner plugin.
 * Intentionally empty for now as the plugin doesn't expose any setup functionality.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface BannerPluginSetup {}

/**
 * Start contract for the banner plugin.
 */
export interface BannerPluginStart {
  bannerService: BannerService;
}
