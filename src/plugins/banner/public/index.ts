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

import './index.scss';

import { PluginInitializerContext } from '../../../core/public';
import { BannerPlugin } from './plugin';

export function plugin(initializerContext: PluginInitializerContext) {
  return new BannerPlugin(initializerContext);
}
export { BannerPluginSetup, BannerPluginStart } from './types';
