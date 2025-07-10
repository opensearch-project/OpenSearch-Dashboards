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

import { PluginInitializerContext, PluginConfigDescriptor } from '../../../core/server';
import { BannerPlugin } from './plugin';
import { configSchema, BannerPluginConfigType } from './config';

export const config: PluginConfigDescriptor<BannerPluginConfigType> = {
  exposeToBrowser: {
    enabled: true,
    text: true,
    color: true,
    iconType: true,
    isVisible: true,
    useMarkdown: true,
  },
  schema: configSchema,
};

export function plugin(initializerContext: PluginInitializerContext) {
  return new BannerPlugin(initializerContext);
}

export { BannerPluginSetup, BannerPluginStart } from './types';
